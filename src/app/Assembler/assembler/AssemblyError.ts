import { ErrorObserver } from "./AssembyError.Observer";


/**
 * Thrown when an error occurs during assembly.
 */
export class AssemblyError extends Error{
    /**
     * Creates a new AssemblyError.
     * @param {string} msg The error message.
     * @param {object} lineOptions Options describing the line for the error.
     * @param {number} lineOptions.lineNumber The number of the line on which the
     *   error occurred.
     * @param {string} assembly The assembly code that caused the error.
     */
    constructor(msg: string, { lineNumber, assembly }) {
        let error = `Assembly Error, line ${lineNumber} near "${assembly}": ${msg}`;
        ErrorObserver.getInstance().error.next(error);
        super(error);
    }
}
