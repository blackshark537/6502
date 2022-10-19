import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LcdDeviceService } from 'src/app/Core/HD44780.service';
import { Device } from 'src/app/Core/interfaces/Device';
import { Screen } from 'src/app/Core/interfaces/Screen';

@Component({
  selector: 'app-lcd',
  templateUrl: './lcd.component.html',
  styleUrls: ['./lcd.component.scss'],
})
export class LcdComponent extends Device implements Screen, OnInit {
  @ViewChild('screen', {static: true}) element: ElementRef
  canvas: HTMLCanvasElement;
  color = "orange";
  width = 250;
  height = 40;
  constructor(
    public lcdCtrl: LcdDeviceService
  ){
    super(Screen.name)
  }

  read(address: number): number {return 0}
  write(address: number, data: number): void {}

  ngOnInit(): void {
    this.canvas = this.element.nativeElement;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.getContext("2d").fillStyle = "rgb(3, 33, 3)";
    this.rect()
    this.canvas.getContext("2d").textAlign = "left";
    this.lcdCtrl.connectDevice(this);
  }

  fillText(text: string, line=1): void {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = this.color;
    this.rect()
    ctx.textAlign = "left";
    ctx.fillStyle = "black";
    ctx.font = "revert"
    ctx.font = "18px Arial";
    if(line === 1) ctx.fillText(text.toUpperCase(), 10, 25);
    if(line === 2) ctx.fillText("Line: 2", 10, 50);
  }

  turnOnOff(OnOff: boolean): void {
      if(!OnOff)
      {
        this.canvas.getContext("2d").fillStyle = "rgb(3, 33, 3)";
        this.rect()
      } else {
        this.canvas.getContext("2d").fillStyle = this.color;
        this.rect()
      }
  }

  rect()
  {
    this.canvas.getContext("2d").fillRect(0,0,this.width, this.height);
  }

}
