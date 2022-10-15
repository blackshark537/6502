import { Component, OnInit } from '@angular/core';
import { BufferService } from 'src/app/Core';

@Component({
  selector: 'app-mem-buffer',
  templateUrl: './mem-buffer.component.html',
  styleUrls: ['./mem-buffer.component.scss'],
})
export class MemBufferComponent implements OnInit {
  private BUS: {[address: string]: string[]};
  private colors = [ 'dark', 'primary', 'success', 'warning', 'danger','secundary', 'tertiary']
  LSB_ADDRESS: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e','f'];
  MSB_ADDRESS: string[] = [];
  FROM: string = '0000';

  constructor(
    private readonly buffer: BufferService
  ) { }

  ngOnInit(): void 
  {
    this.buffer.getBus().subscribe(bus=>{
      this.BUS = bus;
      this.MSB_ADDRESS = Object.keys(bus);
    });
  }

  load(): void
  {
    let from = parseInt(this.FROM, 16);
    let to =  from + 0xff;
    this.buffer.FromTo(from, to);
    this.buffer.load();
  }

  clear()
  {
    this.buffer.clear();
  }

  getCols(hi_address: string): string[]
  {
    return this.BUS[hi_address];
  }

  getColor(value: string): string
  {
    const indx = parseInt(value) % this.colors.length;
    return this.colors[indx];
  }

  get TO(): string
  {
    let from = parseInt(this.FROM, 16);
    return (from + 0x0ff).toString(16);
  }
}
