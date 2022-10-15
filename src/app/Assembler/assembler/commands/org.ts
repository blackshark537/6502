import { AssemblyError } from "../AssemblyError"
import { Directive } from "../Directive"

/**
 * Executes the `.org` command and returns the new instruction address generated
 * by the command.
 * @param {Directive} command The org command to execute.
 * @return {number} The new instruction address.
 */
export function org(command: Directive): number {
    const { params } = command
    if (params.length !== 1 || !params[0].isNumber()) {
        throw new AssemblyError(`.org expects a single numeric command`, command.line)
    }
    return params[0].data.value
}