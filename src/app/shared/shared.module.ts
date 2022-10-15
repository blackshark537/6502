import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZeropadPipe } from './pipes/zeropad.pipe';



@NgModule({
  declarations: [ZeropadPipe],
  imports: [
    CommonModule
  ],
  exports: [ZeropadPipe]
})
export class SharedModule { }
