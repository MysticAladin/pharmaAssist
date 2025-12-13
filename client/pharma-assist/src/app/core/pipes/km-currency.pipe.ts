import { Pipe, PipeTransform } from '@angular/core';
import { formatNumber } from '@angular/common';

/**
 * Custom currency pipe for Bosnian Convertible Mark (KM)
 * Formats numbers as "X.XX KM" instead of "BAM X.XX"
 *
 * Usage:
 *   {{ amount | kmCurrency }}
 *   {{ amount | kmCurrency:'1.0-0' }}
 *   {{ amount | kmCurrency:'1.2-2':true }}  // with prefix symbol
 */
@Pipe({
  name: 'kmCurrency',
  standalone: true
})
export class KmCurrencyPipe implements PipeTransform {

  transform(
    value: number | string | null | undefined,
    digitsInfo: string = '1.2-2',
    showSymbolPrefix: boolean = false
  ): string {
    if (value === null || value === undefined || value === '') {
      return showSymbolPrefix ? '0.00 KM' : '0.00 KM';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return showSymbolPrefix ? '0.00 KM' : '0.00 KM';
    }

    try {
      const formatted = formatNumber(numValue, 'en-US', digitsInfo);
      return `${formatted} KM`;
    } catch {
      return `${numValue.toFixed(2)} KM`;
    }
  }
}
