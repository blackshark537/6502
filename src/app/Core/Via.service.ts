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
    private IRQ: boolean = true;
    private NMI: boolean = false;

    constructor(
        private readonly bus: BufferService,
        private readonly cpu: CPUDeviceService
    ){}

    private GetFlag(f: PORTBIT): number{
        return ((this.IER & f) > 0) ? 1 : 0;
    }

    private SetFlag(f: PORTBIT, v: boolean | number): void{
        if (v)
            this.IER |= f;
        else
            this.IER &= ~f;
    }

    irq()
    {
        if(this.GetFlag(PORTBIT.H) === 1){ 
            if (this.IRQ) this.cpu.irq();
            if (this.NMI) this.cpu.nmi();
        }
    }

    on()
    {
        this.SetFlag(PORTBIT.H, 1);
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

    set canRandom(value: boolean)
    {
        this.isRandom = value;
    }

    get connectToIRQ(): boolean
    {
        return this.IRQ;
    }

    set connectToIRQ(irq: boolean)
    {
        this.IRQ = irq;
        this.NMI = false;
    }

    get connectToNMI(): boolean
    {
        return this.NMI;
    }

    set connectToNMI(nmi: boolean)
    {
        this.NMI = nmi;
        this.IRQ = false;
    }

}