
/**
 * Instruction Interface Model
 */
 export interface iOpcode{
    name: string;
    exec(): number;
    addMode(): number;
    cicle: number;
    opcode?: number;
}

/**
 * Cpu Status Flags.
 */
export enum FLAGS6502
{
    C = (1 << 0),	// Carry Bit
    Z = (1 << 1),	// Zero
    I = (1 << 2),	// Disable Interrupts
    D = (1 << 3),	// Decimal Mode (unused in this implementation)
    B = (1 << 4),	// Break
    U = (1 << 5),	// Unused
    V = (1 << 6),	// Overflow
    N = (1 << 7),	// Negative
};

export enum PORTBIT
{
    DB0 = (1 << 0),	// Bit 0
    DB1 = (1 << 1),	// Bit 1
    DB2 = (1 << 2),	// Bit 2
    DB3 = (1 << 3),	// Bit 3
    DB4 = (1 << 4),	// Bit 4
    DB5 = (1 << 5),	// Bit 5
    DB6 = (1 << 6),	// Bit 6
    DB7 = (1 << 7),	// Bit 7
};

export enum HD44780
{
    A  = (1 << 0),	// Bit 0
    B  = (1 << 1),	// Bit 1
    C  = (1 << 2),	// Bit 2
    D  = (1 << 3),	// Bit 3
    N  = (1 << 4),	// Bit 4
    RS = (1 << 5),	// Selects registers. 0: Instruction register (for write) 1: Data register
    RW = (1 << 6),	// Selects read or write. 0: Write 1: Read
    E  = (1 << 7),	// Starts data read/write
};

export interface HD44780_STATUS{
    cursor  : number;
    address : number;
    offset1 : number;
    offset2 : number;
    busy    : number;
}

export interface DeviceInfo { device: string; fabricant: string; year: string; clock: string };

export interface DeviceState{
    STATUS: {
        N: number;
        V: number;
        U: number;
        B: number;
        D: number;
        I: number;
        Z: number;
        C: number;
    };
    A: string;
    X: string;
    Y: string;
    PC: string;
    STACK: string;
    CLOCKS: number | string;
    CYCLES: number;
    CODE: string;
    DATA: string;
    NAME: string;
    FINISH: boolean;

}