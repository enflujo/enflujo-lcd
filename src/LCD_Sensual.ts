/**
 * Referentes:
 * Un buen tutorial de Arduino sobre i2c: https://lastminuteengineers.com/i2c-lcd-arduino-tutorial/
 * Datasheet de los i2c: https://www.ti.com/lit/slva704
 * Librería "LiquidCrystal" para Arduino: https://github.com/fdebrabander/Arduino-LiquidCrystal-I2C-library/blob/master/LiquidCrystal_I2C.cpp
 */

import i2c, { I2CBus } from 'i2c-bus';
import dormir from 'sleep';
const { usleep } = dormir;

const CHAR = 1;
const CMD = 0;
const APAGAR = 0x00;
const RS = 0x01;
const E = 0x04;
//  const D4 = 0x10;
const D5 = 0x20;
const D6 = 0x40;
const D7 = 0x80;
const CONTROL_PANTALLA = 0x08;
const PRENDER_PANTALLA = E;
const BORRAR_PANTALLA = RS;
const VOLVER_AL_INICIO = 0x02;
const CURSOR_PRENDIDO = 0x02;
const PARPADEO_PRENDIDO = RS;

const LINEAS = [D7, 0xc0, 0x94, 0xd4];

export class LCD_Sensual {
  #filas: number;
  #columnas: number;
  #numeroBus: number;
  #direccion: number;
  #i2c: I2CBus | null;
  #pantallaIniciada: boolean;
  #cursor: boolean;
  #estadoLuz: number;
  parpadearCursor: boolean;

  constructor(filas = 2, columnas = 16, numeroBus = 1, direccion = 0x27) {
    this.#numeroBus = numeroBus;
    this.#direccion = direccion;
    this.#filas = filas;
    this.#columnas = columnas;
    this.#i2c = null;
    this.parpadearCursor = false;
    this.#pantallaIniciada = false;
    this.#estadoLuz = CONTROL_PANTALLA;
    this.#cursor = false;
  }

