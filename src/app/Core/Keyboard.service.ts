import { Injectable } from "@angular/core";
import { Device } from "./interfaces/Device";
import { VIADeviceService } from "./VIA6522.service";

@Injectable({
    providedIn: 'root'
})
export class KeyboardDeviceService extends Device {
    private key: number = 0;

    constructor()
    {
        super(KeyboardDeviceService.name);
    }

    read(address: number): number {
        return this.key;
    }

    write(address: number, data: number): void {}
    
    reset(): void {}

    internalState(): Object {
        return {};
    }

    public TurnOn(){
        addEventListener('keyup', ev => {
            ev.preventDefault();
            this.key = ev.keyCode;
            const parent = (this.parent as VIADeviceService);
            if(!!parent){
                parent.portb = this.key;
                parent.dispatchiIRQ();
            }
            
        }, true);
    }

}