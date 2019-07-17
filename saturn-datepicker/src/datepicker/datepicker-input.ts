/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {DOWN_ARROW} from '@angular/cdk/keycodes';
import {
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {DateAdapter} from '../datetime/date-adapter';
import {MAT_DATE_FORMATS, MatDateFormats} from '../datetime/date-formats';
import {ThemePalette} from '@angular/material/core';
import {MatFormField} from '@angular/material/form-field';
import {MAT_INPUT_VALUE_ACCESSOR} from '@angular/material/input';
import {Subscription} from 'rxjs';
import {SatDatepicker} from './datepicker';
import {createMissingDateImplError} from './datepicker-errors';

const INFINITY_SYMBOL = '∞';

/** @docs-private */
export const MAT_DATEPICKER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SatDatepickerInput),
  multi: true
};

/** @docs-private */
export const MAT_DATEPICKER_VALIDATORS: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => SatDatepickerInput),
  multi: true
};

/**
 * Special interface to input and output dates interval.
 */
export interface SatDatepickerRangeValue<D> {
  begin: D | null | number;
  end: D | null | number;
}

/**
 * An event used for datepicker input and change events. We don't always have access to a native
 * input or change event because the event may have been triggered by the user clicking on the
 * calendar popup. For consistency, we always use SatDatepickerInputEvent instead.
 */
export class SatDatepickerInputEvent<D> {
  /** The new value for the target datepicker input. */
  value: SatDatepickerRangeValue<D | number> | D | null;

  constructor(
    /** Reference to the datepicker input component that emitted the event. */
    public target: SatDatepickerInput<D>,
    /** Reference to the native input element associated with the datepicker input. */
    public targetElement: HTMLElement) {
    this.value = this.target.value;
  }
}

/** Directive used to connect an input to a SatDatepicker. */
@Directive({
  selector: 'input[satDatepicker]',
  providers: [
    MAT_DATEPICKER_VALUE_ACCESSOR,
    MAT_DATEPICKER_VALIDATORS,
    {provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: SatDatepickerInput},
  ],
  host: {
    '[attr.aria-haspopup]': 'true',
    '[attr.aria-owns]': '(_datepicker?.opened && _datepicker.id) || null',
    '[attr.min]': 'min ? _dateAdapter.toIso8601(min) : null',
    '[attr.max]': 'max ? _dateAdapter.toIso8601(max) : null',
    '[disabled]': 'disabled',
    '(input)': '_onInput($event.target.value)',
    '(change)': '_onChange()',
    '(blur)': '_onBlur()',
    '(keydown)': '_onKeydown($event)',
  },
  exportAs: 'matDatepickerInput',
})
export class SatDatepickerInput<D> implements ControlValueAccessor, OnDestroy, Validator {
  /** The datepicker that this input is associated with. */
  @Input()
  set satDatepicker(value: SatDatepicker<D>) {
    if (!value) {
      return;
    }

    this._datepicker = value;
    this._datepicker._registerInput(this);
    this._datepickerSubscription.unsubscribe();

    this._datepickerSubscription = this._datepicker._selectedChanged.subscribe((selected: any) => {
      this.value = selected;
      this._cvaOnChange(selected);
      this._onTouched();
      this.dateInput.emit(new SatDatepickerInputEvent(this, this._elementRef.nativeElement));
      this.dateChange.emit(new SatDatepickerInputEvent(this, this._elementRef.nativeElement));
    });
  }

  /** Function that can be used to filter out dates within the datepicker. */
  @Input()
  set matDatepickerFilter(value: (date: D | null) => boolean) {
    this._dateFilter = value;
    this._validatorOnChange();
  }

