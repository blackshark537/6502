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
  isSerial = false;

  constructor(
    public device: VIADeviceService
  ) { }

  async request()
  {
    if("serial" in navigator && !this.isSerial)
    {
      const port = await (navigator as any).serial.requestPort();
      if(port) this.isSerial = true;
      const { usbProductId, usbVendorId  } = port.getInfo();
      
      console.log(usbProductId, usbVendorId );

      await port.open({ baudRate: 9600 });

      const writer = port.writable.getWriter();
      const data = new Uint8Array([104, 101, 108, 108, 111]); // hello
      
      setTimeout(async ()=>{
        await writer.write(data);
        // Allow the serial port to be closed later.
        writer.releaseLock();
      }, 1000);
    }
  }
}
