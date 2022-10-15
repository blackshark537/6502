import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { BufferService } from "./Buffer.service";
import { CPUDeviceService } from "./Cpu.service";
import { PORTBIT } from "./CPU/interfaces";

@Injectable({
    providedIn: 'root'
})
export class VIADeviceService {
    private IER: number = 0x00;
    private IFR: number = 0x00;
    private _PORTA$ = new BehaviorSubject<[number,number]>([0x00, 0x00]);
    private _PORTB$ = new BehaviorSubject<[number, number]>([0x00, 0x00]);
    private isRandom: boolean  = true;
    private sub$: Subscription;

    constructor(
        private readonly bus: BufferService,
        private readonly cpu: CPUDeviceService
    ){}

    irq()
    {
        if(!!(this.IER & PORTBIT.H)) this.cpu.irq();
    }

    on()
    {
        this.sub$ = this.cpu.clock.subscribe(()=>{
            this.IER    = this.bus.read(0x600d);
            this.IFR    = this.bus.read(0x600c);
            const portb = this.bus.read(0x6000);
            const porta = this.bus.read(0x6001);
            const ddrb  = this.bus.read(0x6002);
            const ddra  = this.bus.read(0x6003);

            if(this.isRandom){
                const value = Math.floor(Math.random()*0xFF).toString();
                this.bus.write(0x00FE, parseInt(value,16));
            }

            this._PORTB$.next([ddrb, portb]);
            this._PORTA$.next([ddra, porta]);
        });
    }

    off()
    {
        if(this.sub$) this.sub$.unsubscribe();
    }

    get PORTA$(): Observable<[number, number]>
    {
        return this._PORTA$.asObservable();
    }

    get PORTB$(): Observable<[number, number]>
    {
        return this._PORTB$.asObservable();
    }

    get canRandom(): boolean
    {
        return this.isRandom;
    }

    eneableRandom(value: boolean): void
    {
        this.isRandom = value;
    }

}