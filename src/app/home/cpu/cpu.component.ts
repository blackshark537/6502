import { Component, OnInit } from '@angular/core';
import { CPUDeviceService } from 'src/app/Core';

@Component({
  selector: 'app-cpu',
  templateUrl: './cpu.component.html',
  styleUrls: ['./cpu.component.scss'],
})
export class CpuComponent implements OnInit {

  constructor(
    public device: CPUDeviceService
  ) { }

  ngOnInit() {}

}
