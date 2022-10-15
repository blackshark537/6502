
import * as instructions from './instructions.json';
/**
 * A map containing information about all valid addressing modes for all
 * 6502 instructions.
 * @example
 * // Outputs:
 * // { opcode: 105, bytes: 2, cycles: 2, pageCycles: 0, branchCycles: 0}
 * console.log(instructions.adc.immediate)
 * @type {object}
 */
 const instructionMap: Object = Object.freeze(instructions)

 /**
  * An array containing all 6502 instruction names.
  * @type {Array}
  */
 const instructionNames: readonly string[] = Object.freeze(Object.keys(instructionMap))
 
 /**
  * A set containing all 6502 instruction names.
  * @type {Set}
  */
 const instructionNameSet: Readonly<Set<string>> = Object.freeze(new Set(instructionNames))
 
 /**
  * Map of addressing mode constants to string key names.
  * @type {object}
  */
 export const AddressingMode: any = {
   Implicit: 'implied',
   Accumulator: 'accumulator',
   Immediate: 'immediate',
   ZeroPage: 'zero_page',
   ZeroPageX: 'zero_page_x',
   ZeroPageY: 'zero_page_y',
   Relative: 'relative',
   Absolute: 'absolute',
   AbsoluteX: 'absolute_x',
   AbsoluteY: 'absolute_y',
   Indirect: 'indirect',
   IndirectX: 'indirect_x',
   IndexedIndirect: 'indirect_x',
   IndirectY: 'indirect_y',
   IndirectIndexed: 'indirect_y'
 }
 
 /**
  * Error thrown when an invalid instruction is encountered.
  */
 export class InvalidInstructionError extends Error {
   /**
    * @param {string} name Name of the invalid instruction.
    */
   constructor (name: string) {
     super(`Invlaid instruction: ${name}`)
   }
 }
 
 /**
  * Error thrown when an invalid addressing mode is encountered.
  */
 export class InvalidAddressingModeError extends Error {
   /**
    * @param {string} name Name of the instruction.
    * @param {string} addressingMode Name of the addressing mode that was
    *   invalid.
    */
   constructor (name: string, addressingMode: string) {
     super(`Invalid addressing mode for ${name}: ${addressingMode}`)
   }
 }
 
 /**
  * Data class that holds the information about a particular addressing mode for
  * a 6502 instruction.
  */
 export class InstructionInfo {
    _addressingMode: string;
    _definition: any;
    _name: string;

   /**
    *
    * @param {string} name Name of the instruction.
    * @param {string} addressingMode Addressing mode for the instruction.
    * @return {InstructionInfo} The information model for the instruction with
    *   the given name and addressing mode.
    * @throws {InvalidInstructionError} If the given name is not a 6502 assembly
    *   instruction.
    * @throws {InvalidAddressingModeError} If the given addressing mode is not
    *   valid for the given instruction name.
    */
   static get (name: string, addressingMode: string) {

     if (!isValidIstruction(name)) {
       throw new InvalidInstructionError(name)
     }
     const modes = instructionMap[name]
     if (!modes[addressingMode]) {
       throw new InvalidAddressingModeError(name, addressingMode)
     }
     return new InstructionInfo(name, addressingMode, modes[addressingMode])
   }
 
   /**
    * Creates a new `InstructionInfo` object. Do not use this constructor
    * directly, instead use the static `InstructionInfo.get`.
    * @param {string} name Name of the instruction.
    * @param {object} definition Instruction addressing mode definition for the
    *   information model.
    * @see InstructionInfo.get
    */
   constructor (name: string, addressingMode: string, definition: Object) {
     this._addressingMode = addressingMode
     this._definition = definition
     this._name = name
   }
 
   /**
    * @return {string} The addressing mode for the instruction.
    */
   get addressingMode (): string {
     return this._addressingMode
   }
 
   /**
    * @return {number} The number of additional cycles that will occurr if the
    *   instruction initiates a branch.
    */
   get branchCycles (): number {
     return this._definition.branchCycles
   }
 
   /**
    * @return {number} The number of cycles it takes to execute the instruction.
    */
   get cycles (): number {
     return this._definition.cycles
   }
 
   /**
    * @return {number} The length of the instruction in bytes.
    */
   get length (): number {
     return this._definition.bytes
   }
 
   /**
    * @return {string} The name of the instruction.
    */
   get name (): string {
     return this._name
   }
 
   /**
    * @return {number} The opcode for the instruction.
    */
   get opcode (): number {
     return this._definition.opcode
   }
 
   /**
    * @return {number} The number of additional cycles that will occur if the
    *   instruction is addressed across a page boundary.
    */
   get pageCycles (): number {
     return this._definition.pageCycles
   }
 }
 
 /**
  * Determines if the given name is a valid 6502 instruction.
  * @param {string} name Name to test.
  * @return {boolean} `true` if the name is a valid 6502 instruction,
  *   `false` otherwise.
  */
 export function isValidIstruction (name: string): boolean {
   return instructionNameSet.has(name.toLowerCase())
 }