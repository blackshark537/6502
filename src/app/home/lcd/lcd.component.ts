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
  width = 400;
  height = 200;
  bgImg = new Image();
  CHARS_PER_LINE = 0;

  constructor(
    public lcdCtrl: LcdDeviceService
  ){
    super(Screen.name)
    this.bgImg.src = "assets/imgs/lcd.png"
    this.CHARS_PER_LINE = lcdCtrl.CHARS_PER_LINE;
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
    this.canvas = this.element.nativeElement;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const ctx = this.canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = "left";
    ctx.drawImage(this.bgImg, -30, 0,this.width, this.height);
    
    this.lcdCtrl.connectDevice(this);
    this.turnOnOff(false);
  }

  fillText(line1: string, line2: string): void {
    
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = this.color;
    this.rect()

    ctx.textAlign = "center";
    ctx.font = "bold"
    ctx.font = "35px oswald";
    for (let i = 0; i < this.CHARS_PER_LINE; i++) {
      let ch = line1[i]?? ' ';
      ctx.fillStyle = 'rgb(11, 94, 134)';
      ctx.fillRect(47+(15.5*i), 75, 14, 27);
      ctx.fillStyle = "white";
      ctx.fillText(ch, 55+(15.3*i), 75+22);
    }
    
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
    this.canvas.getContext("2d").fillRect(22,52, 298, 98);
  }

}
