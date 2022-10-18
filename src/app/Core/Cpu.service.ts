import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { BufferService } from "./Buffer.service";
import { CPU } from "./CPU/CPU6502";
import { DeviceInfo, DeviceState } from "./CPU/interfaces";

@Injectable({
    providedIn: 'root'
})
export class CPUDeviceService {
    private speed: number = 3;
    private cpu: CPU;
    private isStop: boolean = false;

    public interval$ = new BehaviorSubject(0);

    constructor(
        private buffer: BufferService
    ) { 
        this.cpu = CPU.getInstance();
        this.cpu.connectBus(this.buffer);
        //this.interval$ = interval(this.speed);
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
        return this.interval$.asObservable();
    }

    get sync(): number
    {
        return this.speed;
    }

    run()
    {
        this.isStop = false;
        this.cpu.reset();
        let frame = () =>
        {
            this.cpu.clock();
            this.buffer.load();
            this.interval$.next(1);
            if(this.cpu.isComplete) this.stop();
            if (!this.isStop) requestAnimationFrame(frame);
        }
        frame();
    }

    stop()
    {
        this.isStop = true;
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