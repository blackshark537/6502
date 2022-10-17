import { Injectable } from "@angular/core";
import { Subscription } from "rxjs";
import { throttleTime } from "rxjs/operators";
import { CPUDeviceService } from "./Cpu.service";
import { HD44780 } from "./CPU/interfaces";
import { VIADeviceService } from "./Via.service";

@Injectable({
  providedIn: 'root'
})
export class LcdService {
  private sub$1: Subscription;
  private sub$2: Subscription;
  private _chars: Array<string>;
  private interval: any
  private speed = 10;
  /**
   * LCD On/Off
   *  true: On false: Off
   */
  private isOn: boolean = false;
  private isCursor: boolean = false;

  /**
   * Instruction Register
   */
  private data = 0x00;

  /**
   * LCD MPU Interface;
   */
  private cmd = 0x00;

  /**
   * Four low order bidirectional tristate data bus pins. 
   * Used for data transfer and receive between the 
   * MPU and the HD44780U. These pins are not used during 4-bit operation
   */
  private lo = 0x03;

  /**
   * Four high order bidirectional tristate data bus 
   * pins. Used for data transfer and receive between 
   * the MPU and the HD44780U. DB7 can be used as a busy flag.
   */
  private hi = 0x02;

  private cursor: number = 0;

  /**     MSB
   * LSB | x | x | x | x |
   *     | x | x | x | x |
   */
  private charCodes = [
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

  commands = {
    0x01: 'clear'
  }
  constructor(
    private device: VIADeviceService,
    cpu: CPUDeviceService
  ) { 
    this.speed = cpu.sync;
  }

  init(): void {
    this._chars = new Array(32);

    this.sub$1 = this.device.PORTA$.pipe(
      throttleTime(this.speed),
    ).subscribe(buffer => {
      this.cmd = (buffer[0] & buffer[1]);
      if (
        this.GetCmdFlag(HD44780.RW) === 0 &&
        this.GetCmdFlag(HD44780.E) === 1
      ) {

        // It's instruction
        if (this.GetCmdFlag(HD44780.RS) === 0) {

          if (
            this.GetDataFlag(HD44780.A) === 1 &&
            this.GetDataFlag(HD44780.B) === 0 &&
            this.GetDataFlag(HD44780.C) === 0 &&
            this.GetDataFlag(HD44780.D) === 0
          ) this.clear();

          if (
            this.GetDataFlag(HD44780.B) === 1 &&
            this.GetDataFlag(HD44780.C) === 0 &&
            this.GetDataFlag(HD44780.D) === 0
          ) this.returnHome();

          if (
            this.GetDataFlag(HD44780.C) === 1 &&
            this.GetDataFlag(HD44780.D) === 0
          ) this.moveCursor(!!this.GetDataFlag(HD44780.B));

          if (
            this.GetDataFlag(HD44780.D) === 1
          ) {
            this.blinkCursor(!!this.GetDataFlag(HD44780.A));
            this.showCursor(!!this.GetDataFlag(HD44780.B));
            this.displayOn(!!this.GetDataFlag(HD44780.C));
          }
        }
        else {
          this.print();
        }
      }
    });

    this.sub$2 = this.device.PORTB$.subscribe(buffer => {
      this.data = (buffer[0] & buffer[1]);
    });
  }

  destroy(): void {
    if (this.sub$1) this.sub$1.unsubscribe();
    if (this.sub$2) this.sub$2.unsubscribe();
  }

  private GetDataFlag(f: HD44780): number {
    return ((this.data & f) > 0) ? 1 : 0;
  }

  private GetCmdFlag(f: HD44780): number {
    return ((this.cmd & f) > 0) ? 1 : 0;
  }

  /**
   * Clears entire display and 
   * sets DDRAM address 0 in 
   * address counter.
   * command 0x01
   */
  private clear() {
    this._chars.fill('');
  }

  /**
   * Sets DDRAM address 0 in address counter. 
   * Also returns display from being shifted to original position.
   * DDRAM contents remain unchanged.
   * command 0x02
   */
  private returnHome() {
    this.cursor = 0;
  }

  /**
   * Sets cursor move direction and specifies display shift.
   * These operations are performed during data write and read.
   * Command 0x04 Decrement
   * Command 0x06 Increment
   * Command 0x05 Display Shift L
   * Command 0x07 Display Shift R
   */
  private moveCursor(direction = true) {
    direction ? this.cursor += 1 : this.cursor -= 1;
    if (this.cursor >= 16) this.cursor = 0;
    if (this.cursor < 0) this.cursor = 16;
  }

  /**
   * Sets entire display (D) on/off, 
   * Command 0x0C Display      0x0C: On  0x08: Off
   */
  displayOn(OnOff = true) {
    this.isOn = OnOff;
    if (!OnOff) {
      clearInterval(this.interval);
      return;
    }
  }

  /**
   * blinking of cursor position character (B).
   * Command 0x09 Blink Cursor 1: On  0: Off
   */
  blinkCursor(OnOff = false) {
    if (OnOff && this.isCursor) {

      let blink = false;
      this.interval = setInterval(() => {
        blink ? this._chars[this.cursor] = '_' : this._chars[this.cursor] = '';
        blink = !blink;
      }, 800);
    }
    else {
      if (this.interval) clearInterval(this.interval);
    }
  }

  /**
  * cursor on/off (C), and 
  */
  showCursor(OnOff: boolean) {
    this.isCursor = OnOff;
    this.isCursor ? this._chars[this.cursor] = '_' : this._chars[this.cursor] = '';
  }

  print() {

    if (!this.isOn) return;

    this.hi = this.data >> 4 & 0x0F;
    this.lo = this.data & 0x0F;

    const char = this.charCodes[this.lo][this.hi];

    if (!!char) {
      this._chars[this.cursor] = char
    }
  }

  get chars(): string {
    return this._chars.join('');
  }

  set chars(val: string) {
    this._chars.fill('').join(val);
  }

  get displayOnOff(): boolean {
    return this.isOn
  }

  set displayOnOff(val: boolean) {
    this.isOn = val;
  }

}