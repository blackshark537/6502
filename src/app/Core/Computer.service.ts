import { Injectable } from "@angular/core";
import { interval, Observable, Subscription } from "rxjs";
import { MemoryService } from "./Memory.service";
import { CPU6502 } from "./CPU6502.service";
import { DeviceInfo, DeviceState } from "./interfaces";
import { VIADeviceService } from "./VIA6522.service";
import { LcdDeviceService } from "./HD44780.service";

@Injectable({
    providedIn: 'root'
})
export class ComputerService {
    private freq: number = 3;

    private sub$: Subscription;
    public clock$: Observable<any>;

    constructor(
        private cpu: CPU6502,
        private buffer: MemoryService,
        private lcd: LcdDeviceService,
        private via: VIADeviceService
    ) { 
        this.cpu.connectDevice(this.buffer);
        this.cpu.connectDevice(this.via);
        this.via.connectDevice(this.lcd);
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
            this.buffer.load();
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
        this.buffer.load();
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