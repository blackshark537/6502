import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'zeropad'
})
export class ZeropadPipe implements PipeTransform {

  zeroPad = (num, places) => String(num).padStart(places, '0')

  transform(value: string, zeros: number): string {
    return this.zeroPad(value, zeros).toUpperCase();
  }

}
