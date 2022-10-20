import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Device } from "./interfaces/Device";

@Injectable({
    providedIn: 'root'
})
export class MemoryService extends Device {
   
    private ram: Uint8Array;
    private bu$ = new BehaviorSubject<{[addr: string]: string[]}>({})
    private from=0x0000; 
    private to=0x00ff;

    constructor() {
        super(MemoryService.name);
        this.reset();
    }

    reset()
    {
        this.ram = new Uint8Array(0x1ffff);
        this.refresh();
    }

    From(address: number)
    {
        if(address > 0xffff || address >= this.to) return;
        this.from = address
    }

    To(address: number)
    {
        if(address > 0xffff || address <= this.from) return;   
        this.to = address
    }

    FromTo(from: number, to: number): void
    {
        if(to > 0xffff ) return;
        if(to <= from) return;
        this.to = to;
        this.from = from;
    }
    
    getBus(): Observable<{[address: string]: string[]}>
    {
        return this.bu$.asObservable();
    }

    /**
     * Debug the memory. 
     * This function shows a table with the values
     * on memory for a specific range of addresses indicated through
     * parameter form and to.
     */
    refresh(): void{
        const memory: {[address: string]: string[]} = {};
        for (let address = this.from; address <= this.to; ++address) {
            const hi = (address).toString(16);
            if(!memory[hi]) memory[hi] = [];
            for (let i = 0x0000; i <= 0x000f; ++i) {   
                memory[hi].push( this.read(address+i).toString(16) );
            }
            address += 0x000f;
        }
        
        this.bu$.next(memory);
    }

    /**
     * Clear the memory.
     * This function put all values in memory to 0x00.
     */
    clear(){
        this.ram.fill(0x00);
        this.refresh();
    }

    /**
     * Memory Read.
     * This function performs a memory read operation.
     * @param address Number 
     * @returns 
     */
    read(address: number): number{
        if(address >= 0x0000 && address <=0xFFFF){
            let data = this.ram[address] & 0xFF;
            return data;
        }

        throw new Error(`Error: Address is out of  Bound`);
    }

    /**
     * Memory Write.
     * This function performs a memory write operation.
     * Alert: memory address needs to be withing 0x0000 and 0xFFFF.
     * @param address Number
     * @param data Number
     */
    write(address: number, data: number): void{
        
        if(address >= 0x0000 && address <=0xFFFF){
            this.ram[address] = data & 0xff;
            return;
        }

        throw new Error(`Error: Address is out of  Bound`);
    }

    setParent(parent: Device): void {
        
    }

    connectDevice(device: Device): void {
        
    }
}