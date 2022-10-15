import { AssemblyError } from "../AssemblyError";
import { Directive } from "../Directive";
import { addr } from "./addr";
import { byte } from "./byte";
import { org } from "./org";
import { word } from "./word";

/**
 * Master list of all command executors.
 * @type {object}
 */
const commandExecutors: {[name: string]: Function} = {
    'byt': byte,
    'byte': byte,
    'word': word,
    'addr': addr,
    'org': org
}

/**
 * Executes the given command and returns the result.
 * @param {Directive} command The command to execute.
 */
export function executeCommand(command: Directive) {
    const { line, name } = command
    const executor = commandExecutors[name]
    if (!executor) {
        throw new AssemblyError(`Invalid command "${name}.`, line)
    }
    return executor(command)
}
