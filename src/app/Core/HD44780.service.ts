/**
 * HD44780U (LCD-II) (Dot Matrix Liquid Crystal Display Controller/Driver)
 * 
 * Description:
 * 
 * The HD44780U dot-matrix liquid crystal display controller and driver LSI displays alphanumerics 
 * and symbols. It can be configured to drive a dot-matrix liquid crystal display under the control of a 4- or 8-bit microprocessor.
 * Since all the functions such as display RAM, character generator, and liquid crystal driver, 
 * required for driving a dot-matrix liquid crystal display are internally provided on one chip, 
 * a minimal system can be interfaced with this controller/driver.
 * 
 */

import { Injectable } from "@angular/core";
import { Device } from "./interfaces/Device";
import { HD44780, HD44780_STATUS, PORTBIT } from "./interfaces";
import { Screen } from "./interfaces/Screen";

@Injectable({
  providedIn: 'root'
})
export class LcdDeviceService extends Device {

  /**
   * Helper Variables
   */
  private N = 0; // 0. 1-line display 1. 2-line display
  private C = 0; // Cursor off
  private B = 0; // Blinking off
  private D = 0; // Display off
  private S = 0; // Accompanies display shift, The display does not shift if S is 0.
  private ID = 1; // 1. Increment by 1 0. decrement
  private SC = 0; // 1. display shift 0. Cursor move
  private RL = 0; // 1. shift to the right 0. shift to the left

  /**
   * The address counter (AC) assigns addresses to both DDRAM and CGRAM. 
   * When an address of an instruction is written into the IR, the address information is sent from the IR to the AC. 
   * Selection of either DDRAM or CGRAM is also determined concurrently by the instruction. 
   * After writing into (reading from) DDRAM or CGRAM, the AC is automatically incremented by 1 
   * (decremented by 1). The AC contents are then output to DB0 to DB6 when RS = 0 and R/W = 1
   * 
   * Address counter
   */
  private AC = 0x00;

  /**
   * The HD44780U has two 8-bit registers, an instruction register (IR) and a data register (DR).
   * The IR stores instruction codes, such as display clear and cursor shift, and address information for 
   * display data RAM (DDRAM) and character generator RAM (CGRAM). 
   * The IR can only be written from the MPU.
   * Instruction register (IR)
   */
  private IR = 0x00;

  /**
   * The DR temporarily stores data to be written into DDRAM or CGRAM and temporarily stores data to be read from DDRAM or CGRAM. 
   * Data written into the DR from the MPU is automatically written into DDRAM or CGRAM by an internal operation. 
   * The DR is also used for data storage when reading data from DDRAM or CGRAM. When address information is written into the IR, 
   * data is read and then stored into the DR from DDRAM or CGRAM by an internal operation. 
   * Data transfer between the MPU is then completed when the MPU reads the DR. 
   * After the read, data in DDRAM or CGRAM at the next address is sent to the DR for the next read from the MPU. 
   * By the register selector (RS) signal, these two registers can be selected.
   * 
   * Data Register
   */
  private DR = 0x00;

  /**
   * Busy Flag Register
   */
  private BF: boolean = false;

  /**
   * Display data RAM (DDRAM) stores display data represented in 8-bit character codes. 
   * Its extended capacity is 80 × 8 bits, or 80 characters. 
   * The area in display data RAM (DDRAM) that is not used for display can be used as general data RAM.
   * 
   * Display data RAM
   */
  private DDRAM_SIZE = 80;
  private DDRAM: Array<string> = [
    " "," "," "," "," "," "," "," "," "," ",
    " "," "," "," "," "," "," "," "," "," ",
    " "," "," "," "," "," "," "," "," "," ",
    " "," "," "," "," "," "," "," "," "," ",
    " "," "," "," "," "," "," "," "," "," ",
    " "," "," "," "," "," "," "," "," "," ",
    " "," "," "," "," "," "," "," "," "," ",
  ];

  /**
   * In the character generator RAM, the user can rewrite character patterns by program. 
   * For 5 × 8 dots, eight character patterns can be written, and for 5 × 10 dots, four character patterns can be written.
   * Due the complexity it takes I'm not going to do this function.
   * 
   * Character generator RAM
   * private CGRAM: Array<string> = new Array(64);
   */

