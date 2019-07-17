/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {Inject, Injectable, Optional} from '@angular/core';
import {DateAdapter, MAT_DATE_LOCALE} from './date-adapter';

// TODO(mmalerba): Remove when we no longer support safari 9.
/** Whether the browser supports the Intl API. */
let SUPPORTS_INTL_API: boolean;

// We need a try/catch around the reference to `Intl`, because accessing it in some cases can
// cause IE to throw. These cases are tied to particular versions of Windows and can happen if
// the consumer is providing a polyfilled `Map`. See:
// https://github.com/Microsoft/ChakraCore/issues/3189
// https://github.com/angular/material2/issues/15687
try {
  SUPPORTS_INTL_API = typeof Intl != 'undefined';
} catch {
  SUPPORTS_INTL_API = false;
}

/** The default month names to use if Intl API is not available. */
const DEFAULT_MONTH_NAMES = {
  'long': [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'
  ],
  'short': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  'narrow': ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
};


/** The default date names to use if Intl API is not available. */
const DEFAULT_DATE_NAMES = range(31, i => String(i + 1));


/** The default day of the week names to use if Intl API is not available. */
const DEFAULT_DAY_OF_WEEK_NAMES = {
  'long': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'short': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'narrow': ['S', 'M', 'T', 'W', 'T', 'F', 'S']
};

/** First day of week according locale.
 * Taken form moment.js source code https://github.com/moment/moment/tree/develop/src/locale
 */
const FIRST_DAY_OF_WEEK = {
  af:1, ar:6, 'ar-ly':6, 'ar-ma':6, 'ar-tn':1, az:1, be:1, bg:1, bm:1, br:1, bs:1, ca:1, cs:1, cv:1,
  cy:1, da:1, de:1, 'de-at':1, 'de-ch':1, el:1, 'en-au':1, 'en-gb':1, 'en-ie':1, 'en-nz':1, eo:1,
  es:1, 'es-do':1, et:1, eu:1, fa:6, fi:1, fo:1, fr:1, 'fr-ch':1, fy:1, gd:1, gl:1, 'gom-latn':1,
  hr:1, hu:1, 'hy-am':1, id:1, is:1, it:1, jv:1, ka:1, kk:1, km:1, ky:1, lb:1, lt:1, lv:1, me:1,
  mi:1, mk:1, ms:1, 'ms-my':1, mt:1, my:1, nb:1, nl:1, 'nl-be':1, nn:1, pl:1, pt:1, 'pt-BR': 0, ro:1, ru:1,
  sd:1, se:1, sk:1, sl:1, sq:1, sr:1, 'sr-cyrl':1, ss:1, sv:1, sw:1, 'tet':1, tg:1, 'tl-ph':1,
  'tlh':1, tr:1, 'tzl':1, 'tzm':6, 'tzm-latn':6, 'ug-cn':1, uk:1, ur:1, uz:1, 'uz-latn':1, vi:1,
  'x-pseudo':1, yo:1, 'zh-cn':1,
};

/**
 * Matches strings that have the form of a valid RFC 3339 string
 * (https://tools.ietf.org/html/rfc3339). Note that the string may not actually be a valid date
 * because the regex will match strings an with out of bounds month, date, etc.
 */
const ISO_8601_REGEX =
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/;


/** Creates an array and fills it with values. */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
  const valuesArray = Array(length);
  for (let i = 0; i < length; i++) {
    valuesArray[i] = valueFunction(i);
  }
  return valuesArray;
}

/** Adapts the native JS Date for use with cdk-based components that work with dates. */
@Injectable()
export class NativeDateAdapter extends DateAdapter<Date> {
  /** Whether to clamp the date between 1 and 9999 to avoid IE and Edge errors. */
  private readonly _clampDate: boolean;

  /**
   * Whether to use `timeZone: 'utc'` with `Intl.DateTimeFormat` when formatting dates.
   * Without this `Intl.DateTimeFormat` sometimes chooses the wrong timeZone, which can throw off
   * the result. (e.g. in the en-US locale `new Date(1800, 7, 14).toLocaleDateString()`
   * will produce `'8/13/1800'`.
   *
   * TODO(mmalerba): drop this variable. It's not being used in the code right now. We're now
   * getting the string representation of a Date object from it's utc representation. We're keeping
   * it here for sometime, just for precaution, in case we decide to revert some of these changes
   * though.
   */
  useUtcForDisplay: boolean = true;

