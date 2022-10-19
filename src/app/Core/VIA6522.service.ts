import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Device } from "./interfaces/Device";
import { CPU6502 } from "./CPU6502.service";
import { PORTBIT } from "./interfaces";
import { LcdDeviceService } from "./HD44780.service";

// Needs to be refactorized, devices like keyboard and lcd are extremly couple.
@Injectable({
    providedIn: 'root'
})
export class VIADeviceService extends Device{
    
    private IRQ: boolean = true;
    private NMI: boolean = false;
    private isRandom: boolean = true;
    private isKeboard: boolean = false;
    private isLcd: boolean = true;

    // internal registers
    private IER: number = 0x00;
    private IFR: number = 0x00;
    private DDRA: number = 0x00;
    private DDRB: number = 0x00;
    private portb: number = 0x00;
    private porta: number = 0x00;

    private _PORTA$ = new BehaviorSubject<[number, number]>([0x00, 0x00]);
    private _PORTB$ = new BehaviorSubject<[number, number]>([0x00, 0x00]);
    
    constructor(
        private readonly lcd: LcdDeviceService,
    ) { 
        super(VIADeviceService.name);
        this.SetFlag(PORTBIT.H, 1);
    }

    read(address: number): number
    {
        if (this.isRandom && address === 0x60FE) {
            const value = Math.floor(Math.random() * 0xFF).toString();
            return parseInt(value, 16);
        }
        if(address === 0x6000) return this.portb;
        if(address === 0x6001) return this.porta;
    }

    write(address: number, data: number)
    {
        if(address === 0x600d) this.IER = data;
        if(address === 0x600c) this.IFR = data;
        if(address === 0x6000) this.portb = data;
        if(address === 0x6001) this.porta = data;
        if(address === 0x6002) this.DDRB = data;
        if(address === 0x6003) this.DDRA = data;

        if(this.isLcd)
        {
            this.lcd.write((this.portb & this.DDRB), (this.porta & this.DDRA));
        }

        this._PORTB$.next([this.DDRB, this.portb]);
        this._PORTA$.next([this.DDRA, this.porta]);
    
    }

    private GetFlag(f: PORTBIT): number {
        return ((this.IER & f) > 0) ? 1 : 0;
    }

    private SetFlag(f: PORTBIT, v: boolean | number): void {
        if (v)
            this.IER |= f;
        else
            this.IER &= ~f;
    }

    irq() {
        if (this.GetFlag(PORTBIT.H) === 1) {
            if (this.IRQ && this.parent instanceof CPU6502) this.parent?.irq();
            if (this.NMI && this.parent instanceof CPU6502) this.parent.nmi();
        }
    }

    get PORTA$(): Observable<[number, number]> {
        return this._PORTA$.asObservable();
    }

    get PORTB$(): Observable<[number, number]> {
        return this._PORTB$.asObservable();
    }

    get connectRandomDevice(): boolean {
        return this.isRandom;
    }

    set connectRandomDevice(value: boolean) {
        this.isRandom = value;
    }

    get connectLcd(): boolean {
        return this.isLcd;
    }
    set connectLcd(value: boolean) {
        this.isLcd = value;
    }

    get connectKeyboard(): boolean {
        return this.isKeboard;
    }

    set connectKeyboard(value: boolean) {
        if (!this.isKeboard) {
            this.isKeboard = value;
            document.addEventListener('keyup', ev => {
                ev.preventDefault();
                const code = ev.keyCode
                this.portb = (code);
                this.irq();
            }, {passive: true});
        } else {
            document.removeEventListener('keyup', null, true);
        }
    }

    get connectToIRQ(): boolean {
        return this.IRQ;
    }

    set connectToIRQ(irq: boolean) {
        this.IRQ = irq;
        this.NMI = false;
    }

    get connectToNMI(): boolean {
        return this.NMI;
    }

    set connectToNMI(nmi: boolean) {
        this.NMI = nmi;
        this.IRQ = false;
    }

}