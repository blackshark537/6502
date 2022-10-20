import { Component, Input, OnInit } from '@angular/core';
import { PORTBIT } from 'src/app/Core/interfaces';

@Component({
  selector: 'app-leds',
  templateUrl: './leds.component.html',
  styleUrls: ['./leds.component.scss'],
})
export class LedsComponent {
  // addr, port
  @Input('set')value: [number, number] = [0x00, 0x00];
  @Input('label') label = 'LEDS'
  @Input('color') color: string = 'danger';
  
  constructor(
  ) { }

  get BIT0(): boolean
  {
    return !!((this.value[0] & PORTBIT.DB0) & (this.value[1] & PORTBIT.DB0));
  }

  get BIT1(): boolean
  {
    return !!((this.value[0] & PORTBIT.DB1) & (this.value[1] & PORTBIT.DB1));
  }

  get BIT2(): boolean
  {
    return !!((this.value[0] & PORTBIT.DB2) & (this.value[1] & PORTBIT.DB2));
  }

  get BIT3(): number | boolean
  {
    return !!((this.value[0] & PORTBIT.DB3) & (this.value[1] & PORTBIT.DB3));
  }

  get BIT4(): boolean
  {
    return !!((this.value[0] & PORTBIT.DB4) & (this.value[1] & PORTBIT.DB4));
  }

  get BIT5(): boolean
  {
    return !!((this.value[0] & PORTBIT.DB5) & (this.value[1] & PORTBIT.DB5));
  }

  get BIT6(): boolean
  {
    return !!((this.value[0] & PORTBIT.DB6) & (this.value[1] & PORTBIT.DB6));
  }

  get BIT7(): boolean
  {
    return !!((this.value[0] & PORTBIT.DB7) & (this.value[1] & PORTBIT.DB7));
  }
}