  /**
    * Character generator ROM
    *
    *     MSB
    * LSB | x | x | x | x |
    *     | x | x | x | x |
    */
  private readonly CGROM = [
    ['?', '?', ' ', '0', '@', 'P', '`', 'p', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '!', '1', 'A', 'Q', 'a', 'q', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '"', '2', 'B', 'R', 'b', 'r', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '#', '3', 'C', 'S', 'c', 's', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '$', '4', 'D', 'T', 'd', 't', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '%', '5', 'E', 'U', 'e', 'u', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '&', '6', 'F', 'V', 'f', 'v', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', "'", '7', 'G', 'W', 'g', 'w', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '(', '8', 'H', 'X', 'h', 'x', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', ')', '9', 'I', 'Y', 'i', 'y', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '*', ':', 'J', 'Z', 'j', 'z', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '+', ';', 'K', '[', 'k', '(', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', ',', '<', 'L', '', 'l', '|', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '-', '=', 'M', ']', 'm', ')', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '.', '>', 'N', '^', 'n', '>', '?', '?', '?', '-', '?', '?', '?', '?'],
    ['?', '?', '/', '?', 'O', '_', 'o', '<', '?', '?', '?', '-', '?', '?', '?', '?'],
  ];

  /**
  * Cursor pointer
  */
  private cursor: number = 0;

  /**
   * offset helper is used to shift the display
   */
  private offset1: number = 0;
  private offset2: number = 40;

  /**
   * Defines the maximun character by each line
   */
  public CHARS_PER_LINE = 16;

  constructor() {
    super(LcdDeviceService.name);
  }

  /**
   * An internal reset circuit automatically initializes the HD44780U when the power is turned on. 
   * The following instructions are executed during the initialization. 
   * The busy flag (BF) is kept in the busy state until the initialization ends (BF = 1). 
   * The busy state lasts for 10 ms after VCC rises to 4.5 V.
   */
  reset() {
    this.DR = 0x00;
    this.BF = true;
    this.SetDataFlag(PORTBIT.DB7, this.BF);
    this.clearDisplay();
    this.returnHome();
    this.N = 0;
    this.D = 0;
    this.C = 0;
    this.B = 0;
    this.ID = 0;
    this.S = 0;
    this.RL = 0;
    this.SC = 0;
    this.BF = false;
    this.AC = 0;
    this.cursor=0;
    this.offset1=0;
    this.offset2=40;
    this.SetDataFlag(PORTBIT.DB7, this.BF);
  }

  read(address: number): number {
    /**
     * Reads busy flag (BF) indicating internal operation 
     * is being performed and reads address counter contents.
     * 
     */
    if (
      this.GetCmdFlag(HD44780.RS) === 0 &&
      this.GetCmdFlag(HD44780.RW) === 1
    ) return this.AC | this.GetDataFlag(PORTBIT.DB7);
  }

  write(data: number, cmd: number) {
    this.IR = cmd;
    this.DR = data;

    // if instruction:
    if (
      this.GetCmdFlag(HD44780.RW) === 0 &&
      this.GetCmdFlag(HD44780.E) === 1 &&
      !this.BF
    ) {
      if (this.GetCmdFlag(HD44780.RS) === 0) {
        this.BF = true; // display is busy
        
        this.decodeInstruction();
      }
      // if data:
      else { 
        // continue if screen is on.
        if(!this.D) return;
        // Read From Character Generator Rom CGROM
        const hi = this.DR >> 4 & 0x0F;
        const lo = this.DR & 0x0F;
        const char = this.CGROM[lo][hi];
        // Place character into DDRAM
        this.DDRAM[this.AC] = char;
        this.AC += this.ID? 1 : -1; //Increment Address Counter

        /**
         * Shifts the entire display either to the right (I/D = 1) or 
         * to the left (I/D = 0) when S is 1. 
         * The display does not shift if S is 0.
         */
        if (this.S === 1) {
          this.offset1 += this.ID? 1 : -1;
          this.offset2 += this.ID? 1 : -1;
        } else if(this.AC > this.CHARS_PER_LINE-1 && this.AC < 40){
          this.AC = 40;
          this.cursor = this.AC;
        }else{
          this.cursor = this.AC;
        }

        // if address register is less than 0
        // go to ddram end
        if(this.AC < 0) this.AC = this.DDRAM_SIZE-1;

        // if Address Register overflow go back to 0
        // also reset cursor and screen offset
        if(this.AC > this.DDRAM_SIZE){ 
          this.AC = 0;
          this.offset1 = 0;
          this.offset2 = 0;
          this.cursor = 0;
        }

        this.refreshScreen();
      }
      this.BF = false; // clear busy
    }
  }

  /**
   * 
   */
  public internalState(): HD44780_STATUS {
      return {
        cursor: this.cursor,
        address: this.AC,
        offset1: this.offset1,
        offset2: this.offset2,
        busy: this.GetDataFlag(PORTBIT.DB7),
      }
  }
 /**
 * Decode Instructions.
 */
  private decodeInstruction() {
    /**
     * Clear display.
     */
    if (
      this.GetDataFlag(PORTBIT.DB0) === 1 &&
      this.GetDataFlag(PORTBIT.DB1) === 0 &&
      this.GetDataFlag(PORTBIT.DB2) === 0 &&
      this.GetDataFlag(PORTBIT.DB3) === 0 &&
      this.GetDataFlag(PORTBIT.DB4) === 0 &&
      this.GetDataFlag(PORTBIT.DB5) === 0 &&
      this.GetDataFlag(PORTBIT.DB6) === 0 &&
      this.GetDataFlag(PORTBIT.DB7) === 0
    ) this.clearDisplay();
    /**
     * Return home.
     */
    if (
      this.GetDataFlag(PORTBIT.DB1) === 1 &&
      this.GetDataFlag(PORTBIT.DB2) === 0 &&
      this.GetDataFlag(PORTBIT.DB3) === 0 &&
      this.GetDataFlag(PORTBIT.DB4) === 0 &&
      this.GetDataFlag(PORTBIT.DB5) === 0 &&
      this.GetDataFlag(PORTBIT.DB6) === 0 &&
      this.GetDataFlag(PORTBIT.DB7) === 0 
    ) this.returnHome();
    /**
     * Entry mode set.
     */
    if (
      this.GetDataFlag(PORTBIT.DB2) === 1 &&
      this.GetDataFlag(PORTBIT.DB3) === 0 &&
      this.GetDataFlag(PORTBIT.DB4) === 0 &&
      this.GetDataFlag(PORTBIT.DB5) === 0 &&
      this.GetDataFlag(PORTBIT.DB6) === 0 &&
      this.GetDataFlag(PORTBIT.DB7) === 0 
    ) this.entryMode();
    /**
     * Display on/off control
     * Sets entire display (D) on/off, 
     * cursor on/off (C), and blinking 
     * of cursor position character (B).
     * blinking is not implemented
     */
    if (
      this.GetDataFlag(PORTBIT.DB3) === 1 &&
      this.GetDataFlag(PORTBIT.DB4) === 0 &&
      this.GetDataFlag(PORTBIT.DB5) === 0 &&
      this.GetDataFlag(PORTBIT.DB6) === 0 &&
      this.GetDataFlag(PORTBIT.DB7) === 0 
    ){
      this.cursorOnOffControl(!!this.GetDataFlag(PORTBIT.DB1));
      this.displayOnOffControl(!!this.GetDataFlag(PORTBIT.DB2));
    }
    /**
     * Cursor or display shift
     * Moves cursor and shifts display 
     * without changing DDRAM contents.
     */
     if (
      this.GetDataFlag(PORTBIT.DB4) === 1 &&
      this.GetDataFlag(PORTBIT.DB5) === 0 &&
      this.GetDataFlag(PORTBIT.DB6) === 0 &&
      this.GetDataFlag(PORTBIT.DB7) === 0 
    ) this.cursorDisplayShift();
    /**
     * Function set
     */
    if(
      this.GetDataFlag(PORTBIT.DB5) === 1 &&
      this.GetDataFlag(PORTBIT.DB6) === 0 &&
      this.GetDataFlag(PORTBIT.DB7) === 0 
    ) this.functionSet();

    /**
     * following commands are not supported
     * 
     * 1 - Sets CGRAM address. CGRAM data is sent and received after this setting.
     * 2 - Sets DDRAM address. DDRAM data is sent and received after this setting.
     * 
     */
    if(
      this.GetDataFlag(PORTBIT.DB6) === 1 &&
      this.GetDataFlag(PORTBIT.DB7) === 0 
    ) this.setCGramAdd();

    /**
     * Read busy flag & address
     */
      if (
        this.GetCmdFlag(HD44780.RW) === 1
      ) this.SetDataFlag(PORTBIT.DB7, this.BF);
  }

  private GetDataFlag(f: PORTBIT): number {
    return ((this.DR & f) > 0) ? 1 : 0;
  }

  private SetDataFlag(f: PORTBIT, v: boolean | number): void {
    if (v)
      this.DR |= f;
    else
      this.DR &= ~f;
  }

  private GetCmdFlag(f: HD44780): number {
    return ((this.IR & f) > 0) ? 1 : 0;
  }

  /**
   * Sets interface data length (DL), 
   * number of display lines (N), and character font (F).
   */
  private functionSet()
  {
    //this.N = this.GetDataFlag(PORTBIT.DB3);
  }

  /**
   * Clears entire display and 
   * sets DDRAM address 0 in 
   * address counter.
   */
  private clearDisplay() {
    this.DDRAM = new Array(this.DDRAM_SIZE);
    this.AC = 0;
  }

  /**
   * Sets DDRAM address 0 in address counter. 
   * Also returns display from being shifted to original position.
   * DDRAM contents remain unchanged.
   * command 0x02
   */
  private returnHome() {
    this.AC = 0;
    this.cursor = 0;
    this.offset1 = 0;
    this.offset2 = 40;
  }

  /**
   * Sets cursor move direction and specifies display shift.
   * These operations are performed during data write and read.
   * Command 0x04 Decrement
   * Command 0x06 Increment
   * Command 0x05 Display Shift On
   * Command 0x07 Display Shift Off
   */
  private entryMode() {
    this.S = this.GetDataFlag(PORTBIT.DB0);
    this.ID = this.GetDataFlag(PORTBIT.DB1);
  }

  /**
   * Sets entire display (D) on/off, 
   * Command 0x0C Display    0x0C: On  0x08: Off
   */
  private displayOnOffControl(OnOff = false) {
    this.D = OnOff ? 1 : 0;
    let _screen = this.hasDevice(Screen.name) as Screen;
    _screen.turnOnOff(OnOff);
  }
/**
 * Moves cursor and shifts display without changing DDRAM contents.
 * Cursor or display shift shifts the cursor position or display to the right or left 
 * without writing or reading display data (Table 7). This function is used to correct or search the display. 
 * In a 2-line display, the cursor moves to the second line when it passes the 40th digit of the first line. 
 * Note that the first and second line displays will shift at the same time.
 */
 private cursorDisplayShift()
  {
    this.RL = this.GetDataFlag(PORTBIT.DB2);
    this.SC = this.GetDataFlag(PORTBIT.DB3);
    /**
     *  S/C   R/L
     *  0     0  Shifts the cursor position to the left.(AC is decremented by one.)
     *  0     1  Shifts the cursor position to the right. (AC is incremented by one.)
     *  1     0  Shifts the entire display to the left. The cursor follows the display shift.
     *  1     1  Shifts the entire display to the right. The cursor follows the display shift.
     */
    if(!this.SC && !this.RL){
      this.cursor -= 1;
      this.AC -= 1; 
    }else if(!this.SC && !!this.RL){
      this.cursor += 1;
      this.AC += 1
    }

    if(!!this.SC && !this.RL){
        this.offset1 -= 1;
        this.offset2 -= 1;
        this.cursor += 1;
    }else if(!!this.SC && !!this.RL){
      this.offset1 += 1;
      this.offset2 += 1;
      this.cursor -= 1;
    }
    this.refreshScreen();
  }

  /**
  * cursor on/off (C)
  */
   private cursorOnOffControl(OnOff: boolean) {
    this.C = OnOff ? 1 : 0;
  }

  /**
   * blinking of cursor position character (B).
   * Command 0x09 Blink Cursor 1: On  0: Off
   * 
   * Not implementing blink
   */
   private  blinkCursor() {}

   /**
    * Set CGRAM address sets the CGRAM address binary AAAAAA into the address counter. 
    * Data is then written to or read from the MPU for CGRAM.
    */
  setCGramAdd()
  {

  }

  private refreshScreen() {
    let _screen = this.hasDevice(Screen.name) as Screen;
    _screen.fillText(this.line1, this.line2);
  }

  get line1(): string[] {
    return this.DDRAM.filter((el, i)=> i < (this.N? 39 : 79) && i >= (this.offset1-1) )
  }

  get line2(): string[] {
    return this.DDRAM.filter((el, i)=> i >= this.offset2 )
  }

  get cursorPos(): number{
    return this.C? this.cursor : -10;
  }

}