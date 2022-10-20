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

    /**
     * 65c22 Core registers.
     */
    private IER: number = 0x00;
    private IFR: number = 0x00;
    private ddra: number = 0x00;
    private ddrb: number = 0x00;
    private portb: number = 0x00;
    private porta: number = 0x00;

    /**
     * Helper Variables
     */
    private isIRQ: boolean = true;
    private isNMI: boolean = false;
    private isRandom: boolean = true;
    private isKeboard: boolean = false;
    private isLcd: boolean = true;

    /**
     * Ports Observables
     */
    private _PORTA$ = new BehaviorSubject<[number, number]>([0x00, 0x00]);
    private _PORTB$ = new BehaviorSubject<[number, number]>([0x00, 0x00]);
    
    constructor(
    ) { 
        super(VIADeviceService.name);
        this.Set_IER_Flag(PORTBIT.DB7, 1);
    }

    reset(): void {
        this.childs.forEach(child => child.reset());
    }

    /**
     * 
     * @param address 
     * @returns 
     */
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
        if(address === 0x6002) this.ddrb = data;
        if(address === 0x6003) this.ddra = data;

        if(this.isLcd)
        {
            const lcd = this.childs.find(child => child instanceof LcdDeviceService);
            if(lcd) lcd.write((this.portb & this.ddrb), (this.porta & this.ddra));
        }

        this._PORTB$.next([this.ddrb, this.portb]);
        this._PORTA$.next([this.ddra, this.porta]);
    
    }

    // Interrup Eneable register
    private Get_IER_Flag(f: PORTBIT): number {
        return ((this.IER & f) > 0) ? 1 : 0;
    }

    private Set_IER_Flag(f: PORTBIT, v: boolean | number): void {
        if (v)
            this.IER |= f;
        else
            this.IER &= ~f;
    }

    // Interrup Flag register
    private Get_IFR_Flag(f: PORTBIT): number {
        return ((this.IFR & f) > 0) ? 1 : 0;
    }

    private Set_IFR_Flag(f: PORTBIT, v: boolean | number): void {
        if (v)
            this.IFR |= f;
        else
            this.IFR &= ~f;
    }

    dispatchiIRQ() {
        if (this.Get_IER_Flag(PORTBIT.DB7) === 1) {
            if (this.isIRQ && this.parent instanceof CPU6502) this.parent?.irq();
            if (this.isNMI && this.parent instanceof CPU6502) this.parent.nmi();
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
            addEventListener('keyup', ev => {
                ev.preventDefault();
                const code = ev.keyCode;
                this.portb = (code);
                this.dispatchiIRQ();
            }, true);
        } else {
            removeEventListener('keyup', null, true);
        }
    }

    get connectToIRQ(): boolean {
        return this.isIRQ;
    }

    set connectToIRQ(irq: boolean) {
        this.isIRQ = irq;
        this.isNMI = false;
    }

    get connectToNMI(): boolean {
        return this.isNMI;
    }

    set connectToNMI(nmi: boolean) {
        this.isNMI = nmi;
        this.isIRQ = false;
    }

}