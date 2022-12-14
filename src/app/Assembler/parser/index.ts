import { ErrorObserver } from '../assembler/AssembyError.Observer';
import { lineParser } from './lineParse';
import { ParseNode } from './ParseNode';

/**
 * Error thrown when assembly source fails to parse.
 */
export class ParseError extends Error {
  /**
   * Creates a new parse error.
   * @param {Error} err The PEG parsing error.
   * @param {object} line Information about the offending line.
   * @param {number} line.lineNumber The line number in the source where the
   *   error occurred.
   * @param {string} line.assembly The assembly source that caused the error.
   */
  constructor (err: Error, { lineNumber, assembly }) {
    const error = `Parse Error, line ${lineNumber} near "${assembly}": ${err}`;
    ErrorObserver.getInstance().error.next(error);
    super(error)
  }
}


/**
 * Information about a line of parsed 6502 assembly.
 */
export class ParseLine {

    _data: {original: string; lineNumber: number; assembly: string};

  /**
   * Creates a new parse line.
   * @param {object} params The parameters for the parse line.
   * @param {string} params.assembly The macro assembly for the line.
   * @param {number} params.lineNumber The number for the line.
   * @param {string} params.original The original source for the line.
   */
  constructor (data:{original: string; lineNumber: number; assembly: string}) {
    this._data = data;
  }

  /**
   * @return {string} The original text for the line.
   */
  get original (): string {
    return this._data.original
  }

  /**
   * @return {number} The line number in the original source.
   */
  get lineNumber (): number {
    return this._data.lineNumber
  }

  /**
   * @return {string} The stripped macro assembly for the line.
   */
  get assembly (): string {
    return this._data.assembly
  }
}


/**
 * Recursively sets the parse line for a node and all its children.
 * @param {ParseLine} line The parse line to set.
 * @param {ParseNode} node The parse node for which to set the line.
 */
function setNodeLine (line, node) {
  node.line = line
  node.children.forEach(child => setNodeLine(line, child))
}

/**
 * Parses the given assembly source.
 * @param {string} source The assembly source to parse.
 * @return {Array<ParseNode>} An array of nodes parsed from the lines of the
 *   given source.
 * @throws {ParseError} If any errors occur during parsing.
 */
export function parse (source) {
  const parsed = []
  const parseErrors = []

  const lines = source.split('\n').map((sourceLine, index) => (new ParseLine({
    original: sourceLine + '\n',
    lineNumber: index + 1,
    assembly: sourceLine
      .replace(/^\s+/, '')
      .replace(/;.*/, '')
      .replace(/\s+$/, '')
  }))).filter(line => line.assembly.length > 0)

  for (const line of lines) {
    try {
      const node = lineParser.parse(line.assembly)
      if (Array.isArray(node)) {
        node.forEach(n => {
          n.line = line
          setNodeLine(line, n)
          parsed.push(n)
        })
      } else {
        setNodeLine(line, node)
        parsed.push(node)
      }
    } catch (err) {
      throw new ParseError(err, line)
    }
  }

  return ParseNode.statementList(parsed)
}
