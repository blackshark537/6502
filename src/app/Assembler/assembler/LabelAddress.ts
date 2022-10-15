import { ParseLine } from "../parser"

/**
 * Linear intermediate representation of a label address.
 */
export class LabelAddress {
    private _line: ParseLine;
    private _to: string;
    private _address: number;
    /**
    * Creates a new ByteArray .
    * @param {object} opts Options for the address label to go.
    * @param {string} to address label to go.
    * @param {ParseLine} line The source line that generated the array.
    */
    constructor(options: { to: string; line: ParseLine }) {
        const { line, to } = options;
        this._line = line
        this.address = -1
        this.addressTo = -1
        this._to = to
    }

    /**
     * @return {number} The address for the start.
     */
    get address(): number {
        return this._address
    }

    /**
     * Sets the starting address.
     * @param {number} addr The address to set.
     */
    set address(addr: number) {
        this._address = addr
    }

    /**
    * @return {number} The address to go.
    */
    get addressTo(): number {
        return this._address
    }

    /**
     * Sets the starting address to go.
     * @param {number} addr The address to set.
     */
    set addressTo(addr: number) {
        this._address = addr
    }

    /**
    * @return {string} The bytes
    */
    get to(): string {
        return this._to
    }
}