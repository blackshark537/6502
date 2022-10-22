import { Injectable } from "@angular/core";
import { interval, Observable, Subscription } from "rxjs";
import { MemoryService } from "./Memory.service";
import { CPU6502 } from "./CPU6502.service";
import { DeviceInfo, DeviceState } from "./interfaces";
import { VIADeviceService } from "./VIA6522.service";
import { LcdDeviceService } from "./HD44780.service";
import { LcdComponent } from "../home/lcd/lcd.component";
import { KeyboardDeviceService } from "./Keyboard.service";

@Injectable({
    providedIn: 'root'
})
export class ComputerService {
    private freq: number = 3;

    public clock$: Observable<any>;
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
        this.clock$ = interval(this.freq);
    }

    get vendor(): DeviceInfo
    {
        this.cpu.freq = (1000/this.freq).toFixed(0);
        return this.cpu.deviceInfo();
    }

    get status(): DeviceState
    {
        return this.cpu.cpu_status() as any;
    }

    get clock(): Observable<number>
    {
        return this.clock$;
    }

    get sync(): number
    {
        return this.freq;
    }

    run()
    {
        this.stop();
        this.cpu.reset();
        this.via.reset();
        this.sub$ = this.clock$.subscribe(_=>{
            this.cpu.clock();
            this.memory.refresh();
            if(this.cpu.isComplete) this.stop();
        });
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