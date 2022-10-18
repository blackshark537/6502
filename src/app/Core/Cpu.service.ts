import { Injectable } from "@angular/core";
import { BehaviorSubject, interval, Observable, Subscription } from "rxjs";
import { BufferService } from "./Buffer.service";
import { CPU } from "./CPU/CPU6502";
import { DeviceInfo, DeviceState } from "./CPU/interfaces";

@Injectable({
    providedIn: 'root'
})
export class CPUDeviceService {
    private speed: number = 3;
    private cpu: CPU;
    private sub$: Subscription;

    public interval$: Observable<any>;

    constructor(
        private buffer: BufferService
    ) { 
        this.cpu = CPU.getInstance();
        this.cpu.connectBus(this.buffer);
        this.interval$ = interval(this.speed);
    }

    get vendor(): DeviceInfo
    {
        this.cpu.speed = (1000/this.speed).toFixed(0) ;
        return this.cpu.deviceInfo();
    }

    get status(): DeviceState
    {
        return this.cpu.cpu_status() as any;
    }

    get clock(): Observable<number>
    {
        return this.interval$;
    }

    get sync(): number
    {
        return this.speed;
    }

    run()
    {
        this.stop();
        this.cpu.reset();
        this.sub$ = this.interval$.subscribe(_=>{
            this.cpu.clock();
            this.buffer.load();
            if(this.cpu.isComplete) this.stop();
            //if (!this.isStop) requestAnimationFrame(frame);
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