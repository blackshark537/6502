
export abstract class Bus{
    abstract write(address: number, data: number): void;
    abstract read(address: number): number;
}