  /** The value of the input. */
  @Input()
  get value() { return this._value; }
  set value(value) {
    if (value && value.hasOwnProperty('begin') && value.hasOwnProperty('end')) { // [Range, Since, Until] mode
      const rangeValue = <SatDatepickerRangeValue<D | number>>value;
      rangeValue.begin = this._dateAdapter.deserialize(rangeValue.begin);
      rangeValue.end = this._dateAdapter.deserialize(rangeValue.end);
      this._lastValueValid = !rangeValue.begin || !rangeValue.end ||
        this._dateAdapter.isValid(rangeValue.begin) && this._dateAdapter.isValid(rangeValue.end);
      rangeValue.begin = this._getValidDateOrNull(rangeValue.begin);
      rangeValue.end = this._getValidDateOrNull(rangeValue.end);
      let oldDate = <SatDatepickerRangeValue<D | number> | null>this.value;
      const mask1 = rangeValue.begin === Infinity
        ? INFINITY_SYMBOL : this._dateAdapter.format(rangeValue.begin, this._dateFormats.display.dateInput);
      const mask2 = rangeValue.end === Infinity
        ? INFINITY_SYMBOL : this._dateAdapter.format(rangeValue.end, this._dateFormats.display.dateInput);
      this._elementRef.nativeElement.value =
        rangeValue && rangeValue.begin && rangeValue.end ? `${mask1} - ${mask2}` : '';

      if (oldDate == null && rangeValue != null || oldDate != null && rangeValue == null ||
        !this._dateAdapter.sameDate((<SatDatepickerRangeValue<D | number>>oldDate).begin,
          rangeValue.begin) ||
        !this._dateAdapter.sameDate((<SatDatepickerRangeValue<D | number>>oldDate).end,
          rangeValue.end)) {
        if (
          rangeValue.end &&
          rangeValue.begin &&
          this._dateAdapter.compareDate(rangeValue.begin, rangeValue.end) > 0 &&
          rangeValue.begin !== Infinity &&
          rangeValue.end !== Infinity
        ) { // if begin > end
          value = null;
        }

        this._value = value;
        this._valueChange.emit(value);
      }
    } else { // [Date] mode
      value = this._dateAdapter.deserialize(value);
      this._lastValueValid = !value || this._dateAdapter.isValid(value);
      value = this._getValidDateOrNull(value);
      const oldDate = this.value;
      this._value = value;
      this._elementRef.nativeElement.value =
        value ? this._dateAdapter.format(value, this._dateFormats.display.dateInput) : '';
      if (
        (oldDate && oldDate.hasOwnProperty('begin') && oldDate.hasOwnProperty('end')) ||
        !this._dateAdapter.sameDate(oldDate, value)
        ) {
        this._valueChange.emit(value);
      }
    }
  }

  /** The minimum valid date. */
  @Input()
  get min(): D | number | null { return this._min; }
  set min(value: D | number | null) {
    this._min = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    this._validatorOnChange();
  }

  /** The maximum valid date. */
  @Input()
  get max(): D | number | null { return this._max; }
  set max(value: D | number | null) {
    this._max = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    this._validatorOnChange();
  }

  /** Whether the datepicker-input is disabled. */
  @Input()
  get disabled(): boolean { return !!this._disabled; }
  set disabled(value: boolean) {
    const newValue = coerceBooleanProperty(value);
    const element = this._elementRef.nativeElement;

    if (this._disabled !== newValue) {
      this._disabled = newValue;
      this._disabledChange.emit(newValue);
    }

    // We need to null check the `blur` method, because it's undefined during SSR.
    if (newValue && element.blur) {
      // Normally, native input elements automatically blur if they turn disabled. This behavior
      // is problematic, because it would mean that it triggers another change detection cycle,
      // which then causes a changed after checked error if the input element was focused before.
      element.blur();
    }
  }

  private _disabled: boolean;
  private _max: D | number | null;
  private _min: D | number | null;
  private _value;
  public _dateFilter: (date: SatDatepickerRangeValue<D | number> | D | number | null) => boolean;
  public _datepicker: SatDatepicker<D>;

  /** Whether the last value set on the input was valid. */
  private _lastValueValid = false;

  /** Emits when a `change` event is fired on this `<input>`. */
  @Output() readonly dateChange: EventEmitter<SatDatepickerInputEvent<D>> =
      new EventEmitter<SatDatepickerInputEvent<D>>();

  /** Emits when an `input` event is fired on this `<input>`. */
  @Output() readonly dateInput: EventEmitter<SatDatepickerInputEvent<D>> =
      new EventEmitter<SatDatepickerInputEvent<D>>();

  /** Emits when the value changes (either due to user input or programmatic change). */
  _valueChange = new EventEmitter<SatDatepickerRangeValue<D|number>|D|null>();

