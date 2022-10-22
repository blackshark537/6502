import { FLAGS6502, iOpcode } from "./interfaces";
import { Device } from "./interfaces/Device";
import { VIADeviceService } from "./VIA6522.service";
import { MemoryService } from "./Memory.service";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class CPU6502 extends Device{

    // CPU Core registers.
	// This is all the 6502 has.
	private   a:                number  = 0x00;	    // A Register Accumulator
	private   x:                number  = 0x00;	    // X Register
	private   y:                number  = 0x00;	    // Y Register
	private   stkp:             number  = 0x00;	    // Stack Pointer (points to location on bus)
	private   pc:               number  = 0x0000;   // Program Counter
	private   status:           number  = 0x00;	    // Status Register
    private   opcode:           number  = 0x00;     // instruction register
    private   fetched:          number  = 0x00;     // input data latch
    private   pcl:              number  = 0x00;     // Program Counter Low Register
    private   pch:              number  = 0x00;     // Program Counter High Register
    private   instruction_name: string  =   '';     // instruction name
    private   mlb:              number  =    1;     // Memory Lock Block

    // Helper Variables;
    private addr_rel:       number = 0x0000;
    private addr_abs:       number= 0x0000;
    private cycles:         number  = 0x00;
    private clock_count:    number = 0x0000;
    private stop:           boolean = false;

    /**
     * Cpu clock Frequency.
     * @constant freq Number
     */
     public freq: string  = '1000000';
    
    constructor() {
        super(CPU6502.name);
    }

    /**
     * Device Information.
     * @returns CPU Device Information
     */
    public deviceInfo(){
        const device = {
            device: '65C02',
            fabricant: 'BSC',
            year: '2022',
            clock: this.freq+' Hz'
        }
        return device;
    }


    /**
     * This is the disassembly function. Its workings are not required for emulation.
     * It is merely a convenience function to turn the binary instruction code into
     * human readable form. Its included as part of the emulator because it can take
     * advantage of many of the CPUs internal operations to do this. 
     * @param nStart Number memory address to start decoding.
     * @param nStop Number memory address to stop decoding.
     * @returns Object with the disassambled code.
     */
    public disassemble(nStart: number, nStop: number){
        let addr      = nStart;
        let value     = 0x00;
        let lo        = 0x00; 
        let hi        = 0x00;
        let line_addr = 0;
        const mapLines: {[name: string]: any} = {};
        

        while (addr < nStop)
        {
            line_addr = addr;
            // Prefix line with instruction address
            let sInst = "";
            // Read instruction, and get its readable name
            const opcode = this.read(addr); 
            let msb = opcode >> 4;
            let lsb = opcode & 0x0F;
            addr++;
            sInst += opcode?.toString(16) +" : ";
            sInst += this.instructions[msb][lsb].name + " ";

            // Get oprands from desired locations, and form the
            // instruction based upon its addressing mode. These
            // routines mimmick the actual fetch routine of the
            // 6502 in order to get accurate data as part of the
            // instruction
            if (this.instructions[msb][lsb].addMode === this.IMP)
            {
                sInst += " {IMP}";
            }
            else if (this.instructions[msb][lsb].addMode === this.IMM)
            {
                value = this.read(addr); 
                addr++;
                sInst += "#$" + value?.toString(16) + " {IMM}";
            }
            else if (this.instructions[msb][lsb].addMode === this.ZP0)
            {
                lo = this.read(addr); addr++;
                hi = 0x00;												
                sInst += "$" + lo?.toString(16) + " {ZP0}";
            }
            else if (this.instructions[msb][lsb].addMode === this.ZPX)
            {
                lo = this.read(addr); addr++;
                hi = 0x00;									
                sInst += "$" + lo?.toString(16) + ", X {ZPX}";
            }
            else if (this.instructions[msb][lsb].addMode === this.ZPY)
            {
                lo = this.read(addr); addr++;
                hi = 0x00;
                sInst += "$" +lo?.toString(16) + ", Y {ZPY}";
            }
            else if (this.instructions[msb][lsb].addMode === this.IZX)
            {
                lo = this.read(addr); addr++;
                hi = 0x00;
                sInst += "($" + lo?.toString(16) + ", X) {IZX}";
            }
            else if (this.instructions[msb][lsb].addMode === this.IZY)
            {
                lo = this.read(addr); addr++;
                hi = 0x00;
                sInst += "($" + lo?.toString(16) + "), Y {IZY}";
            }
            else if (this.instructions[msb][lsb].addMode === this.ABS)
            {
                lo = this.read(addr); addr++;
                hi = this.read(addr); addr++;
                sInst += "$" + ((0xFFFF)&(hi << 8) | lo).toString(16) + " {ABS}";
            }
            else if (this.instructions[msb][lsb].addMode === this.ABX)
            {
                lo = this.read(addr); addr++;
                hi = this.read(addr); addr++;
                sInst += "$" + ((0xFFFF)&(hi << 8) | lo).toString(16) + ", X {ABX}";
            }
            else if (this.instructions[msb][lsb].addMode === this.ABY)
            {
                lo = this.read(addr); addr++;
                hi = this.read(addr); addr++;
                sInst += "$" + ((0xFFFF)&(hi << 8) | lo).toString(16) + ", Y {ABY}";
            }
            else if (this.instructions[msb][lsb].addMode === this.IND)
            {
                lo = this.read(addr); addr++;
                hi = this.read(addr); addr++;
                sInst += "($" + ((0xFFFF)&(hi << 8) | lo).toString(16) + ") {IND}";
            }
            else if (this.instructions[msb][lsb].addMode === this.REL)
            {
                value = this.read(addr); addr++;
                sInst += "$" + value?.toString(16) + " [$" + (addr-0x0100 + value).toString(16) + "] {REL}";
            }
            mapLines[line_addr.toString(16)] = sInst;
        }

        return mapLines;
    }

    // BUS CONNECTIVITY
    /**
     * Reads an 8-bit byte from the bus, located at the specified 16-bit address
     * @param a Number Memory Address
     * @returns Number Memory Value
     */
    read(a: number): number{
        if(a >= 0x6000 && a<=0x6fff){ 
            return this.childs?.filter(el => el instanceof VIADeviceService)[0].read(a); //this.Via.read(a);
        }
        return  this.childs?.filter(el=> el instanceof MemoryService)[0].read(a);
    }

    /**
     * Writes an 8-bit byte from the bus, located at the specified 16-bit address
     * @param a Number Memory Address
     * @param d Number Memory Value
     */
    write(a: number, d: number): void{
        if(a >= 0x6000 && a<=0x6fff){ 
             this.childs?.filter(el=> el instanceof VIADeviceService)[0].write(a, d);
        }
        this.childs?.filter(el=> el instanceof MemoryService)[0].write(a, d);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // EXTERNAL INPUTS

    /**
     * 
     * Forces the 6502 into a known state. This is hard-wired inside the CPU. The
     * registers are set to 0x00, the status register is cleared except for unused
     * bit which remains at 1. An absolute address is read from location 0xFFFC
     * which contains a second address that the program counter is set to. This 
     * allows the programmer to jump to a known and programmable location in the
     * memory to start executing from. Typically the programmer would set the value
     * at location 0xFFFC at compile time.
     */
    public reset(): void{
        // Get address to set program counter to
        this.addr_abs = 0xFFFC;
        this.stop = false;
        this.pcl = this.read(this.addr_abs + 0);
        this.pch = this.read(this.addr_abs + 1);

        // Set Program Counter;
	    this.pc = (this.pch << 8) | this.pcl;

        // Reset internal registers
        this.a = 0;
        this.x = 0;
        this.y = 0;
        this.stkp = 0xFF;
        this.status = 0x00 | FLAGS6502.U;
        this.status |=  FLAGS6502.B;
        this.status |=  FLAGS6502.I;

        // Clear internal helper variables
        this.addr_rel = 0x0000;
        this.addr_abs = 0x0000;
        this.fetched = 0x00;

        // Reset takes 7 cicles
	    this.cycles = 7;
    }

    /**
     * Interrupt requests are a complex operation and only happen if the
     * "disable interrupt" flag is 0. IRQs can happen at any time, but
     * you dont want them to be destructive to the operation of the running 
     * program. Therefore the current instruction is allowed to finish
     * (which I facilitate by doing the whole thing when cycles === 0) and 
     * then the current program counter is stored on the stack. Then the
     * current status register is stored on the stack. When the routine
     * that services the interrupt has finished, the status register
     * and program counter can be restored to how they where before it 
     * occurred. This is impemented by the "RTI" instruction. Once the IRQ
     * has happened, in a similar way to a reset, a programmable address
     * is read form hard coded location 0xFFFE, which is subsequently
     * set to the program counter.
     */
    public irq(): void{
        // If interrupts are allowed
	    if (this.GetFlag(FLAGS6502.I) === 0){
            // Push the program counter to the stack. It's 16-bits dont
            // forget so that takes two pushes
            this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
            this.stkp--;
            this.write(0x0100 + this.stkp, this.pc & 0x00FF);
            this.stkp--;

            // Then Push the status register to the stack
            this.SetFlag(FLAGS6502.B, 0);
            this.SetFlag(FLAGS6502.U, 1);
            this.SetFlag(FLAGS6502.I, 1);
            this.write(0x0100 + this.stkp, this.status);
            this.stkp--;

            // Read new program counter location from fixed address
            this.addr_abs = 0xFFFE;
            this.pcl =  this.read(this.addr_abs + 0);
            this.pch =  this.read(this.addr_abs + 1);
            this.pc = (this.pch << 8) | this.pcl;
            
            // IRQs take time
		    this.cycles = 7;
        }
    }

    /**
     * A Non-Maskable Interrupt cannot be ignored. It behaves in exactly the
     * same way as a regular IRQ, but reads the new program counter address
     * form location 0xFFFA.
     */
    public nmi(): void{
        this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
        this.stkp--;
        this.write(0x0100 + this.stkp, this.pc & 0x00FF);
        this.stkp--;

        this.SetFlag(FLAGS6502.B, 0);
        this.SetFlag(FLAGS6502.U, 1);
        this.SetFlag(FLAGS6502.I, 1);
        this.write(0x0100 + this.stkp, this.status);
        this.stkp--;

        this.addr_abs = 0xFFFA;
        this.pcl = this.read(this.addr_abs + 0);
        this.pch = this.read(this.addr_abs + 1);
        this.pc = (this.pch << 8) | this.pcl;

        this.SetFlag(FLAGS6502.I, false);
        this.cycles = 8;
    }

    /**
     * The Memory Lock (MLB) output may be used to ensure the integrity 
     * of Read-Modify-Write instructions in a multiprocessor system. Memory 
     * Lock indicates the need to defer arbitration of the bus cycle when MLB is low. 
     * Memory Lock is low during the last three cycles of ASL, DEC, INC, LSR, ROL, ROR, TRB, 
     * and TSB memory referencing instructions.
     */
    public get MLB(): number | boolean
    {
        return this.mlb;
    }

    /**
     * Perform one clock cycles worth of emulation
     */
    public clock(): void{
        
        // To remain compliant with connected devices, it's important that the 
        // emulation also takes "time" in order to execute instructions, so I
        // implement that delay by simply counting down the cycles required by 
        // the instruction. When it reaches 0, the instruction is complete, and
        // the next one is ready to be executed.
        if (this.cycles != 0){
            // Read next instruction byte. This 8-bit value is used to index
            // the translation table to get the relevant information about
            // how to implement the instruction
            this.opcode = this.read(this.pc);
            // Always set the unused status flag bit to 1
		    this.SetFlag(FLAGS6502.U, true);

            // Increment program counter, we read the opcode byte
		    this.pc++;

            // Get Starting number of cycles
            this.pch = this.opcode >> 4;
            this.pcl = this.opcode & 0x0F;
            this.instruction_name = this.instructions[this.pch][this.pcl].name;
		    this.cycles = this.instructions[this.pch][this.pcl].cicle;

            // prevent overflow
            this.a &= 0xff;
            this.x &= 0xff;
            this.y &= 0xff;

            // Perform fetch of intermmediate data using the
		    // required addressing mode
		    const additional_cycle1 = this.instructions[this.pch][this.pcl].addMode();

            // Perform operation
		    const additional_cycle2 = this.instructions[this.pch][this.pcl].exec();

            // The addressmode and opcode may have altered the number
            // of cycles this instruction requires before its completed
            this.cycles += (additional_cycle1 & additional_cycle2);

            // Always set the unused status flag bit to 1
		    this.SetFlag(FLAGS6502.U, true);

        }
        else
        {
            this.mlb = 1;
        } 
        // Increment global clock count - This is actually unused unless logging is enabled
        // but I've kept it in because its a handy watch variable for debugging
        this.clock_count++;

        // Decrement the number of cycles remaining for this instruction
        this.cycles--;
    }

    /**
     * CPU STATUS
     * @returns Object with the CPU Status Acumulator And X, Y Registers
     */
    public cpu_status(): Object{
        return {
            STATUS: {
                N: this.GetFlag(FLAGS6502.N) ? 1 : 0,
                V: this.GetFlag(FLAGS6502.V) ? 1 : 0,
                U: this.GetFlag(FLAGS6502.U) ? 1 : 0,
                B: this.GetFlag(FLAGS6502.B) ? 1 : 0,
                D: this.GetFlag(FLAGS6502.D) ? 1 : 0,
                I: this.GetFlag(FLAGS6502.I) ? 1 : 0,
                Z: this.GetFlag(FLAGS6502.Z) ? 1 : 0,
                C: this.GetFlag(FLAGS6502.C) ? 1 : 0,
            },
            A: this.a.toString(16), 
            X: this.x.toString(16), 
            Y: this.y.toString(16), 
            PC: (this.pc & 0xFFFF).toString(16),
            STACK: (0x0100 + this.stkp).toString(16),
            CLOCKS: this.clock_count,
            CYCLES: this.cycles,
            CODE: this.opcode.toString(16),
            DATA: this.fetched.toString(16),
            NAME: this.instruction_name,
            FINISH: this.stop,
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // FLAG FUNCTIONS

    // Returns the value of a specific bit of the status register
    private GetFlag(f: FLAGS6502): number{
        return ((this.status & f) > 0) ? 1 : 0;
    }

    // Sets or clears a specific bit of the status register
    private SetFlag(f: FLAGS6502, v: boolean | number): void{
        if (v)
            this.status |= f;
        else
            this.status &= ~f;
    }


    ///////////////////////////////////////////////////////////////////////////////
    // ADDRESSING MODES

    // Address Mode: Implied
    // There is no additional data required for this instruction. The instruction
    // does something very simple like set a status bit. However, we will
    // target the accumulator, for instructions like PHA
    private IMP = () => { 
        const self = this;
        self.fetched = self.a;
	    return 0;
     }

     // Address Mode: Immediate
    // The instruction expects the next byte to be used as a value, so we'll prep
    // the read address to point to the next byte
    private IMM = () => { 
        const self = this;
        self.addr_abs = self.pc++;
	    return 0;
    }

    // Address Mode: Zero Page
    // To save program bytes, zero page addressing allows you to absolutely address
    // a location in first 0xFF bytes of address range. Clearly this only requires
    // one byte instead of the usual two.
	private ZP0 = () => {
        const self = this;
        self.addr_abs = self.read(self.pc);
        self.pc++;
        self.addr_abs &= 0x00FF;
        return 0;
    }

    // Address Mode: Zero Page with X Offset
    // Fundamentally the same as Zero Page addressing, but the contents of the X Register
    // is added to the supplied single byte address. This is useful for iterating through
    // ranges within the first page.
    private ZPX = () => {
        const self = this;
        self.addr_abs = (self.read(self.pc) + self.x);
        self.pc++;
        self.addr_abs &= 0x00FF;
        return 0;
    }

    // Address Mode: Zero Page with Y Offset
    // Same as above but uses Y Register for offset
	private ZPY = () => { 
        const self = this;
        self.addr_abs = (self.read(self.pc) + self.y);
        self.pc++;
        self.addr_abs &= 0x00FF;
        return 0;    
    }

    // Address Mode: Relative
    // This address mode is exclusive to branch instructions. The address
    // must reside within -128 to +127 of the branch instruction, i.e.
    // you cant directly branch to any address in the addressable range.
    private REL = () => {
        const self = this;
        self.addr_rel = self.read(self.pc);
        self.pc++;
        if (self.addr_rel & 0x80){
             self.addr_rel |= 0xFF00;
        }
        return 0;
    }

    // Address Mode: Absolute 
    // A full 16-bit address is loaded and used
	private ABS = () => {
        const self = this;
        const lo = self.read(self.pc);
        self.pc++;
        const hi = self.read(self.pc);
        self.pc++;
        self.addr_abs = (hi << 8) | lo;
        return 0;
    }

    // Address Mode: Absolute with X Offset
    // Fundamentally the same as absolute addressing, but the contents of the X Register
    // is added to the supplied two byte address. If the resulting address changes
    // the page, an additional clock cycle is required
    private ABX = () => {
        const self = this;
        const lo = self.read(self.pc);
        self.pc++;
        const hi = self.read(self.pc);
        self.pc++;

        self.addr_abs = (hi << 8) | lo;
        self.addr_abs += self.x;

        if ((self.addr_abs & 0xFF00) != (hi << 8)){
            return 1;
        }else{
            return 0;
        }
    }

    // Address Mode: Absolute with Y Offset
    // Fundamentally the same as absolute addressing, but the contents of the Y Register
    // is added to the supplied two byte address. If the resulting address changes
    // the page, an additional clock cycle is required
	private ABY = () => {
        const self = this;
        const lo = self.read(self.pc);
        self.pc++;
        const hi = self.read(self.pc);
        self.pc++;

        self.addr_abs = (hi << 8) | lo;
        self.addr_abs += self.y;

        if ((self.addr_abs & 0xFF00) != (hi << 8)){
            return 1;
        }else{
            return 0;
        }
    }

    // Note: The next 3 address modes use indirection (aka Pointers!)

    // Address Mode: Indirect
    // The supplied 16-bit address is read to get the actual 16-bit address. This is
    // instruction is unusual in that it has a bug in the hardware! To emulate its
    // function accurately, we also need to emulate this bug. If the low byte of the
    // supplied address is 0xFF, then to read the high byte of the actual address
    // we need to cross a page boundary. This doesnt actually work on the chip as 
    // designed, instead it wraps back around in the same page, yielding an 
    // invalid actual address
    private IND = () => {
        const self = this;
        const ptr_lo = self.read(self.pc);
        self.pc++;
        const ptr_hi = self.read(self.pc);
        self.pc++;

        const ptr = (ptr_hi << 8) | ptr_lo;

        if (ptr_lo === 0x00FF) // Simulate page boundary hardware bug
        {
            self.addr_abs = (self.read(ptr & 0xFF00) << 8) | self.read(ptr + 0);
        }
        else // Behave normally
        {
            self.addr_abs = (self.read(ptr + 1) << 8) | self.read(ptr + 0);
        }
        
        return 0;
    }

    // Address Mode: Indirect X
    // The supplied 8-bit address is offset by X Register to index
    // a location in page 0x00. The actual 16-bit address is read 
    // from this location
	private IZX = () => {
        const self = this;
        const temp = self.read(self.pc);
        self.pc++;

        const lo = self.read((temp + self.x) & 0x00FF);
        const hi = self.read((temp + self.x + 1) & 0x00FF);

        self.addr_abs = (hi << 8) | lo;
        
        return 0;
    }

    // Address Mode: Indirect Y
    // The supplied 8-bit address indexes a location in page 0x00. From 
    // here the actual 16-bit address is read, and the contents of
    // Y Register is added to it to offset it. If the offset causes a
    // change in page then an additional clock cycle is required.
    private IZY = () => {
        const self = this;
        const t = self.read(self.pc);
        self.pc++;

        const lo = self.read(t & 0x00FF);
        const hi = self.read((t + 1) & 0x00FF);

        self.addr_abs = (hi << 8) | lo;
        self.addr_abs += self.y;
        
        if ((self.addr_abs & 0xFF00) != (hi << 8)){
            return 1;
        }else{
            return 0;
        }
    }

    // This function sources the data used by the instruction into 
    // a convenient numeric variable. Some instructions dont have to 
    // fetch data as the source is implied by the instruction. For example
    // "INX" increments the X register. There is no additional data
    // required. For all other addressing modes, the data resides at 
    // the location held within addr_abs, so it is read from there. 
    // Immediate adress mode exploits this slightly, as that has
    // set addr_abs = pc + 1, so it fetches the data from the
    // next byte for example "LDA $FF" just loads the accumulator with
    // 256, i.e. no far reaching memory fetch is required. "fetched"
    // is a variable global to the CPU, and is set by calling this 
    // function. It also returns it for convenience.
    private fetch(): number{
        //const opcode = this.read(this.pc);
        const hi = this.opcode >> 4;
        const lo = this.opcode & 0x0F;
        if (!(this.instructions[hi][lo].addMode === this.IMP))
            this.fetched = this.read(this.addr_abs);
        return this.fetched;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // INSTRUCTION IMPLEMENTATIONS

    // Instruction: Add with Carry In
    // Function:    A = A + M + C
    // Flags Out:   C, V, N, Z
    //
    private ADC = () => {
        const self = this;
        // Grab the data that we are adding to the accumulator
        self.fetch();
        
        // Add is performed in 16-bit domain for emulation to capture any
        // carry bit, which will exist in bit 8 of the 16-bit word
        const temp = self.a + self.fetched + self.GetFlag(FLAGS6502.C);
        
        // The carry flag out exists in the high byte bit 0
        self.SetFlag(FLAGS6502.C, temp > 255);
        
        // The Zero flag is set if the result is 0
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) == 0);
        
        // The signed Overflow flag is set based on all that up there! :D
        self.SetFlag(FLAGS6502.V, (~( self.a  ^ this.fetched ) & ( this.a ^ temp )) & 0x80);
        
        // The negative flag is set to the most significant bit of the result
        self.SetFlag(FLAGS6502.N, temp & 0x80);
        
        // Load the result into the accumulator (it's 8-bit dont forget!)
        self.a = temp & 0x00FF;
        
        // This instruction has the potential to require an additional clock cycle
        return 1;
    }

    // Instruction: Subtraction with Borrow In
    // Function:    A = A - M - (1 - C)
    // Flags Out:   C, V, N, Z
    //
    private SBC(): number{
        const self = this;
        self.fetch();
        // Operating in 16-bit domain to capture carry out
        
        // We can invert the bottom 8 bits with bitwise xor
        const value = (self.fetched) ^ 0x00FF;
        
        // Notice this is exactly the same as addition from here!
        const temp = self.a + value + self.GetFlag(FLAGS6502.C);
        self.SetFlag(FLAGS6502.C, temp & 0xFF00);
        self.SetFlag(FLAGS6502.Z, ((temp & 0x00FF) === 0));
        self.SetFlag(FLAGS6502.V, (temp ^ self.a) & (temp ^ value) & 0x0080);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        self.a = temp & 0x00FF;
        return 1;
    }
    // Instruction: Bitwise Logic AND
    // Function:    A = A & M
    // Flags Out:   N, Z
    private AND = () => {
        const self = this;
        self.fetch();
        self.a = self.a & self.fetched;
        self.SetFlag(FLAGS6502.Z, self.a === 0x00);
        self.SetFlag(FLAGS6502.N, self.a & 0x80);
        return 1;
    }

    // Instruction: Arithmetic Shift Left
    // Function:    A = C <- (A << 1) <- 0
    // Flags Out:   N, Z, C
    private ASL = () => {
        const self = this;
        self.mlb = 0;
        self.fetch();
        const temp = self.fetched << 1;
        self.SetFlag(FLAGS6502.C, (temp & 0xFF00) > 0);
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) === 0x00);
        self.SetFlag(FLAGS6502.N, temp & 0x80);
        const hi = self.opcode >> 4;
        const lo = self.opcode & 0x0f;
        if (self.instructions[hi][lo].addMode === self.IMP)
            self.a = temp & 0x00FF;
        else
            self.write(self.addr_abs, temp & 0x00FF);
        return 0;
    }

    // Instruction: Branch if Carry Clear
    // Function:    if(C == 0) pc = address 
    private BCC = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.C) === 0)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;
            
            if((self.addr_abs & 0xFF00) != (self.pc & 0xFF00))
                self.cycles++;
            
            self.pc = self.addr_abs;
        }
        return 0;
    }


    // Instruction: Branch if Carry Set
    // Function:    if(C == 1) pc = address
	private BCS = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.C) === 1)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;
            
            if((self.addr_abs & 0xFF00) != (self.pc & 0xFF00))
                self.cycles++;
            
            self.pc = self.addr_abs;
        }
        return 0;
    }

    // Instruction: Branch if Equal
    // Function:    if(Z == 1) pc = address
    private BEQ = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.Z) === 1)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;

            if ((self.addr_abs & 0xFF00) != (self.pc & 0xFF00))
                self.cycles++;

            self.pc = self.addr_abs;
        }
        return 0;
    }


    private BIT = () => {
        const self = this;
        self.fetch();
        const temp = self.a & self.fetched;
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) === 0x00);
        self.SetFlag(FLAGS6502.N, self.fetched & (1 << 7));
        self.SetFlag(FLAGS6502.V, self.fetched & (1 << 6));
        return 0;
    }

    // Instruction: Branch if Negative
    // Function:    if(N == 1) pc = address
    private BMI = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.N) === 1)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;
    
            if ((self.addr_abs & 0xFF00) != (self.pc & 0xFF00))
                self.cycles++;
    
            self.pc = self.addr_abs;
        }
        return 0;
    }

    // Instruction: Branch if Not Equal
    // Function:    if(Z === 0) pc = address
	private BNE = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.Z) === 0x00)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;
            if ((self.addr_abs & 0xFF00) != (self.pc & 0xFF00)){
                self.cycles++;
            }
            self.pc = self.addr_abs & 0xFFFF;
        }
        return 0;    
    }

    // Instruction: Branch if Positive
    // Function:    if(N == 0) pc = address
    private BPL = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.N) == 0)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;
    
            if ((self.addr_abs & 0xFF00) != (self.pc & 0xFF00))
                self.cycles++;
    
            self.pc = self.addr_abs;
        }
        return 0;
    }

    // Instruction: Break
    // Function:    Program Sourced Interrupt
    private BRK = () => {
        const self = this;
        /* self.pc++;
	
        self.SetFlag(FLAGS6502.I, 1);
        self.write(0x0100 + self.stkp, (self.pc >> 8) & 0x00FF);
        self.stkp--;
        self.write(0x0100 + self.stkp, self.pc & 0x00FF);
        self.stkp--;
    
        self.SetFlag(FLAGS6502.B, 1);
        self.write(0x0100 + self.stkp, self.status);
        self.stkp--;
        self.SetFlag(FLAGS6502.B, 0);
    
        self.pc = self.read(0xFFFE) | (self.read(0xFFFF) << 8); */
        self.stop = true;
        return 0;
    }

    // Instruction: Branch if Overflow Clear
    // Function:    if(V == 0) pc = address
    private BVC = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.V) == 0)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;

            if ((self.addr_abs & 0xFF00) != (self.pc & 0xFF00))
                self.cycles++;

            self.pc = self.addr_abs;
        }
        return 0;
    }

    // Instruction: Branch if Overflow Set
    // Function:    if(V == 1) pc = address
	private BVS = () => {
        const self = this;
        if (self.GetFlag(FLAGS6502.V) == 1)
        {
            self.cycles++;
            self.addr_abs = self.pc + self.addr_rel;

            if ((self.addr_abs & 0xFF00) != (self.pc & 0xFF00))
                self.cycles++;

            self.pc = self.addr_abs;
        }
        return 0;
    }	

    // Instruction: Clear Carry Flag
    // Function:    C = 0
    private CLC = () => {
        const self = this;
        self.SetFlag(FLAGS6502.C, false);
	    return 0;
    }

    // Instruction: Clear Decimal Flag
    // Function:    D = 0
    private CLD = () => {
        const self = this;
        self.SetFlag(FLAGS6502.D, false);
	    return 0;
    }

    // Instruction: Disable Interrupts / Clear Interrupt Flag
    // Function:    I = 0
    private CLI = () => {
        const self = this;
        self.SetFlag(FLAGS6502.I, false);
	    return 0;
    }

    // Instruction: Clear Overflow Flag
    // Function:    V = 0
	private CLV = () => {
        const self = this;
        self.SetFlag(FLAGS6502.V, false);
	    return 0;
    }

    // Instruction: Compare Accumulator
    // Function:    C <- A >= M      Z <- (A - M) == 0
    // Flags Out:   N, C, Z
    private CMP = () => {
        const self = this;
        self.fetch();
        const temp = self.a - self.fetched;
        self.SetFlag(FLAGS6502.C, self.a >= self.fetched);
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) === 0x0000);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        return 1;
    }

    // Instruction: Compare X Register
    // Function:    C <- X >= M      Z <- (X - M) == 0
    // Flags Out:   N, C, Z
    private CPX = () => {
        const self = this;
        self.fetch();
        const temp = self.x - self.fetched;
        self.SetFlag(FLAGS6502.C, self.x >= self.fetched);
        self.SetFlag(FLAGS6502.Z, (temp & 0xFF) === 0x00);
        self.SetFlag(FLAGS6502.N, temp & 0x80);
        return 0;
    }

    // Instruction: Compare Y Register
    // Function:    C <- Y >= M      Z <- (Y - M) == 0
    // Flags Out:   N, C, Z
    private CPY = () => {
        const self = this;
        self.fetch();
        const temp = self.y - self.fetched;
        self.SetFlag(FLAGS6502.C, self.y >= self.fetched);
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) === 0x0000);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        return 0;
    }

    // Instruction: Decrement Value at Memory Location
    // Function:    M = M - 1
    // Flags Out:   N, Z
	private DEC = () => {
        const self = this;
        self.mlb = 0;
        self.fetch();
        const temp = self.fetched - 1;
        self.write(self.addr_abs, temp & 0x00FF);
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) === 0x0000);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        return 0;
    }

    // Instruction: Decrement X Register
    // Function:    X = X - 1
    // Flags Out:   N, Z
    private DEX = () => {
        const self = this;
        self.x--;
        self.SetFlag(FLAGS6502.Z, self.x === 0x00);
        self.SetFlag(FLAGS6502.N, self.x & 0x80);
        return 0;
    }

    // Instruction: Decrement Y Register
    // Function:    Y = Y - 1
    // Flags Out:   N, Z
    private DEY = () => {
        const self = this;
        self.y--;
        self.SetFlag(FLAGS6502.Z, self.y === 0x00);
        self.SetFlag(FLAGS6502.N, self.y & 0x80);
        return 0;
    }

    // Instruction: Bitwise Logic XOR
    // Function:    A = A xor M
    // Flags Out:   N, Z
    private EOR = () => {
        const self = this;
        self.fetch();
        self.a = self.a ^ self.fetched;	
        self.SetFlag(FLAGS6502.Z, self.a === 0x00);
        self.SetFlag(FLAGS6502.N, self.a & 0x80);
        return 1;
    }

    // Instruction: Increment Value at Memory Location
    // Function:    M = M + 1
    // Flags Out:   N, Z
	private INC = () => {
        const self = this;
        self.mlb = 0;
        self.fetch();
        const temp = self.fetched + 1;
        self.write(self.addr_abs, temp & 0x00FF);
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) === 0x0000);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        return 0;
    }

    // Instruction: Increment X Register
    // Function:    X = X + 1
    // Flags Out:   N, Z
    private INX = () => {
        const self = this;
        self.x++;
        self.SetFlag(FLAGS6502.Z, self.x === 0x00);
        self.SetFlag(FLAGS6502.N, self.x & 0x80);
        return 0;
    }

    // Instruction: Increment Y Register
    // Function:    Y = Y + 1
    // Flags Out:   N, Z
    private INY = () => {
        const self = this;
        self.y++;
        self.SetFlag(FLAGS6502.Z, self.y === 0x00);
        self.SetFlag(FLAGS6502.N, self.y & 0x80);
        return 0;
    }

    // Instruction: Jump To Location
    // Function:    pc = address
    private JMP = () => {
        const self = this;
        self.pc = self.addr_abs;
	    return 0;
    }

    // Instruction: Jump To Sub-Routine
    // Function:    Push current pc to stack, pc = address
	private JSR = () => {
        const self = this;
        self.pc--;
        self.write(0x0100 + self.stkp, (self.pc >> 8) & 0x00FF);
        self.stkp--;
        self.write(0x0100 + self.stkp, self.pc & 0x00FF);
        self.stkp--;

        self.pc = self.addr_abs;
        return 0;   
    }
    
    // Instruction: Load The Accumulator
    // Function:    A = M
    // Flags Out:   N, Z
    private LDA = () => {
        const self = this;
        self.fetch();
        self.a = self.fetched;
        self.SetFlag(FLAGS6502.Z, self.a === 0x00);
        self.SetFlag(FLAGS6502.N, self.a & 0x80);
        return 1;
    }	
    
    // Instruction: Load The X Register
    // Function:    X = M
    // Flags Out:   N, Z
    private LDX = () => {
        const self = this;
        self.fetch();
        self.x = self.fetched;
        self.SetFlag(FLAGS6502.Z, self.x === 0x00);
        self.SetFlag(FLAGS6502.N, self.x & 0x80);
        return 1;
    }	
    
    // Instruction: Load The Y Register
    // Function:    Y = M
    // Flags Out:   N, Z
    private LDY = () => {
        const self = this;
        self.fetch();
        self.y = self.fetched;
        self.SetFlag(FLAGS6502.Z, self.y === 0x00);
        self.SetFlag(FLAGS6502.N, self.y & 0x80);
        return 1;
    }


    // Instruction: Shift One Bit Right
    // Function:    M >> 1
    // Flags Out:   C, N, Z
	private LSR = () => {
        const self = this;
        self.mlb = 0;
        self.fetch();
        self.SetFlag(FLAGS6502.C, self.fetched & 0x0001);
        const temp = self.fetched >> 1;	
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) === 0x0000);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        const hi = self.opcode >> 4;
        const lo = self.opcode & 0x0f;
        if (self.instructions[hi][lo].addMode === self.IMP)
            self.a = temp & 0x00FF;
        else
            self.write(self.addr_abs, temp & 0x00FF);
        return 0;
    }

    private NOP = () => {
    // Sadly not all NOPs are equal, Ive added a few here
	// based on https://wiki.nesdev.com/w/index.php/CPU_unofficial_opcodes
	// and will add more based on game compatibility, and ultimately
	// I'd like to cover all illegal opcodes too
    const self = this;
	switch (self.opcode) {
        case 0x1C:
        case 0x3C:
        case 0x5C:
        case 0x7C:
        case 0xDC:
        case 0xFC:
            return 1;
            break;
        }
        return 0;
    }

    // Instruction: Bitwise Logic OR
    // Function:    A = A | M
    // Flags Out:   N, Z
    private ORA = () => {
        const self = this;
        self.fetch();
        self.a = self.a | self.fetched;
        self.SetFlag(FLAGS6502.Z, self.a == 0x00);
        self.SetFlag(FLAGS6502.N, self.a & 0x80);
        return 1;
    }

    // Instruction: Push Accumulator to Stack
    // Function:    A -> stack
    private PHA = () => {
        const self = this;
        self.write(0x0100 + self.stkp, self.a);
        self.stkp--;
        return 0;
    }

    // Instruction: Push Status Register to Stack
    // Function:    status -> stack
    // Note:        Break flag is set to 1 before push
	private PHP = () => {
        const self = this;
        self.write(0x0100 + self.stkp, self.status | FLAGS6502.B | FLAGS6502.U);
        self.SetFlag(FLAGS6502.B, 0);
        self.SetFlag(FLAGS6502.U, 0);
        self.stkp--;
        return 0;
    }

    // Instruction: Pop Accumulator off Stack
    // Function:    A <- stack
    // Flags Out:   N, Z
    private PLA = () => {
        const self = this;
        self.stkp++;
        self.a = self.read(0x0100 + self.stkp);
        self.SetFlag(FLAGS6502.Z, self.a == 0x00);
        self.SetFlag(FLAGS6502.N, self.a & 0x80);
        return 0;
    }

    // Instruction: Pop Status Register off Stack
    // Function:    Status <- stack
    private PLP = () => {
        const self = this;
        self.stkp++;
        self.status = self.read(0x0100 + self.stkp);
        self.SetFlag(FLAGS6502.U, 1);
        return 0;
    }


    private ROL = () => {
        const self = this;
        self.mlb = 0;
        self.fetch();
        const temp = (self.fetched << 1) | self.GetFlag(FLAGS6502.C);
        self.SetFlag(FLAGS6502.C, temp & 0xFF00);
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) == 0x0000);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        const hi = self.opcode >> 4;
        const lo = self.opcode & 0x0f;

        if (self.instructions[hi][lo].addMode === self.IMP)
            self.a = temp & 0x00FF;
        else
            self.write(self.addr_abs, temp & 0x00FF);
        return 0;
    }

	private ROR = () => {
        const self = this;
        self.mlb = 0;
        self.fetch();
        const temp = (self.GetFlag(FLAGS6502.C) << 7) | (self.fetched >> 1);
        self.SetFlag(FLAGS6502.C, self.fetched & 0x01);
        self.SetFlag(FLAGS6502.Z, (temp & 0x00FF) == 0x00);
        self.SetFlag(FLAGS6502.N, temp & 0x0080);
        const hi = self.opcode >> 4;
        const lo = self.opcode & 0x0f;

        if (self.instructions[hi][lo].addMode == self.IMP)
            self.a = temp & 0x00FF;
        else
            self.write(self.addr_abs, temp & 0x00FF);
        return 0;
    }	


    private RTI = () => {
        const self = this;
        self.stkp++;
        self.status = self.read(0x0100 + self.stkp);
        self.status &= ~FLAGS6502.B;
        self.status &= ~FLAGS6502.U;
        self.status &= ~FLAGS6502.I;
    
        self.stkp++;
        self.pc = self.read(0x0100 + self.stkp);
        self.stkp++;
        self.pc |= self.read(0x0100 + self.stkp) << 8;
        return 0;
    }

    // Instruction: Return From Sub-Routine
    private RTS = () => {
        const self = this;
        self.stkp++;
        self.pc = self.read(0x0100 + self.stkp);
        self.stkp++;
        self.pc |= self.read(0x0100 + self.stkp) << 8;
        
        self.pc++;
        return 0 
    }

    // Instruction: Set Carry Flag
    // Function:    C = 1
	private SEC = () => {
        const self = this;
        self.SetFlag(FLAGS6502.C, true);
        return 0;
    }

    // Instruction: Set Decimal Flag
    // Function:    D = 1
    private SED = () => {
        const self = this;
        self.SetFlag(FLAGS6502.D, true);
        return 0;
    }

    // Instruction: Set Interrupt Flag / Enable Interrupts
    // Function:    I = 1
    private SEI = () => {
        const self = this;
        self.SetFlag(FLAGS6502.I, true);
        return 0;
    }
    
    // Instruction: Store Accumulator at Address
    // Function:    M = A
    private STA = () => {
        const self = this;
        self.write(self.addr_abs, self.a);
        return 0;
    }

    // Instruction: Store X Register at Address
    // Function:    M = X
	private STX = () => {
        const self = this;
        self.write(self.addr_abs, self.x);
        return 0;
    }

    // Instruction: Store X Register at Address
    // Function:    M = Y
    private STY = () => {
        const self = this;
        self.write(self.addr_abs, self.y);
        return 0;
    }

    // Instruction: Transfer Accumulator to X Register
    // Function:    X = A
    // Flags Out:   N, Z
    private TAX = () => {
        const self = this;
        self.x = self.a;
        self.SetFlag(FLAGS6502.Z, self.x == 0x00);
        self.SetFlag(FLAGS6502.N, self.x & 0x80);
        return 0;
    }

    // Instruction: Transfer Accumulator to Y Register
    // Function:    Y = A
    // Flags Out:   N, Z
    private TAY = ()=> {
        const self = this;
        self.y = self.a;
        self.SetFlag(FLAGS6502.Z, self.y == 0x00);
        self.SetFlag(FLAGS6502.N, self.y & 0x80);
        return 0;
    }

    // Instruction: Transfer Stack Pointer to X Register
    // Function:    X = stack pointer
    // Flags Out:   N, Z
	private TSX = () => {
        const self = this;
        self.x = self.stkp;
        self.SetFlag(FLAGS6502.Z, self.x == 0x00);
        self.SetFlag(FLAGS6502.N, self.x & 0x80);
        return 0;
    }
    
    // Instruction: Transfer X Register to Accumulator
    // Function:    A = X
    // Flags Out:   N, Z
    private TXA = () => {
        const self = this;
        self.a = self.x;
        self.SetFlag(FLAGS6502.Z, self.a == 0x00);
        self.SetFlag(FLAGS6502.N, self.a & 0x80);
        return 1;
    }	
    
    // Instruction: Transfer X Register to Stack Pointer
    // Function:    stack pointer = X
    private TXS = ()=> {
        const self = this;
        self.stkp = self.x;
	    return 0;
    }

    // Instruction: Transfer Y Register to Accumulator
    // Function:    A = Y
    // Flags Out:   N, Z
    private TYA = () => {
        const self = this;
        self.a = self.y;
        self.SetFlag(FLAGS6502.Z, self.a == 0x00);
        self.SetFlag(FLAGS6502.N, self.a & 0x80);
        return 0;
    }

    // This function captures illegal opcodes
    private XXX = ()=>{
        return 0;
    }

    /**
     * Return true if the programm has finished.
     * @returns Boolean
     */
    get isComplete(): boolean{
        return this.stop;
    }

     /**
     * Return true if the programm has finished.
     * @returns Boolean
     */
    set isComplete(val: boolean) {
        this.stop = val;
    }

    //private static instance: CPU;
    private instructions: Array<Array<iOpcode>> = [
        [
            { name: 'BRK', opcode: 0x00, exec: this.BRK, addMode: this.IMP, cicle: 7},
            { name: 'ORA', opcode: 0x01, exec: this.ORA, addMode: this.IZX, cicle: 6}, 
            { name: '???', opcode: 0x02, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: '???', opcode: 0x03, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: '???', opcode: 0x04, exec: this.NOP, addMode: this.IMP, cicle: 3},
            { name: 'ORA', opcode: 0x05, exec: this.ORA, addMode: this.ZP0, cicle: 3},
            { name: 'ASL', opcode: 0x06, exec: this.ASL, addMode: this.ZP0, cicle: 5},
            { name: '???', opcode: 0x07, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: 'PHP', opcode: 0x08, exec: this.PHP, addMode: this.IMP, cicle: 3},
            { name: 'ORA', opcode: 0x09, exec: this.ORA, addMode: this.IMM, cicle: 2},
            { name: 'ASL', opcode: 0x0a, exec: this.ASL, addMode: this.IMP, cicle: 2},
            { name: '???', opcode: 0x0b, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: '???', opcode: 0x0c, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: 'ORA', opcode: 0x0d, exec: this.ORA, addMode: this.ABS, cicle: 4},
            { name: 'ASL', opcode: 0x0e, exec: this.ASL, addMode: this.ABS, cicle: 6},
            { name: '???', opcode: 0x0f, exec: this.XXX, addMode: this.IMP, cicle: 6},
        ],
        [
            { name: 'BPL', opcode: 0x10, exec: this.BPL, addMode: this.REL, cicle: 2},
            { name: 'ORA', opcode: 0x11, exec: this.ORA, addMode: this.IZY, cicle: 5},
            { name: '???', opcode: 0x12, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: '???', opcode: 0x13, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: '???', opcode: 0x14, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: 'ORA', opcode: 0x15, exec: this.ORA, addMode: this.ZPX, cicle: 4},
            { name: 'ASL', opcode: 0x16, exec: this.ASL, addMode: this.ZPX, cicle: 6},
            { name: '???', opcode: 0x17, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "CLC", opcode: 0x18, exec: this.CLC, addMode: this.IMP, cicle: 2},
            { name: "ORA", opcode: 0x19, exec: this.ORA, addMode: this.ABY, cicle: 4},
            { name: "???", opcode: 0x1a, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x1b, exec: this.XXX, addMode: this.IMP, cicle: 7},
            { name: "???", opcode: 0x1c, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "ORA", opcode: 0x1d, exec: this.ORA, addMode: this.ABX, cicle: 4},
            { name: "ASL", opcode: 0x1e, exec: this.ASL, addMode: this.ABX, cicle: 7},
            { name: "???", opcode: 0x1f, exec: this.XXX, addMode: this.IMP, cicle: 7}
        ],
        [
            { name: "JSR", opcode: 0x20, exec: this.JSR, addMode: this.ABS, cicle: 6},
            { name: "AND", opcode: 0x21, exec: this.AND, addMode: this.IZX, cicle: 6},
            { name: "???", opcode: 0x22, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x23, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "BIT", opcode: 0x24, exec: this.BIT, addMode: this.ZP0, cicle: 3},
            { name: "AND", opcode: 0x25, exec: this.AND, addMode: this.ZP0, cicle: 3},
            { name: "ROL", opcode: 0x26, exec: this.ROL, addMode: this.ZP0, cicle: 5},
            { name: "???", opcode: 0x27, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "PLP", opcode: 0x28, exec: this.PLP, addMode: this.IMP, cicle: 4},
            { name: "AND", opcode: 0x29, exec: this.AND, addMode: this.IMM, cicle: 2},
            { name: "ROL", opcode: 0x2a, exec: this.ROL, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x2b, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "BIT", opcode: 0x2c, exec: this.BIT, addMode: this.ABS, cicle: 4},
            { name: "AND", opcode: 0x2d, exec: this.AND, addMode: this.ABS, cicle: 4},
            { name: "ROL", opcode: 0x2e, exec: this.ROL, addMode: this.ABS, cicle: 6},
            { name: "???", opcode: 0x2f, exec: this.XXX, addMode: this.IMP, cicle: 6},
        ],
        [
            { name: "BMI", opcode: 0x30, exec: this.BMI, addMode: this.REL, cicle: 2},
            { name: "AND", opcode: 0x31, exec: this.AND, addMode: this.IZY, cicle: 5},
            { name: "???", opcode: 0x32, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x33, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "???", opcode: 0x34, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "AND", opcode: 0x35, exec: this.AND, addMode: this.ZPX, cicle: 4},
            { name: "ROL", opcode: 0x36, exec: this.ROL, addMode: this.ZPX, cicle: 6},
            { name: "???", opcode: 0x37, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "SEC", opcode: 0x38, exec: this.SEC, addMode: this.IMP, cicle: 2},
            { name: "AND", opcode: 0x39, exec: this.AND, addMode: this.ABY, cicle: 4},
            { name: "???", opcode: 0x3a, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x3b, exec: this.XXX, addMode: this.IMP, cicle: 7},
            { name: "???", opcode: 0x3c, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "AND", opcode: 0x3d, exec: this.AND, addMode: this.ABX, cicle: 4},
            { name: "ROL", opcode: 0x3e, exec: this.ROL, addMode: this.ABX, cicle: 7},
            { name: "???", opcode: 0x3f, exec: this.XXX, addMode: this.IMP, cicle: 7},
        ],
        [
            { name: "RTI", opcode: 0x40, exec: this.RTI, addMode: this.IMP, cicle: 6},
            { name: "EOR", opcode: 0x41, exec: this.EOR, addMode: this.IZX, cicle: 6},
            { name: "???", opcode: 0x42, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x43, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "???", opcode: 0x44, exec: this.NOP, addMode: this.IMP, cicle: 3},
            { name: "EOR", opcode: 0x45, exec: this.EOR, addMode: this.ZP0, cicle: 3},
            { name: "LSR", opcode: 0x46, exec: this.LSR, addMode: this.ZP0, cicle: 5},
            { name: "???", opcode: 0x47, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "PHA", opcode: 0x48, exec: this.PHA, addMode: this.IMP, cicle: 3},
            { name: "EOR", opcode: 0x49, exec: this.EOR, addMode: this.IMM, cicle: 2},
            { name: "LSR", opcode: 0x4a, exec: this.LSR, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x4b, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "JMP", opcode: 0x4c, exec: this.JMP, addMode: this.ABS, cicle: 3},
            { name: "EOR", opcode: 0x4d, exec: this.EOR, addMode: this.ABS, cicle: 4},
            { name: "LSR", opcode: 0x4e, exec: this.LSR, addMode: this.ABS, cicle: 6},
            { name: "???", opcode: 0x4f, exec: this.XXX, addMode: this.IMP, cicle: 6},
        ],
        [
            { name: "BVC", opcode: 0x50, exec: this.BVC, addMode: this.REL, cicle: 2},
            { name: "EOR", opcode: 0x51, exec: this.EOR, addMode: this.IZY, cicle: 5},
            { name: "???", opcode: 0x52, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x53, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "???", opcode: 0x54, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "EOR", opcode: 0x55, exec: this.EOR, addMode: this.ZPX, cicle: 4},
            { name: "LSR", opcode: 0x56, exec: this.LSR, addMode: this.ZPX, cicle: 6},
            { name: "???", opcode: 0x57, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "CLI", opcode: 0x58, exec: this.CLI, addMode: this.IMP, cicle: 2},
            { name: "EOR", opcode: 0x59, exec: this.EOR, addMode: this.ABY, cicle: 4},
            { name: "???", opcode: 0x5a, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x5b, exec: this.XXX, addMode: this.IMP, cicle: 7},
            { name: "???", opcode: 0x5c, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "EOR", opcode: 0x5d, exec: this.EOR, addMode: this.ABX, cicle: 4},
            { name: "LSR", opcode: 0x5e, exec: this.LSR, addMode: this.ABX, cicle: 7},
            { name: "???", opcode: 0x5f, exec: this.XXX, addMode: this.IMP, cicle: 7},
        ],
        [
            { name: "RTS", opcode: 0x60, exec: this.RTS, addMode: this.IMP, cicle: 6},
            { name: "ADC", opcode: 0x61, exec: this.ADC, addMode: this.IZX, cicle: 6},
            { name: "???", opcode: 0x62, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x63, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "???", opcode: 0x64, exec: this.NOP, addMode: this.IMP, cicle: 3},
            { name: "ADC", opcode: 0x65, exec: this.ADC, addMode: this.ZP0, cicle: 3},
            { name: "ROR", opcode: 0x66, exec: this.ROR, addMode: this.ZP0, cicle: 5},
            { name: "???", opcode: 0x67, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "PLA", opcode: 0x68, exec: this.PLA, addMode: this.IMP, cicle: 4},
            { name: "ADC", opcode: 0x69, exec: this.ADC, addMode: this.IMM, cicle: 2},
            { name: "ROR", opcode: 0x6a, exec: this.ROR, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x6b, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "JMP", opcode: 0x6c, exec: this.JMP, addMode: this.IND, cicle: 5},
            { name: "ADC", opcode: 0x6d, exec: this.ADC, addMode: this.ABS, cicle: 4},
            { name: "ROR", opcode: 0x6e, exec: this.ROR, addMode: this.ABS, cicle: 6},
            { name: "???", opcode: 0x6f, exec: this.XXX, addMode: this.IMP, cicle: 6},
        ],
        [
            { name: "BVS", opcode: 0x70, exec: this.BVS, addMode: this.REL, cicle: 2},
            { name: "ADC", opcode: 0x71, exec: this.ADC, addMode: this.IZY, cicle: 5},
            { name: "???", opcode: 0x72, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x73, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "???", opcode: 0x74, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "ADC", opcode: 0x75, exec: this.ADC, addMode: this.ZPX, cicle: 4},
            { name: "ROR", opcode: 0x76, exec: this.ROR, addMode: this.ZPX, cicle: 6},
            { name: "???", opcode: 0x77, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "SEI", opcode: 0x78, exec: this.SEI, addMode: this.IMP, cicle: 2},
            { name: "ADC", opcode: 0x79, exec: this.ADC, addMode: this.ABY, cicle: 4},
            { name: "???", opcode: 0x7a, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x7b, exec: this.XXX, addMode: this.IMP, cicle: 7},
            { name: "???", opcode: 0x7c, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "ADC", opcode: 0x7d, exec: this.ADC, addMode: this.ABX, cicle: 4},
            { name: "ROR", opcode: 0x7e, exec: this.ROR, addMode: this.ABX, cicle: 7},
            { name: "???", opcode: 0x7f, exec: this.XXX, addMode: this.IMP, cicle: 7},
        ],
        [
            { name: "???", opcode: 0x80, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "STA", opcode: 0x81, exec: this.STA, addMode: this.IZX, cicle: 6},
            { name: "???", opcode: 0x82, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x83, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "STY", opcode: 0x84, exec: this.STY, addMode: this.ZP0, cicle: 3},
            { name: "STA", opcode: 0x85, exec: this.STA, addMode: this.ZP0, cicle: 3},
            { name: "STX", opcode: 0x86, exec: this.STX, addMode: this.ZP0, cicle: 3},
            { name: "???", opcode: 0x87, exec: this.XXX, addMode: this.IMP, cicle: 3},
            { name: "DEY", opcode: 0x88, exec: this.DEY, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x89, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "TXA", opcode: 0x8a, exec: this.TXA, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x8b, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "STY", opcode: 0x8c, exec: this.STY, addMode: this.ABS, cicle: 4},
            { name: "STA", opcode: 0x8d, exec: this.STA, addMode: this.ABS, cicle: 4},
            { name: "STX", opcode: 0x8e, exec: this.STX, addMode: this.ABS, cicle: 4},
            { name: "???", opcode: 0x8f, exec: this.XXX, addMode: this.IMP, cicle: 4},
        ],
        [
            { name: "BCC", opcode: 0x90, exec: this.BCC, addMode: this.REL, cicle: 2},
            { name: "STA", opcode: 0x91, exec: this.STA, addMode: this.IZY, cicle: 6},
            { name: "???", opcode: 0x92, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x93, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "STY", opcode: 0x94, exec: this.STY, addMode: this.ZPX, cicle: 4},
            { name: "STA", opcode: 0x95, exec: this.STA, addMode: this.ZPX, cicle: 4},
            { name: "STX", opcode: 0x96, exec: this.STX, addMode: this.ZPY, cicle: 4},
            { name: "???", opcode: 0x97, exec: this.XXX, addMode: this.IMP, cicle: 4},
            { name: "TYA", opcode: 0x98, exec: this.TYA, addMode: this.IMP, cicle: 2},
            { name: "STA", opcode: 0x99, exec: this.STA, addMode: this.ABY, cicle: 5},
            { name: "TXS", opcode: 0x9a, exec: this.TXS, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0x9b, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "???", opcode: 0x9c, exec: this.NOP, addMode: this.IMP, cicle: 5},
            { name: "STA", opcode: 0x9d, exec: this.STA, addMode: this.ABX, cicle: 5},
            { name: "???", opcode: 0x9e, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "???", opcode: 0x9f, exec: this.XXX, addMode: this.IMP, cicle: 5},
        ],
        [
            { name: "LDY", opcode: 0xa0, exec: this.LDY, addMode: this.IMM, cicle: 2},
            { name: "LDA", opcode: 0xa1, exec: this.LDA, addMode: this.IZX, cicle: 6},
            { name: "LDX", opcode: 0xa2, exec: this.LDX, addMode: this.IMM, cicle: 2},
            { name: "???", opcode: 0xa3, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "LDY", opcode: 0xa4, exec: this.LDY, addMode: this.ZP0, cicle: 3},
            { name: "LDA", opcode: 0xa5, exec: this.LDA, addMode: this.ZP0, cicle: 3},
            { name: "LDX", opcode: 0xa6, exec: this.LDX, addMode: this.ZP0, cicle: 3},
            { name: "???", opcode: 0xa7, exec: this.XXX, addMode: this.IMP, cicle: 3},
            { name: "TAY", opcode: 0xa8, exec: this.TAY, addMode: this.IMP, cicle: 2},
            { name: "LDA", opcode: 0xa9, exec: this.LDA, addMode: this.IMM, cicle: 2},
            { name: "TAX", opcode: 0xaa, exec: this.TAX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xab, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "LDY", opcode: 0xac, exec: this.LDY, addMode: this.ABS, cicle: 4},
            { name: "LDA", opcode: 0xad, exec: this.LDA, addMode: this.ABS, cicle: 4},
            { name: "LDX", opcode: 0xae, exec: this.LDX, addMode: this.ABS, cicle: 4},
            { name: "???", opcode: 0xaf, exec: this.XXX, addMode: this.IMP, cicle: 4},
        ],
        [
            { name: "BCS", opcode: 0xb0, exec: this.BCS, addMode: this.REL, cicle: 2},
            { name: "LDA", opcode: 0xb1, exec: this.LDA, addMode: this.IZY, cicle: 5},
            { name: "???", opcode: 0xb2, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xb3, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "LDY", opcode: 0xb4, exec: this.LDY, addMode: this.ZPX, cicle: 4},
            { name: "LDA", opcode: 0xb5, exec: this.LDA, addMode: this.ZPX, cicle: 4},
            { name: "LDX", opcode: 0xb6, exec: this.LDX, addMode: this.ZPY, cicle: 4},
            { name: "???", opcode: 0xb7, exec: this.XXX, addMode: this.IMP, cicle: 4},
            { name: "CLV", opcode: 0xb8, exec: this.CLV, addMode: this.IMP, cicle: 2},
            { name: "LDA", opcode: 0xb9, exec: this.LDA, addMode: this.ABY, cicle: 4},
            { name: "TSX", opcode: 0xba, exec: this.TSX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xbb, exec: this.XXX, addMode: this.IMP, cicle: 4},
            { name: "LDY", opcode: 0xbc, exec: this.LDY, addMode: this.ABX, cicle: 4},
            { name: "LDA", opcode: 0xbd, exec: this.LDA, addMode: this.ABX, cicle: 4},
            { name: "LDX", opcode: 0xbe, exec: this.LDX, addMode: this.ABY, cicle: 4},
            { name: "???", opcode: 0xbf, exec: this.XXX, addMode: this.IMP, cicle: 4},
        ],
        [
            { name: "CPY", opcode: 0xc0, exec: this.CPY, addMode: this.IMM, cicle: 2},
            { name: "CMP", opcode: 0xc1, exec: this.CMP, addMode: this.IZX, cicle: 6},
            { name: "???", opcode: 0xc2, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xc3, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "CPY", opcode: 0xc4, exec: this.CPY, addMode: this.ZP0, cicle: 3},
            { name: "CMP", opcode: 0xc5, exec: this.CMP, addMode: this.ZP0, cicle: 3},
            { name: "DEC", opcode: 0xc6, exec: this.DEC, addMode: this.ZP0, cicle: 5},
            { name: "???", opcode: 0xc7, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "INY", opcode: 0xc8, exec: this.INY, addMode: this.IMP, cicle: 2},
            { name: "CMP", opcode: 0xc9, exec: this.CMP, addMode: this.IMM, cicle: 2},
            { name: "DEX", opcode: 0xca, exec: this.DEX, addMode: this.IMP, cicle: 2},
            { name: "WAI", opcode: 0xcb, exec: this.XXX, addMode: this.IMP, cicle: 2}, // wait for interrupt no official instruction
            { name: "CPY", opcode: 0xcc, exec: this.CPY, addMode: this.ABS, cicle: 4},
            { name: "CMP", opcode: 0xcd, exec: this.CMP, addMode: this.ABS, cicle: 4},
            { name: "DEC", opcode: 0xce, exec: this.DEC, addMode: this.ABS, cicle: 6},
            { name: "???", opcode: 0xcf, exec: this.XXX, addMode: this.IMP, cicle: 6},
        ],
        [
            { name: "BNE", opcode: 0xd0, exec: this.BNE, addMode: this.REL, cicle: 2},
            { name: "CMP", opcode: 0xd1, exec: this.CMP, addMode: this.IZY, cicle: 5},
            { name: "???", opcode: 0xd2, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xd3, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "???", opcode: 0xd4, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "CMP", opcode: 0xd5, exec: this.CMP, addMode: this.ZPX, cicle: 4},
            { name: "DEC", opcode: 0xd6, exec: this.DEC, addMode: this.ZPX, cicle: 6},
            { name: "???", opcode: 0xd7, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "CLD", opcode: 0xd8, exec: this.CLD, addMode: this.IMP, cicle: 2},
            { name: "CMP", opcode: 0xd9, exec: this.CMP, addMode: this.ABY, cicle: 4},
            { name: "NOP", opcode: 0xda, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xdb, exec: this.XXX, addMode: this.IMP, cicle: 7},
            { name: "???", opcode: 0xdc, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "CMP", opcode: 0xdd, exec: this.CMP, addMode: this.ABX, cicle: 4},
            { name: "DEC", opcode: 0xde, exec: this.DEC, addMode: this.ABX, cicle: 7},
            { name: "???", opcode: 0xdf, exec: this.XXX, addMode: this.IMP, cicle: 7},
        ],
        [
            { name: "CPX", opcode: 0xe0, exec: this.CPX, addMode: this.IMM, cicle: 2},
            { name: "SBC", opcode: 0xe1, exec: this.SBC, addMode: this.IZX, cicle: 6},
            { name: "???", opcode: 0xe2, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xe3, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "CPX", opcode: 0xe4, exec: this.CPX, addMode: this.ZP0, cicle: 3},
            { name: "SBC", opcode: 0xe5, exec: this.SBC, addMode: this.ZP0, cicle: 3},
            { name: "INC", opcode: 0xe6, exec: this.INC, addMode: this.ZP0, cicle: 5},
            { name: "???", opcode: 0xe7, exec: this.XXX, addMode: this.IMP, cicle: 5},
            { name: "INX", opcode: 0xe8, exec: this.INX, addMode: this.IMP, cicle: 2},
            { name: "SBC", opcode: 0xe9, exec: this.SBC, addMode: this.IMM, cicle: 2},
            { name: "NOP", opcode: 0xea, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xeb, exec: this.SBC, addMode: this.IMP, cicle: 2},
            { name: "CPX", opcode: 0xec, exec: this.CPX, addMode: this.ABS, cicle: 4},
            { name: "SBC", opcode: 0xed, exec: this.SBC, addMode: this.ABS, cicle: 4},
            { name: "INC", opcode: 0xee, exec: this.INC, addMode: this.ABS, cicle: 6},
            { name: "???", opcode: 0xef, exec: this.XXX, addMode: this.IMP, cicle: 6},
        ],
        [
            { name: "BEQ", opcode: 0xf0, exec: this.BEQ, addMode: this.REL, cicle: 2},
            { name: "SBC", opcode: 0xf1, exec: this.SBC, addMode: this.IZY, cicle: 5},
            { name: "???", opcode: 0xf2, exec: this.XXX, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xf3, exec: this.XXX, addMode: this.IMP, cicle: 8},
            { name: "???", opcode: 0xf4, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "SBC", opcode: 0xf5, exec: this.SBC, addMode: this.ZPX, cicle: 4},
            { name: "INC", opcode: 0xf6, exec: this.INC, addMode: this.ZPX, cicle: 6},
            { name: "???", opcode: 0xf7, exec: this.XXX, addMode: this.IMP, cicle: 6},
            { name: "SED", opcode: 0xf8, exec: this.SED, addMode: this.IMP, cicle: 2},
            { name: "SBC", opcode: 0xf9, exec: this.SBC, addMode: this.ABY, cicle: 4},
            { name: "NOP", opcode: 0xfa, exec: this.NOP, addMode: this.IMP, cicle: 2},
            { name: "???", opcode: 0xfb, exec: this.XXX, addMode: this.IMP, cicle: 7},
            { name: "???", opcode: 0xfc, exec: this.NOP, addMode: this.IMP, cicle: 4},
            { name: "SBC", opcode: 0xfd, exec: this.SBC, addMode: this.ABX, cicle: 4},
            { name: "INC", opcode: 0xfe, exec: this.INC, addMode: this.ABX, cicle: 7},
            { name: "???", opcode: 0xff, exec: this.XXX, addMode: this.IMP, cicle: 7},
        ]
    ];
}