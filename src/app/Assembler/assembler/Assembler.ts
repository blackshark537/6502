import { parse } from "../parser"
import { assemble } from "./Assemble"
import { ByteArray } from "./ByteArray"
import { Instruction } from "./Instrunction"

/**
 * Converts a number to a hexadecimal string of bytes.
 * @param {number} number The number to convert.
 * @return {string} A hex string.
 */
function toHexString (number: number): string {
  const hex = number.toString(16)
  return `${number % 2 === 1 ? '0' : ''}${hex}`.toUpperCase()
}

/**
 * Basic 6502 Assembler.
 * @author Ryan Sandor Richards
 * @port by Berlin Santos Cruz
 */
export class Assembler {
  

  /**
   * Converts the given 6502 assembly source into a string of hexadecimal digits
   * for use with hex editors.
   * @param {string} source Assembly source to convert to a byte string.
   * @return {string} A string representation of the assembled bytes for the
   *   given source.
   */
  static toHexString (source, download=false) {
    const parsedTree = parse(source);
    const lir = assemble(parsedTree);
    
    const nonLabels = lir.filter(v => (
      v instanceof Instruction ||
      v instanceof ByteArray
    ))

    const hex = []
    nonLabels.forEach(nonLabel => {
      if (!nonLabel.bytes || nonLabel.bytes.length === 0) {
        const { lineNumber } = nonLabel.line
        const { source } = nonLabel
        throw new Error(
          `Unable to generate hex for line ${lineNumber} "${source}".`
        )
      }

      
      let _hex = "";
      for(let i=0; i <= nonLabel.hex.length; ++i)
      {
        if(i%2===0) _hex += nonLabel.hex.slice(i, i+2) + " ";
      }
      hex.push( download? _hex : `${nonLabel._address.toString(16)}: ${_hex}` );
    })
    
    return download? hex.join(' ') : hex.join('\n');
  }

  /**
   * Parses and assembles the given 6502 assembly source and outputs the result
   * to the console.
   * @param {string} source Assembly source to inspect.
   */
  static inspect (source) {
    const root = parse(source)
    assemble(root).forEach(lir => {
      const address = toHexString(lir.address)
      if (lir instanceof Instruction) {
        console.log(address, lir.hex, '\t', lir.source)
      } else {
        console.log(address, (lir.local ? '@' : '') + lir.name + ':')
      }
    })
  }

}