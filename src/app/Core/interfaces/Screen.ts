import { Device } from "./Device";

export abstract class Screen extends Device {
    abstract fillText(line1?: string, line2?: string)     : void;
    abstract turnOnOff(OnOff: boolean)  : void;
}