import { Component, Input, OnInit } from '@angular/core';
import { PORTBIT } from 'src/app/Core/CPU/interfaces';

@Component({
  selector: 'app-leds',
  templateUrl: './leds.component.html',
  styleUrls: ['./leds.component.scss'],
})
export class LedsComponent {
  // addr, port
  @Input('set')value: [number, number] = [0x00, 0x00];
  @Input('color') color: string = 'danger';
  
  constructor(
  ) { }

  get BIT0(): boolean
  {
    return !!((this.value[0] & PORTBIT.A) & (this.value[1] & PORTBIT.A));
  }

  get BIT1(): boolean
  {
    return !!((this.value[0] & PORTBIT.B) & (this.value[1] & PORTBIT.B));
  }

  get BIT2(): boolean
  {
    return !!((this.value[0] & PORTBIT.C) & (this.value[1] & PORTBIT.C));
  }

  get BIT3(): number | boolean
  {
    return !!((this.value[0] & PORTBIT.D) & (this.value[1] & PORTBIT.D));
  }

  get BIT4(): boolean
  {
    return !!((this.value[0] & PORTBIT.E) & (this.value[1] & PORTBIT.E));
  }

  get BIT5(): boolean
  {
    return !!((this.value[0] & PORTBIT.F) & (this.value[1] & PORTBIT.F));
  }

  get BIT6(): boolean
  {
    return !!((this.value[0] & PORTBIT.G) & (this.value[1] & PORTBIT.G));
  }

  get BIT7(): boolean
  {
    return !!((this.value[0] & PORTBIT.H) & (this.value[1] & PORTBIT.H));
  }
}
