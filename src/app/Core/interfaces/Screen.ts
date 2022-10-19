import { Device } from "./Device";

export abstract class Screen extends Device {
    abstract fillText(text: string, line?: number)     : void;
    abstract turnOnOff(OnOff: boolean)  : void;
}