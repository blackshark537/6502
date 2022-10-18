import { Component, OnInit } from '@angular/core';
import { ComputerService } from 'src/app/Core';

@Component({
  selector: 'app-cpu',
  templateUrl: './cpu.component.html',
  styleUrls: ['./cpu.component.scss'],
})
export class CpuComponent {

  constructor(
    public device: ComputerService
  ) { }

}
