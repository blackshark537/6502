import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { CodeComponent } from './code/code.component';
import { MemBufferComponent } from './mem-buffer/mem-buffer.component';
import { SharedModule } from '../shared/shared.module';
import { CpuComponent } from './cpu/cpu.component';
import { PortAComponent } from './port-a/port-a.component';
import { PortBComponent } from './port-b/port-b.component';
import { ViaComponent } from './via/via.component';
import { MemMapComponent } from './mem-map/mem-map.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    HomePageRoutingModule
  ],
  declarations: [
    HomePage, 
    CodeComponent, 
    MemBufferComponent, 
    MemMapComponent,
    CpuComponent,
    ViaComponent,
    PortAComponent,
    PortBComponent,
  ],
})
export class HomePageModule {}
