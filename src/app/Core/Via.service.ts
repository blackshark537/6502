import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { BufferService } from "./Buffer.service";
import { CPUDeviceService } from "./Cpu.service";
import { PORTBIT } from "./CPU/interfaces";
import { LcdService } from "./Lcd.service";

@Injectable({
    providedIn: 'root'
})
export class VIADeviceService {
    private IER: number = 0x00;
    private IFR: number = 0x00;
    private _PORTA$ = new BehaviorSubject<[number, number]>([0x00, 0x00]);
    private _PORTB$ = new BehaviorSubject<[number, number]>([0x00, 0x00]);
    private isRandom: boolean = true;
    private isKeboard: boolean = false;
    private isLcd: boolean = true;
    private sub$: Subscription;
    private IRQ: boolean = true;
    private NMI: boolean = false;
    private DDRA: number = 0x00;
    private DDRB: number = 0x00;

    constructor(
        private readonly bus: BufferService,
        private readonly cpu: CPUDeviceService,
        private readonly lcd: LcdService,
    ) { }

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
            if (this.IRQ) this.cpu.irq();
            if (this.NMI) this.cpu.nmi();
        }
    }

    on() {
        this.SetFlag(PORTBIT.H, 1);
        this.sub$ = this.cpu.clock.subscribe(() => {
            this.IER = this.bus.read(0x600d);
            this.IFR = this.bus.read(0x600c);
            const portb = this.bus.read(0x6000);
            const porta = this.bus.read(0x6001);
            this.DDRB = this.bus.read(0x6002);
            this.DDRA = this.bus.read(0x6003);

            if(this.isLcd)
            {
                this.lcd.notify((portb & this.DDRB), (porta & this.DDRA));
            }

            if (this.isRandom) {
                const value = Math.floor(Math.random() * 0xFF).toString();
                this.bus.write(0x60FE, parseInt(value, 16));
            }

            this._PORTB$.next([this.DDRB, portb]);
            this._PORTA$.next([this.DDRA, porta]);
        });
    }

    off() {
        if (this.sub$) this.sub$.unsubscribe();
    }

    clock()
    {
        
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
        this.isKeboard = value;
        if (this.isKeboard) {
            document.addEventListener('keydown', ev => {
                const code = ev.keyCode
                this.bus.write(0x6000, code );
            }, false);
            document.addEventListener('keypress', ev => {
                const code = 0x0a
                this.bus.write(0x6000, code );
            }, false);
            document.addEventListener('keyup', ev => {
                const code = ev.keyCode
                this.bus.write(0x6000, code );
                this.cpu.irq();
            }, false);
        } else {
            document.removeEventListener('keydown', null, false);
            document.removeEventListener('keypress', null, false);
            document.removeEventListener('keyup', null, false);
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