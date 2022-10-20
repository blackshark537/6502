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
import { ViaComponent } from './via/via.component';
import { MemMapComponent } from './mem-map/mem-map.component';
import { LedsComponent } from './leds/leds.component';
import { LcdComponent } from './lcd/lcd.component';
import { SchematicComponent } from './schematic/schematic.component';
import { LicenseComponent } from './license/license.component';

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
    SchematicComponent,
    CpuComponent,
    ViaComponent,
    LedsComponent,
    LcdComponent,
    LicenseComponent
  ],
})
export class HomePageModule {}
