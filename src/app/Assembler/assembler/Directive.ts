import { ParseLine } from "../parser/index";
import { ParseNode } from "../parser/ParseNode";

/**
 * Linear intermediate representation of a command.
 */
export class Directive {
    private _line: ParseLine;
    private _name: string;
    private _params: Array<ParseNode>
    /**
     * Creates a new command representation.
     * @param {object} opts Options for the command.
     * @param {ParseLine} opts.line Source line information for the command.
     * @param {string} opts.name The name of the command.
     * @param {Array<ParseNode>} opts.params The parameters to the command.
     */
    constructor(opts: { line: ParseLine, name: string, params: Array<ParseNode> }) {
        const { line, name, params } = opts;
        this._line = line
        this._name = name
        this._params = params
    }

    /**
     * @return {object} Line information for the command.
     */
    get line(): ParseLine {
        return this._line
    }

    /**
     * @return {string} The name of the command.
     */
    get name(): string {
        return this._name
    }

    /**
     * @return {Array<ParseNode>} The paramters for the command.
     */
    get params(): Array<ParseNode> {
        return this._params
    }
}