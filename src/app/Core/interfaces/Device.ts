export abstract class Device{
    parent: Device;
    childs: Device[] = [];
    name: string;
    
    constructor(name: string)
    {
        this.name = name;
    }

    setParent(device: Device)
    {
        this.parent = device ;
    }
    
    connectDevice(device: Device): void
    {
        device.setParent(this);
        this.childs.push(device);
    }

    removeDevice(name: string): void
    {
        this.childs.filter(child => child.name != name);
    }

    hasDevice(name: string): Device
    {
        return this.childs.find(child => child.name === name);
    }

    abstract write(address: number, data: number): void;
    abstract read(address: number): number;
    abstract reset(): void;
    abstract internalState(): Object;
}