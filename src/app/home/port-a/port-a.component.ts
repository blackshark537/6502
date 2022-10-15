import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PORTBIT } from 'src/app/Core/CPU/interfaces';
import { VIADeviceService } from 'src/app/Core/Via.service';

@Component({
  selector: 'app-port-a',
  templateUrl: './port-a.component.html',
  styleUrls: ['./port-a.component.scss'],
})
export class PortAComponent implements OnInit, OnDestroy {
  // addr, port
  private value: [number, number] = [0x00, 0x00];
  private sub$: Subscription;

  constructor(
    private device: VIADeviceService
  ) { }

  ngOnInit(): void {
    this.device.on();
    this.sub$ = this.device.PORTA$.subscribe(val=> this.value = val );
  }

  ngOnDestroy(): void {
    if(this.sub$) this.sub$.unsubscribe();    
  }

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
