import { Component, OnDestroy, OnInit } from '@angular/core';
import { LcdDeviceService } from 'src/app/Core/HD44780.service';

@Component({
  selector: 'app-lcd',
  templateUrl: './lcd.component.html',
  styleUrls: ['./lcd.component.scss'],
})
export class LcdComponent {
  
  constructor(
    public lcdCtrl: LcdDeviceService
  ){}

}