  /** Emits when the disabled state has changed */
  _disabledChange = new EventEmitter<boolean>();

  private _datepickerSubscription = Subscription.EMPTY;

  private _localeSubscription = Subscription.EMPTY;

  /** The combined form control validator for this input. */
  private _validator: ValidatorFn | null;

  private _cvaOnChange: (value: any) => void = () => {};

  private _validatorOnChange = () => {};

  _onTouched = () => {};

  /** The form control validator for whether the input parses. */
  private _parseValidator: ValidatorFn = (): ValidationErrors | null =>
    this._lastValueValid ?
      null : {'matDatepickerParse': {'text': this._elementRef.nativeElement.value}};

  /** The form control validator for the min date. */
  private _minValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this._datepicker.selectionMode === 'range' && control.value) {
      const beginDate =
          this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.begin));
      const endDate =
          this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.end));
      if (this.min) {
        if (beginDate && this._dateAdapter.compareDate(this.min, beginDate) > 0) {
          return {'matDatepickerMin': {'min': this.min, 'actual': beginDate}};
        }
        if (endDate && this._dateAdapter.compareDate(this.min, endDate) > 0) {
          return {'matDatepickerMin': {'min': this.min, 'actual': endDate}};
        }
      }
      return null;
    }
    const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
    return (!this.min || !controlValue ||
        this._dateAdapter.compareDate(this.min, controlValue) <= 0) ?
        null : {'matDatepickerMin': {'min': this.min, 'actual': controlValue}};
  }

  /** The form control validator for the max date. */
  private _maxValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this._datepicker.selectionMode === 'range' && control.value) {
      const beginDate =
          this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.begin));
      const endDate = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.end));
      if (this.max) {
        if (beginDate && this._dateAdapter.compareDate(this.max, beginDate) < 0 ) {
          return {'matDatepickerMax': {'max': this.max, 'actual': beginDate}};
        }
        if (endDate && this._dateAdapter.compareDate(this.max, endDate) < 0) {
          return {'matDatepickerMax': {'max': this.max, 'actual': endDate}};
        }
      }
      return null;
    }
    const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
    return (!this.max || !controlValue ||
        this._dateAdapter.compareDate(this.max, controlValue) >= 0) ?
        null : {'matDatepickerMax': {'max': this.max, 'actual': controlValue}};
  }

  /** The form control validator for the date filter. */
  private _filterValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this._datepicker.selectionMode === 'range' && control.value) {
      const beginDate =
          this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.begin));
      const endDate = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.end));
      return !this._dateFilter || !beginDate && !endDate ||
          this._dateFilter(beginDate) && this._dateFilter(endDate) ?
        null : {'matDatepickerFilter': true};
    }
    const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
    return !this._dateFilter || !controlValue || this._dateFilter(controlValue) ?
        null : {'matDatepickerFilter': true};
  }

  /** The form control validator for the date filter. */
  private _rangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this._datepicker.selectionMode === 'range' && control.value) {
      const beginDate =
          this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.begin));
      const endDate = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value.end));
      return !beginDate || !endDate || this._dateAdapter.compareDate(beginDate, endDate) <= 0 ?
        null : {'matDatepickerRange': true};
    }
    return null;
  }

  constructor(
      private _elementRef: ElementRef<HTMLInputElement>,
      @Optional() public _dateAdapter: DateAdapter<D>,
      @Optional() @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats,
      @Optional() private _formField: MatFormField) {
    if (!this._dateAdapter) {
      throw createMissingDateImplError('DateAdapter');
    }
    if (!this._dateFormats) {
      throw createMissingDateImplError('MAT_DATE_FORMATS');
    }

    this._validator = Validators.compose(
      [this._parseValidator, this._minValidator, this._maxValidator,
        this._filterValidator, this._rangeValidator]);

    // Update the displayed date when the locale changes.
    this._localeSubscription = _dateAdapter.localeChanges.subscribe(() => {
      this.value = this.value;
    });
  }

  ngOnDestroy() {
    this._datepickerSubscription.unsubscribe();
    this._localeSubscription.unsubscribe();
    this._valueChange.complete();
    this._disabledChange.complete();
  }

  /** @docs-private */
  registerOnValidatorChange(fn: () => void): void {
    this._validatorOnChange = fn;
  }

  /** @docs-private */
  validate(c: AbstractControl): ValidationErrors | null {
    return this._validator ? this._validator(c) : null;
  }

  /**
   * @deprecated
   * @breaking-change 8.0.0 Use `getConnectedOverlayOrigin` instead
   */
  getPopupConnectionElementRef(): ElementRef {
    return this.getConnectedOverlayOrigin();
  }

  /**
   * Gets the element that the datepicker popup should be connected to.
   * @return The element to connect the popup to.
   */
  getConnectedOverlayOrigin(): ElementRef {
    return this._formField ? this._formField.getConnectedOverlayOrigin() : this._elementRef;
  }

  // Implemented as part of ControlValueAccessor
  writeValue(value: SatDatepickerRangeValue<D> | D): void {
    this.value = value;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnChange(fn: (value: any) => void): void {
    this._cvaOnChange = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  // Implemented as part of ControlValueAccessor.
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  _onKeydown(event: KeyboardEvent) {
    const isAltDownArrow = event.altKey && event.keyCode === DOWN_ARROW;

    if (this._datepicker && isAltDownArrow && !this._elementRef.nativeElement.readOnly) {
      this._datepicker.open();
      event.preventDefault();
    }
  }

  _onInput(value: string) {
    let date = null;
    if (['range', 'since', 'until'].includes(this._datepicker.selectionMode)) {
      const parts = value.split('-');
      if (parts.length > 1) {
          const position = Math.floor(parts.length / 2);
          const beginDateString = parts.slice(0, position).join('-');
          const endDateString = parts.slice(position).join('-');
          let beginDate = this._dateAdapter.parse(beginDateString,
              this._dateFormats.parse.dateInput);
          let endDate = this._dateAdapter.parse(endDateString, this._dateFormats.parse.dateInput);
          this._lastValueValid = !beginDate || !endDate || this._dateAdapter.isValid(beginDate) &&
                                                           this._dateAdapter.isValid(endDate);
          beginDate = this._getValidDateOrNull(beginDate);
          endDate = this._getValidDateOrNull(endDate);
          if (beginDate && endDate) {
            date = <SatDatepickerRangeValue<D>>{begin: beginDate, end: endDate};
          }
      }
    } else {
      date = this._dateAdapter.parse(value, this._dateFormats.parse.dateInput);
      this._lastValueValid = !date || this._dateAdapter.isValid(date);
      date = this._getValidDateOrNull(date);
    }
    this._value = date;
    this._cvaOnChange(date);
    this._valueChange.emit(date);
    this.dateInput.emit(new SatDatepickerInputEvent(this, this._elementRef.nativeElement));
  }

  _onChange() {
    this.dateChange.emit(new SatDatepickerInputEvent(this, this._elementRef.nativeElement));
  }

  /** Returns the palette used by the input's form field, if any. */
  _getThemePalette(): ThemePalette {
    return this._formField ? this._formField.color : undefined;
  }

  /** Handles blur events on the input. */
  _onBlur() {
    // Reformat the input only if we have a valid value.
    if (this.value) {
      this._formatValue(this.value);
    }

    this._onTouched();
  }

  /** Formats a value and sets it on the input element. */
  private _formatValue(value) {
    if (value && value.hasOwnProperty('begin') && value.hasOwnProperty('end')) {
      const mask1 = value.begin === Infinity
        ? INFINITY_SYMBOL : this._dateAdapter.format(value.begin, this._dateFormats.display.dateInput);
      const mask2 = value.end === Infinity
        ? INFINITY_SYMBOL : this._dateAdapter.format(value.end, this._dateFormats.display.dateInput);

      value = value as SatDatepickerRangeValue<D>;
        this._elementRef.nativeElement.value =
            value && value.begin && value.end ? mask1 + ' - ' + mask2 : ''
    } else {
      value = value as D | null;
      this._elementRef.nativeElement.value =
        value ? this._dateAdapter.format(value, this._dateFormats.display.dateInput) : '';
    }
  }

  /**
   * @param obj The object to check.
   * @returns The given object if it is both a date instance and valid, otherwise null.
   */
  private _getValidDateOrNull(obj): D | null | number {
    return (obj === Infinity || (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj))) ? obj : null;
  }
}
