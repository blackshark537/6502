import { Injectable } from "@angular/core";
import { interval, Observable, Subscription } from "rxjs";
import { MemoryService } from "./Memory.service";
import { CPU6502 } from "./CPU6502.service";
import { DeviceInfo, DeviceState } from "./interfaces";
import { VIADeviceService } from "./VIA6522.service";
import { LcdDeviceService } from "./HD44780.service";
import { KeyboardDeviceService } from "./Keyboard.service";

@Injectable({
    providedIn: 'root'
})
export class ComputerService {
    private freq: number = 1;

    private _clock$: Observable<number>;
    private sub$: Subscription;

    constructor(
        private cpu: CPU6502,
        private memory: MemoryService,
        private lcd: LcdDeviceService,
        private via: VIADeviceService,
        private keyboard: KeyboardDeviceService
    ) { 
        this.cpu.connectDevice(this.memory);
        this.cpu.connectDevice(this.via);
        this.via.connectDevice(this.lcd);
        this.via.connectDevice(this.keyboard);
        this.cpu.freq = (1000/this.freq).toFixed(0);
        this._clock$ = interval(this.freq);
    }

    get vendor(): DeviceInfo
    {
        return this.cpu.deviceInfo();
    }

    get status(): DeviceState
    {
        return this.cpu.internalState() as any;
    }

    get clock$(): Observable<number>
    {
        return this._clock$;
    }

    run()
    {
        this.stop();
        this.cpu.reset();
        this.via.reset();
        this.sub$ = this._clock$.subscribe(_=>{
            this.cpu.clock();
            this.memory.refresh();
            if(this.cpu.isComplete) this.stop();    
        });
    }

    fastRun()
    {
        this.stop();
        this.cpu.reset();
        this.via.reset();
        while(!this.cpu.isComplete){
            this.cpu.clock();
            this.memory.refresh();
        }
    }

    stop()
    {
        if(this.sub$) this.sub$.unsubscribe();
    }

    tick()
    {
        if(this.cpu.isComplete) return;
        this.cpu.clock();
        this.memory.refresh();
    }

    restart()
    {
        this.cpu.reset();
        this.via.reset();
    }

    irq()
    {
        this.cpu.irq();
    }

    nmi()
    {
        this.cpu.nmi();
    }
}