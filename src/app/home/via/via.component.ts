import { Component } from '@angular/core';
import { VIADeviceService } from 'src/app/Core';

@Component({
  selector: 'app-via',
  templateUrl: './via.component.html',
  styleUrls: ['./via.component.scss'],
})
export class ViaComponent {

  constructor(
    public device: VIADeviceService
  ) { }

}
