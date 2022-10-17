import { Component, OnDestroy, OnInit } from '@angular/core';
import { LcdService } from 'src/app/Core/Lcd.service';

@Component({
  selector: 'app-lcd',
  templateUrl: './lcd.component.html',
  styleUrls: ['./lcd.component.scss'],
})
export class LcdComponent implements OnInit, OnDestroy {
  
  constructor(
    public lcdCtrl: LcdService
  ){}

  ngOnInit(): void {
    this.lcdCtrl.init();  
  }

  ngOnDestroy(): void {
      this.lcdCtrl.destroy();
  }

}