  constructor(@Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string, platform: Platform) {
    super();
    super.setLocale(matDateLocale);

    // IE does its own time zone correction, so we disable this on IE.
    this.useUtcForDisplay = !platform.TRIDENT;
    this._clampDate = platform.TRIDENT || platform.EDGE;
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, {month: style, timeZone: 'utc'});
      return range(12, i =>
          this._stripDirectionalityCharacters(this._format(dtf, new Date(2017, i, 1))));
    }
    return DEFAULT_MONTH_NAMES[style];
  }

  getDateNames(): string[] {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, {day: 'numeric', timeZone: 'utc'});
      return range(31, i => this._stripDirectionalityCharacters(
          this._format(dtf, new Date(2017, 0, i + 1))));
    }
    return DEFAULT_DATE_NAMES;
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, {weekday: style, timeZone: 'utc'});
      return range(7, i => this._stripDirectionalityCharacters(
          this._format(dtf, new Date(2017, 0, i + 1))));
    }
    return DEFAULT_DAY_OF_WEEK_NAMES[style];
  }

  getYearName(date: Date): string {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat(this.locale, {year: 'numeric', timeZone: 'utc'});
      return this._stripDirectionalityCharacters(this._format(dtf, date));
    }
    return String(this.getYear(date));
  }

  getFirstDayOfWeek(): number {
    // We can't tell using native JS Date what the first day of the week is.
    // Sometimes people use excess language definition, e.g. ru-RU,
    // so we use fallback to two-letter language code
    const locale = this.locale.toLowerCase();
    return FIRST_DAY_OF_WEEK[locale] || FIRST_DAY_OF_WEEK[locale.substr(0, 2)] || 0;
  }

  getNumDaysInMonth(date: Date): number {
    return this.getDate(this._createDateWithOverflow(
        this.getYear(date), this.getMonth(date) + 1, 0));
  }

  clone(date: Date): Date {
    return new Date(date.getTime());
  }

  createDate(year: number, month: number, date: number): Date {
    // Check for invalid month and date (except upper bound on date which we have to check after
    // creating the Date).
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }

    let result = this._createDateWithOverflow(year, month, date);
    // Check that the date wasn't above the upper bound for the month, causing the month to overflow
    if (result.getMonth() != month) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`);
    }

    return result;
  }

  today(): Date {
    return new Date();
  }

  parse(value: any): Date | null {
    // We have no way using the native JS Date to set the parse format or locale, so we ignore these
    // parameters.
    if (typeof value == 'number') {
      return new Date(value);
    }
    return value ? new Date(Date.parse(value)) : null;
  }

  format(date: Date, displayFormat: Object): string {
    if (!this.isValid(date)) {
      throw Error('NativeDateAdapter: Cannot format invalid date.');
    }

    if (SUPPORTS_INTL_API) {
      // On IE and Edge the i18n API will throw a hard error that can crash the entire app
      // if we attempt to format a date whose year is less than 1 or greater than 9999.
      if (this._clampDate && (date.getFullYear() < 1 || date.getFullYear() > 9999)) {
        date = this.clone(date);
        date.setFullYear(Math.max(1, Math.min(9999, date.getFullYear())));
      }

      displayFormat = {...displayFormat, timeZone: 'utc'};

      const dtf = new Intl.DateTimeFormat(this.locale, displayFormat);
      return this._stripDirectionalityCharacters(this._format(dtf, date));
    }
    return this._stripDirectionalityCharacters(date.toDateString());
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    let newDate = this._createDateWithOverflow(
        this.getYear(date), this.getMonth(date) + months, this.getDate(date));

    // It's possible to wind up in the wrong month if the original month has more days than the new
    // month. In this case we want to go to the last day of the desired month.
    // Note: the additional + 12 % 12 ensures we end up with a positive number, since JS % doesn't
    // guarantee this.
    if (this.getMonth(newDate) != ((this.getMonth(date) + months) % 12 + 12) % 12) {
      newDate = this._createDateWithOverflow(this.getYear(newDate), this.getMonth(newDate), 0);
    }

    return newDate;
  }

  addCalendarDays(date: Date, days: number): Date {
    return this._createDateWithOverflow(
        this.getYear(date), this.getMonth(date), this.getDate(date) + days);
  }

  toIso8601(date: Date): string {
    return [
      date.getUTCFullYear(),
      this._2digit(date.getUTCMonth() + 1),
      this._2digit(date.getUTCDate())
    ].join('-');
  }

  /**
   * Returns the given value if given a valid Date or null. Deserializes valid ISO 8601 strings
   * (https://www.ietf.org/rfc/rfc3339.txt) into valid Dates and empty string into null. Returns an
   * invalid date for all other values.
   */
  deserialize(value: any): Date | null {
    if (typeof value === 'string') {
      if (!value) {
        return null;
      }
      // The `Date` constructor accepts formats other than ISO 8601, so we need to make sure the
      // string is the right format first.
      if (ISO_8601_REGEX.test(value)) {
        let date = new Date(value);
        if (this.isValid(date)) {
          return date;
        }
      }
    }
    return super.deserialize(value);
  }

  isDateInstance(obj: any) {
    return obj instanceof Date;
  }

  isValid(date: Date | number) {
    return date === Infinity ? true : !isNaN(date.getTime());
  }

  invalid(): Date {
    return new Date(NaN);
  }

  /** Creates a date but allows the month and date to overflow. */
  private _createDateWithOverflow(year: number, month: number, date: number) {
    const result = new Date(year, month, date);

    // We need to correct for the fact that JS native Date treats years in range [0, 99] as
    // abbreviations for 19xx.
    if (year >= 0 && year < 100) {
      result.setFullYear(this.getYear(result) - 1900);
    }
    return result;
  }

  /**
   * Pads a number to make it two digits.
   * @param n The number to pad.
   * @returns The padded number.
   */
  private _2digit(n: number) {
    return ('00' + n).slice(-2);
  }

  /**
   * Strip out unicode LTR and RTL characters. Edge and IE insert these into formatted dates while
   * other browsers do not. We remove them to make output consistent and because they interfere with
   * date parsing.
   * @param str The string to strip direction characters from.
   * @returns The stripped string.
   */
  private _stripDirectionalityCharacters(str: string) {
    return str.replace(/[\u200e\u200f]/g, '');
  }

  /**
   * When converting Date object to string, javascript built-in functions may return wrong
   * results because it applies its internal DST rules. The DST rules around the world change
   * very frequently, and the current valid rule is not always valid in previous years though.
   * We work around this problem building a new Date object which has its internal UTC
   * representation with the local date and time.
   * @param dtf Intl.DateTimeFormat object, containg the desired string format. It must have
   *    timeZone set to 'utc' to work fine.
   * @param date Date from which we want to get the string representation according to dtf
   * @returns A Date object with its UTC representation based on the passed in date info
   */
  private _format(dtf: Intl.DateTimeFormat, date: Date) {
    const d = new Date(Date.UTC(
        date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),
        date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
    return dtf.format(d);
  }
}
