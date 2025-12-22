import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * Custom pipe to format dates in European/Bosnian format: dd.MM.yyyy
 * Usage: {{ dateValue | europeanDate }}
 * Usage with time: {{ dateValue | europeanDate:'datetime' }}
 */
@Pipe({
  name: 'europeanDate',
  standalone: true
})
export class EuropeanDatePipe implements PipeTransform {
  private datePipe = new DatePipe('bs-BA');

  transform(value: any, format: 'date' | 'datetime' | 'short' = 'date'): string | null {
    if (!value) return null;

    // Convert string to Date if needed
    const date = value instanceof Date ? value : new Date(value);

    // Check if valid date
    if (isNaN(date.getTime())) return null;

    // Format based on type
    switch (format) {
      case 'datetime':
        return this.datePipe.transform(date, 'dd.MM.yyyy HH:mm');
      case 'short':
        return this.datePipe.transform(date, 'dd.MM.yy');
      case 'date':
      default:
        return this.datePipe.transform(date, 'dd.MM.yyyy');
    }
  }
}
