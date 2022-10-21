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
  color = "cornflowerblue";//"orange";
  width = 250;
  height = 40;
  bgImg = new Image();

  constructor(
    public lcdCtrl: LcdDeviceService
  ){
    super(Screen.name)
    this.bgImg.src = "assets/imgs/lcd.png"
  }

  read(address: number): number {return 0}
  write(address: number, data: number): void {}
  reset(): void {}
  
  ngAfterViewInit(): void {
    
    this.bgImg.onload = ()=>{
      this.display();
    }
  }

  display()
  {
    this.width = this.bgImg.width-162;
    this.height = this.bgImg.height-190;
    this.canvas = this.element.nativeElement;
    this.canvas.width = this.bgImg.width;
    this.canvas.height = this.bgImg.height;
    this.canvas.getContext("2d").fillStyle = "rgb(3, 33, 3)";
    
    this.canvas.getContext("2d").textAlign = "left";
    this.canvas.getContext("2d").drawImage(this.bgImg, -30, 0 );
    this.lcdCtrl.connectDevice(this);
    this.rect()
  }

  fillText(line1: string, line2: string): void {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = this.color;
    ctx.drawImage(this.bgImg, -30, 0 );
    this.rect()
    ctx.textAlign = "left";
    ctx.font = "bold"
    ctx.font = "32px Arial";
    ctx.fillStyle = "gray";
    ctx.fillStyle = "white";
    let pos = 70;
    ctx.fillText(line1.toUpperCase(), pos, 140);
    ctx.fillText(line2.toUpperCase(), pos, 180);
  }

  turnOnOff(OnOff: boolean): void {
      if(OnOff === false)
      {
        this.canvas.getContext("2d").fillStyle = "rgb(3, 33, 3)";
        this.rect()
      } else {
        this.canvas.getContext("2d").fillStyle = this.color;
        this.rect()
      }
  }

  setCursorPos(cursor: number): void {
    this.canvas.getContext('2d').fillStyle = "white";
    this.canvas.getContext("2d").fillText("_", cursor+400, 140);
  }

  rect()
  {
    this.canvas.getContext("2d").fillRect(52,98,this.width, this.height);
  }

}
