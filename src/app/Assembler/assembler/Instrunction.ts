import { InstructionInfo } from '../instructions';
import { ParseLine } from '../parser';
import { ParseNode } from '../parser/ParseNode';
import { bytesToHex } from './util';

/**
 * Linear intermediate representation of an instruction.
 */
export class Instruction {
    private _info: InstructionInfo;
    private _line: ParseLine;
    private _address: number;
    private _bytes: Uint8Array;
    private _value: ParseNode;

    localLabel: boolean;

    /**
     * Creates a new instruction.
     * @param {object} opts Options for the instruction.
     * @param {InstructionInfo} opts.info The 6502 instruction information.
     * @param {boolean} opts.localLabel Whether or not this instruction references
     *  a local label.
     * @param {ParseNode} opts.value The value for the instruction.
     * @param {ParseLine} opts.line The source line that generated the
     *  instruction.
     */
    constructor({ info, localLabel, value, line }) {
        this._info = info
        this._line = line

        this.address = -1
        this._bytes = new Uint8Array();
        this.value = value

        this.localLabel = localLabel
    }

    /**
     * @return {number} The address for the instruction.
     */
    get address(): number {
        return this._address
    }

    /**
     * Sets the program address for the instruction.
     * @param {number} addr The address to set.
     */
    set address(addr: number) {
        this._address = addr
    }

    /**
     * @return {string} The addressing mode for the instruction.
     */
    get addressingMode(): string {
        return this.info.addressingMode
    }

    /**
     * @return {Uint8Array} The bytes for the instruction.
     */
    get bytes(): Uint8Array {
        return this._bytes
    }

    /**
     * Sets the bytes for the instruction.
     * @param {Uint8Array} bytes The bytes to set.
     */
    set bytes(bytes: Uint8Array) {
        this._bytes = bytes
    }

    /**
     * @return {string} The hexadecimal string representation of the node's bytes.
     */
    get hex(): string {
        return bytesToHex(this.bytes)
    }

    /**
     * @return {InstructionInfo} The general 6502 information for the instruction.
     */
    get info(): InstructionInfo {
        return this._info
    }

    /**
     * @return {number} The length of the instruction, in bytes.
     */
    get length(): number {
        return this.info.length
    }

    /**
     * @return {ParseLine} The line from which the instruction originated.
     */
    get line(): ParseLine {
        return this._line
    }

    /**
     * @return {string} The name of the instruction.
     */
    get name(): string {
        return this.info.name
    }

    /**
     * @return {number} The opcode for the instruction.
     */
    get opcode(): number {
        return this.info.opcode
    }

    /**
     * @return {string} The original assembly source for the instruction.
     */
    get source(): string {
        return this.line.assembly
    }

    /**
     * @return {ParseNode} The value for the node.
     */
    get value(): ParseNode {
        return this._value
    }

    /**
     * @param {ParseNode} val A given Node.
     */
    set value(val: ParseNode) {
        this._value = val
    }
}