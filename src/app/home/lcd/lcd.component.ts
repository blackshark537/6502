import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LcdDeviceService } from 'src/app/Core/HD44780.service';
import { Device } from 'src/app/Core/interfaces/Device';
import { Screen } from 'src/app/Core/interfaces/Screen';

@Component({
  selector: 'app-lcd',
  templateUrl: './lcd.component.html',
  styleUrls: ['./lcd.component.scss'],
})
export class LcdComponent extends Device implements Screen, AfterViewInit {
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
  reset(): void {}
  
  ngAfterViewInit(): void {
    this.canvas = this.element.nativeElement;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.getContext("2d").fillStyle = "rgb(3, 33, 3)";
    this.rect()
    this.canvas.getContext("2d").textAlign = "left";
    this.lcdCtrl.connectDevice(this);
  }

  fillText(line1: string, line2: string): void {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = this.color;
    this.rect()
    ctx.textAlign = "left";
    ctx.fillStyle = "black";
    ctx.font = "revert"
    ctx.font = "18px Arial";
    ctx.fillText(line1.toUpperCase(), 10, 25);
    
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

  setCursorPos(cursor: number): void {
    this.canvas.getContext('2d').fillStyle = "black";
    this.canvas.getContext("2d").fillText("_", cursor*11.2, 27);
  }

  rect()
  {
    this.canvas.getContext("2d").fillRect(0,0,this.width, this.height);
  }

}
