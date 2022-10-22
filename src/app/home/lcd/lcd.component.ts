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
  contrast = .4;

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
    ctx.textAlign = "center";
    ctx.font = "bold"
    ctx.font = "35px oswald";
    ctx.drawImage(this.bgImg, -30, 0,this.width, this.height);
    
    this.lcdCtrl.connectDevice(this);
    this.turnOnOff(false);
  }

  fillText(): void {
    const parent = (this.parent as LcdDeviceService);
    
    const c = parent.cursorPos;

    const ctx = this.canvas.getContext('2d');
    
    ctx.fillStyle = this.color;
    this.rect();

    const line1 = parent.line1;
    const line2 = parent.line2;

    for (let i = 0; i < this.CHARS_PER_LINE; i++) {
      
      let ch = line1[i]?? ' ';
      let ch2 = line2[i]?? ' ';
      ctx.fillStyle = "white";

      ctx.fillText('_', 55+(15.5* c), 75+27);

      ctx.fillText(ch, 55+(15.3*i), 75+22);
      ctx.fillText(ch2, 55+(15.3*i), 104+22);

      ctx.fillStyle = `rgba(10, 11, 237,${this.contrast})`;
      ctx.fillRect(47+(15.5*i), 75, 14, 27);
      ctx.fillRect(47+(15.5*i), 104, 14, 27);
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

  rect()
  {
    this.canvas.getContext("2d").fillRect(22,52, 298, 98);
  }

}
