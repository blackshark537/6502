import { Component, OnInit } from '@angular/core';
import { VIADeviceService } from 'src/app/Core';

@Component({
  selector: 'app-via',
  templateUrl: './via.component.html',
  styleUrls: ['./via.component.scss'],
})
export class ViaComponent implements OnInit {

  constructor(
    public device: VIADeviceService
  ) { }

  ngOnInit(): void {
    this.device.on();
  }

}
