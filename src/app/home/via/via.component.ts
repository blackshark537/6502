import { Component, OnInit } from '@angular/core';
import { VIADeviceService } from 'src/app/Core';

@Component({
  selector: 'app-via',
  templateUrl: './via.component.html',
  styleUrls: ['./via.component.scss'],
})
export class ViaComponent {
  isSettings = false;
  isPorts = false;
  constructor(
    public device: VIADeviceService
  ) { }

}