  iniciar(): Promise<void> {
    return new Promise((responder, rechazar) => {
      // Si ya se inicio la pantalla podemos salir inmediatamente.
      if (this.#pantallaIniciada) return;

      this.#i2c = i2c.open(this.#numeroBus, async (error) => {
        if (error) {
          rechazar(error);
        } else {
          try {
            await this.#escribir4(0x33, CMD);
            await this.#escribir4(0x32, CMD);
            await this.#escribir4(0x06, CMD);
            await this.#escribir4(0x28, CMD);
            await this.#escribir4(BORRAR_PANTALLA, CMD);
            await this.#escribir4(D5 | 0x00 | CONTROL_PANTALLA | E, CMD);
            await this.#escribir(CONTROL_PANTALLA | E, CMD);
            await this.#escribir(E | 0x02, CMD);
            await this.#escribir(BORRAR_PANTALLA, CMD);
            await this.#escribir(CONTROL_PANTALLA, CHAR);

            this.#pantallaIniciada = true;
            await this.borrar();
            responder();
          } catch (error) {
            rechazar(error);
          }
        }
      });
    });
  }

  async imprimir(texto: string, linea: number, columna: number) {
    this.#revisarPantallaIniciada();

    // Si sólo se pasa un numero de linea.
    if (linea && !columna) {
      if (linea <= this.#filas) {
        await this.#escribir(LINEAS[linea - 1], CMD);
      } else {
        throw new Error(`La linea ${linea} supera las definidas (${this.#filas})`);
      }
    }

    // Si se pasan linea y columna, mover cursor a esa posición.
    if (linea && columna) {
      if (linea <= this.#filas) {
        await this.#ubicarCursor(columna - 1, linea - 1);
      } else {
        throw new Error(`La linea ${linea} supera las definidas (${this.#filas})`);
      }
    }

    // Asegurarse que lo que se imprima es texto.
    let textoParaImprimir = texto.toString();

    const disponiblesX = columna ? this.#columnas - columna + 1 : this.#columnas;

    if (textoParaImprimir.length > disponiblesX) {
      textoParaImprimir = textoParaImprimir.substring(0, disponiblesX);
    }

    for (let i = 0; i < textoParaImprimir.length; i++) {
      const caracter = textoParaImprimir[i].charCodeAt(0);

      try {
        await this.#escribir(caracter, CHAR);
      } catch (error) {
        console.error(error);
        // throw new Error();
      }
    }
  }

  async borrar() {
    await this.#escribir(BORRAR_PANTALLA, CMD);
    usleep(2000);
  }

  async irAlInicio() {
    await this.#escribir(VOLVER_AL_INICIO, CMD);
    usleep(2000);
  }

  async apagarLuz() {
    this.#estadoLuz = APAGAR;
    await this.#escribir(CONTROL_PANTALLA | APAGAR, CMD);
  }

  async prenderLuz() {
    this.#estadoLuz = CONTROL_PANTALLA;
    await this.#escribir(CONTROL_PANTALLA | PRENDER_PANTALLA, CMD);

    // Cuando se apaga la pantalla se borra el cursor,
    // lo volvemos a activar si esta prendido el cursor.
    if (this.#cursor) {
      await this.cursor();
    }
  }

  async crearCaracter(posicion: number, datos: readonly [number]) {
    this.#revisarPantallaIniciada();

    try {
      posicion &= 7; // Las i2c sólo pueden guardar 8 caracteres al tiempo en la RAM.
      await this.#escribir(D6 | (posicion << 3), CMD);

      for (let i = 0; i < 8; i += 1) {
        await this.#escribir(datos[i], CHAR);
      }

      await this.#escribir(D7, CMD);
    } catch (error) {
      console.error(error);
      throw new Error('Problema creando caracter especial.');
    }
  }

  obtenerCaracter(posicion: number) {
    return String.fromCharCode(posicion);
  }

  /**
   * Prender cursor _
   */
  async cursor() {
    this.#cursor = true;
    const parpadeando = this.parpadearCursor ? PARPADEO_PRENDIDO : APAGAR;
    await this.#escribir(CONTROL_PANTALLA | PRENDER_PANTALLA | CURSOR_PRENDIDO | parpadeando, CMD);
  }

  async apagarCursor() {
    this.#cursor = false;
    await this.#escribir(CONTROL_PANTALLA | PRENDER_PANTALLA | APAGAR, CMD);
  }

  cerrar(): Promise<void> {
    return new Promise((responder, rechazar) => {
      this.#revisarPantallaIniciada();
      if (!this.#i2c) return;

      this.#i2c.close((error) => {
        if (error) {
          console.log(error);
          rechazar(error);
        }

        responder();
      });
    });
  }

  #revisarPantallaIniciada() {
    if (!this.#pantallaIniciada) {
      throw new Error('Antes de usar la pantalla debe iniciarla con el método iniciar()');
    }
  }

  async #ubicarCursor(columna: number, fila: number) {
    const pasosFila = [0x00, D6, 0x14, 0x54];
    await this.#escribir(D7 | (pasosFila[fila] + columna), CMD);
  }

  async #escribir4(x: number, comando: number) {
    const a = x & 0xf0; // Nibble superior

    await this.#enviarByte(a | this.#estadoLuz | comando);

    await this.#enviarByte(a | E | this.#estadoLuz | comando); // Pulso Arriba
    usleep(1); // Comando necesita esperar al menos 450 nanosegundos
    await this.#enviarByte(a | this.#estadoLuz | comando); // Pulso Abajo
    usleep(50); // Comando necesita > 37 microsegundos
  }

  async #escribir(x: number, comando: number) {
    try {
      await this.#escribir4(x, comando);
      await this.#escribir4(x << 4, comando);
    } catch (error) {
      console.error('Problema escribiendo a la i2c', error);
      // throw new Error("Problema escribiendo a la i2c");
    }
  }

  #enviarByte(x: number): Promise<void> {
    return new Promise((responder, rechazar) => {
      if (!this.#i2c) return;
      usleep(2000);
      this.#i2c.sendByte(this.#direccion, x, (error) => {
        if (error) rechazar(error);
        responder();
      });
    });
  }
}
