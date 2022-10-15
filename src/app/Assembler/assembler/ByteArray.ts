import { ParseLine } from '../parser';
import { bytesToHex } from './util';

/**
 * Linear intermediate representation for an array of arbitrary bytes. Usually
 * this form is generated by the use of the `.BYTE` command.
 */
export class ByteArray {

  private _line: ParseLine;
  private _address: number;
  private _bytes: Uint8Array;

  /**
   * Creates a new ByteArray .
   * @param {object} opts Options for the byte array.
   * @param {Array<number>} bytes Bytes for the array.
   * @param {ParseLine} line The source line that generated the array.
   */
  constructor(options: { bytes: Array<number>; line: ParseLine }) {
    const { line, bytes } = options;
    this._line = line
    this.address = -1
    this._bytes = new Uint8Array(bytes)
  }

  get line(): ParseLine
  {
    return this._line;
  }

  /**
   * @return {number} The address for the start of the byte array.
   */
  get address(): number {
    return this._address
  }

  /**
   * Sets the starting address for the byte array.
   * @param {number} addr The address to set.
   */
  set address(addr: number) {
    this._address = addr
  }

  /**
   * @return {Uint8Array} The bytes
   */
  get bytes(): Uint8Array {
    return this._bytes
  }

  /**
   * @param {Uint8Array} The bytes
   */
   setBytes(values: any) {
    this._bytes = values;
  }

  /**
   * @return {string} The hexidecimal string representation of array bytes.
   */
  get hex(): string {
    return bytesToHex(this.bytes)
  }

  /**
   * @return {number} The number of bytes in the array.
   */
  get length(): number {
    return this.bytes.length
  }
}