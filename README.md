# Libreria @enflujo/lcd

Ver ejemplos en https://github.com/enflujo/enflujo-lcd-ejemplos

## Instalación

```bash
yarn add @enflujo/lcd
```

## Uso

Estos son los métodos que expone la librería:

### Ejemplo básico

Lo más sencillo posible.

```js
import { LCD_Sensual } from '@enflujo/lcd';

const lcd = new LCD_Sensual();

async function inicio() {
  await lcd.iniciar();
  await lcd.imprimir('Hola!');
  await lcd.cerrar();
}

inicio();
```

| Parámetros | Tipo     | Predeterminado |
| ---------- | -------- | -------------- |
| filas      | `number` | `2`            |
| columnas   | `number` | `16`           |
| numeroBus  | `number` | `1`            |
| dirección  | `hex`    | `0x27`         |

### `iniciar()`

Iniciar la comunicación con la pantalla. Debe ser siempre lo primero que se ejecuta.

```js
await lcd.iniciar();
```

### `imprimir(texto, fila?, columna?)`

Imprime el texto en la pantalla.

```js
await lcd.imprimir('.:: EnFlujo ::.');
```

También se puede pasar la posición donde imprimir, el segundo parámetro es la fila y el tercero la columna:

```js
// Imprime :) en la segunda fila, columna 5
await lcd.imprimir(':)', 2, 5);
```

Si no se pasan parámetros del fila y columna, los textos se van imprimiendo en orden:

```js
await lcd.imprimir('H'); // fila 1, columna 1
await lcd.imprimir('o'); // fila 1, columna 2
await lcd.imprimir('l'); // fila 1, columna 3
await lcd.imprimir('a'); // fila 1, columna 4
```

| Parámetros | Tipo     | Predeterminado         |
| ---------- | -------- | ---------------------- |
| texto      | `string` |                        |
| fila       | `number` | _donde esté el cursor_ |
| columna    | `number` | _donde esté el cursor_ |

### `cursor()`

Muestra un cursor `_` en la posición donde va a imprimir el siguiente carácter.

```js
await lcd.cursor();
```

### `apagarCursor()`

Deja de mostrar el cursor.

```js
await lcd.apagarCursor();
```

#### `parpadearCursor`

También se puede mostrar el cursor parpadeando si se cambia este parámetro.

```js
// No es asincrónico entonces se puede ejecutar sin el await
lcd.parpadearCursor = true;
```

### `borrar()`

Borra todo lo que esté en la pantalla.

```js
await lcd.borrar();
```

### `irAlInicio()`

En cualquier momento, podemos devolver el cursos a la posición inicial (fila 1, columna 1) y reescribir encima de lo que esté allí.

```js
await lcd.irAlInicio();
```

### `apagarLuz()`

Apaga la luz detrás de la pantalla LCD.

```js
await lcd.apagarLuz();
```

### `prenderLuz()`

Vuelve a prender la luz si la apagamos antes. Al iniciar la LCD se prende sola, esto es útil sólo si apagamos an algún momento la pantalla con `apagarLuz()`

```js
await lcd.prenderLuz();
```

### `crearCaracter(posicion, datos)`

Crear caracteres especiales.

```js
// La librería recibe los datos de cada una de los 8 filas en código HEX.
const corazon = ['0xa', '0x1f', '0x1f', '0xe', '0x4', '0x0', '0x0', '0x4'];
await lcd.crearCaracter(0, corazon);
```

También se puede importar una función que ayuda a convertir código binario a HEX ya que es más fácil de ver lo que se está dibujando en bloques de código binario:

```js
import { LCD_Sensual, binarioAHex } from '@enflujo/lcd';

const corazon = binarioAHex(`01010,
                             11111,
                             11111,
                             01110,
                             00100,
                             00000,
                             00000,
                             00100`);

await lcd.crearCaracter(0, corazon);
```

| Parámetros | Tipo          | Predeterminado |
| ---------- | ------------- | -------------- |
| posicion   | `number`      |                |
| datos      | `Array` [hex] |                |

### `obtenerCaracter(posicion)`

Luego de crear el carácter, se puede sacar el carácter de la memoria e imprimirlo:

```js
const corazon = ['0xa', '0x1f', '0x1f', '0xe', '0x4', '0x0', '0x0', '0x4'];
await lcd.crearCaracter(0, corazon);

// Imprime el corazón que se guardó antes en la posición 0
await lcd.imprimir(lcd.obtenerCaracter(0));
```

| Parámetros | Tipo     | Predeterminado |
| ---------- | -------- | -------------- |
| posicion   | `number` |                |

Las LCD con controlador i2c por lo general tienen una pequeña memoria RAM que permite guardar 8 caracteres especiales al tiempo. Pero se pueden ir generando nuevos en el proceso de imprimir:

```js
// Acá ocupamos los 8 caracteres posibles en la memoria
await lcd.crearCaracter(0, corazon);
await lcd.crearCaracter(1, e);
await lcd.crearCaracter(2, n);
await lcd.crearCaracter(3, f);
await lcd.crearCaracter(4, l);
await lcd.crearCaracter(5, u);
await lcd.crearCaracter(6, j);
await lcd.crearCaracter(7, o);

// Imprimir estos 8
await lcd.imprimir(lcd.obtenerCaracter(0));
await lcd.imprimir(lcd.obtenerCaracter(1));
await lcd.imprimir(lcd.obtenerCaracter(2));
await lcd.imprimir(lcd.obtenerCaracter(3));
await lcd.imprimir(lcd.obtenerCaracter(4));
await lcd.imprimir(lcd.obtenerCaracter(5));
await lcd.imprimir(lcd.obtenerCaracter(6));
await lcd.imprimir(lcd.obtenerCaracter(7));

// Crear un noveno carácter y guardarlo en la RAM en la posición 0
// Perdemos de la memoria el "corazon" pero ya lo imprimimos antes

await lcd.crearCaracter(0, noveno);
await lcd.imprimir(lcd.obtenerCaracter(0));
```

### `cerrar()`

Cierra la comunicación con la pantalla. No es indispensable pero es bueno liberar de la memoria de la Raspberry la comunicación con la LCD.

Si queremos imprimir algo estático (no en bucle infinito como una animación), podemos cerrar la comunicación al final del programa (ver [ejemplo básico](#ejemplo-básico) al inicio de esta documentación)

```js
await lcd.cerrar();
```

### `esperar(tiempo)`

La librería también expone una función que permite suspender antes de seguir con la siguiente linea del código, es útil para animar secuencias:

```js
import { LCD_Sensual, esperar } from '@enflujo/lcd';

const lcd = new LCD_Sensual();

async function inicio() {
  await lcd.iniciar();
  await lcd.imprimir('laboratorio');
  await esperar(1000); // Esperar 1 segundo antes de seguir
  await lcd.imprimir('.:: EnFlujo ::.', 2, 7);
  await lcd.cerrar();
}

inicio();
```
