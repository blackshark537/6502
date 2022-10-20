import { Component, OnInit } from '@angular/core';
import { MemoryService } from 'src/app/Core';

@Component({
  selector: 'app-mem-buffer',
  templateUrl: './mem-buffer.component.html',
  styleUrls: ['./mem-buffer.component.scss'],
})
export class MemBufferComponent implements OnInit {
  private BUS: {[address: string]: string[]};
  LSB_COLS: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e','f'];
  MSB_COLS: string[] = [];
  FROM: string = '0000';

  constructor(
    private readonly buffer: MemoryService
  ) { }

  ngOnInit(): void 
  {
    this.buffer.getBus().subscribe(BUS=>{
      this.MSB_COLS = Object.keys(BUS);
      this.BUS = BUS;
    });
  }

  load(): void
  {
    let from = parseInt(this.FROM, 16);

    this.buffer.FromTo(from, from + 0xff);
    this.buffer.refresh();
  }

  clear()
  {
    this.buffer.clear();
  }

  getCols(address_col: string): string[]
  {
    return this.BUS[address_col];
  }

  get TO(): string
  {
    let from = parseInt(this.FROM, 16);
    return (from + 0x0ff).toString(16);
  }
}
