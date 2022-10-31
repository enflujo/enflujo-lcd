/**
 * Una función asincrónica que espera un tiempo definido antes de continuar.
 *
 * @param {number} tiempo Tiempo en milisegundos que debe esperar.
 * @returns {Promise<void>}
 */
export const esperar = async (tiempo: number): Promise<void> => {
  return new Promise((respuesta) => {
    setTimeout(() => {
      respuesta();
    }, tiempo);
  });
};

/**
 * Convierte código binario a código HEX.
 * 
 * @ejemplo
 * ```js
 * binarioAHex(`01010,
                11111,
                11111,
                01110,
                00100,
                00000,
                00000,
                00100`)
  // Devuelve ['0xa','0x1f','0x1f','0xe','0x4','0x0','0x0','0x4']
  // representando cada linea del binario separada por comas.
 * ```
 *
 * @param {string} codigoBinaro Código binario en texto y cáda bloque separado por comas.
 * @returns  {[string]} Array con códigos hex.
 */
export const binarioAHex = (codigoBinaro: string) => {
  const lineas = codigoBinaro.split(",");
  return lineas.map((linea) => {
    return "0x" + parseInt(linea.replace(/\n +/g, ""), 2).toString(16);
  });
};
