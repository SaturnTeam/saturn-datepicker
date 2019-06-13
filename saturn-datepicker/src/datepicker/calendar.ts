/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { ComponentPortal, ComponentType, Portal } from '@angular/cdk/portal';
import {
  AfterContentInit,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { createMissingDateImplError } from './datepicker-errors';
import { SatDatepickerIntl } from './datepicker-intl';
import { SatMonthView } from './month-view';
import { SatMultiYearView, yearsPerPage } from './multi-year-view';
import { SatYearView } from './year-view';
import { SatCalendarCellCssClasses } from './calendar-body';

import { SatDatepickerRangeValue } from './datepicker-input';
import { DateAdapter } from '../datetime/date-adapter';
import { MAT_DATE_FORMATS, MatDateFormats } from '../datetime/date-formats';

/**
 * Possible views for the calendar.
 * @docs-private
 */
export type SatCalendarView = 'month' | 'year' | 'multi-year';

/** Default header for SatCalendar */
@Component({
  moduleId: module.id,
  selector: 'sat-calendar-header',
  templateUrl: 'calendar-header.html',
  exportAs: 'matCalendarHeader',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SatCalendarHeader<D> {
  constructor(private _intl: SatDatepickerIntl,
    @Inject(forwardRef(() => SatCalendar)) public calendar: SatCalendar<D>,
    @Optional() private _dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats,
    changeDetectorRef: ChangeDetectorRef) {

    this.calendar.stateChanges.subscribe(() => changeDetectorRef.markForCheck());
  }

  /** The label for the current calendar view. */
  get periodButtonText(): string {
    if (this.calendar.currentView == 'month') {
      return this._dateAdapter
        .format(this.calendar.activeDate, this._dateFormats.display.monthYearLabel)
        .toLocaleUpperCase();
    }
    if (this.calendar.currentView == 'year') {
      return this._dateAdapter.getYearName(this.calendar.activeDate);
    }
    const activeYear = this._dateAdapter.getYear(this.calendar.activeDate);
    const firstYearInView = this._dateAdapter.getYearName(
      this._dateAdapter.createDate(activeYear - activeYear % 24, 0, 1));
    const lastYearInView = this._dateAdapter.getYearName(
      this._dateAdapter.createDate(activeYear + yearsPerPage - 1 - activeYear % 24, 0, 1));
    return `${firstYearInView} \u2013 ${lastYearInView}`;
  }

  get periodButtonLabel(): string {
    return this.calendar.currentView == 'month' ?
      this._intl.switchToMultiYearViewLabel : this._intl.switchToMonthViewLabel;
  }

  /** The label for the the previous button. */
  get prevButtonLabel(): string {
    return {
      'month': this._intl.prevMonthLabel,
      'year': this._intl.prevYearLabel,
      'multi-year': this._intl.prevMultiYearLabel
    }[this.calendar.currentView];
  }

  /** The label for the the next button. */
  get nextButtonLabel(): string {
    return {
      'month': this._intl.nextMonthLabel,
      'year': this._intl.nextYearLabel,
      'multi-year': this._intl.nextMultiYearLabel
    }[this.calendar.currentView];
  }

  /** Handles user clicks on the period label.
   * Option`calendar.orderPeriodLabel` sort the label period views.
   * - Default [multi-year]: multi-year then back to month
   * - Month [month]: month > year > multi-year
   */
  currentPeriodClicked(): void {
    const mouthFirstOrder: SatCalendarView[] = ['month', 'year', 'multi-year'];
    const defaultOrder: SatCalendarView[] = ['month', 'multi-year', 'month'];
    const orderPeriod = this.calendar.orderPeriodLabel === 'month' ? mouthFirstOrder : defaultOrder;
    switch (this.calendar.currentView) {
      case 'month':
        this.calendar.currentView = orderPeriod[1];
        break;
      case 'year':
        this.calendar.currentView = orderPeriod[2]
        break;
      default:
        this.calendar.currentView = orderPeriod[0]
        break;
    }
  }

  /** Handles user clicks on the previous button. */
  previousClicked(): void {
    this.calendar.activeDate = this.calendar.currentView == 'month' ?
      this._dateAdapter.addCalendarMonths(this.calendar.activeDate, -1) :
      this._dateAdapter.addCalendarYears(
        this.calendar.activeDate, this.calendar.currentView == 'year' ? -1 : -yearsPerPage
      );
  }

  /** Handles user clicks on the next button. */
  nextClicked(): void {
    this.calendar.activeDate = this.calendar.currentView == 'month' ?
      this._dateAdapter.addCalendarMonths(this.calendar.activeDate, 1) :
      this._dateAdapter.addCalendarYears(
        this.calendar.activeDate,
        this.calendar.currentView == 'year' ? 1 : yearsPerPage
      );
  }

  /** Whether the previous period button is enabled. */
  previousEnabled(): boolean {
    if (!this.calendar.minDate) {
      return true;
    }
    return !this.calendar.minDate ||
      !this._isSameView(this.calendar.activeDate, this.calendar.minDate);
  }

  /** Whether the next period button is enabled. */
  nextEnabled(): boolean {
    return !this.calendar.maxDate ||
      !this._isSameView(this.calendar.activeDate, this.calendar.maxDate);
  }

  /** Whether the two dates represent the same view in the current view mode (month or year). */
  private _isSameView(date1: D, date2: D): boolean {
    if (this.calendar.currentView == 'month') {
      return this._dateAdapter.getYear(date1) == this._dateAdapter.getYear(date2) &&
        this._dateAdapter.getMonth(date1) == this._dateAdapter.getMonth(date2);
    }
    if (this.calendar.currentView == 'year') {
      return this._dateAdapter.getYear(date1) == this._dateAdapter.getYear(date2);
    }
    // Otherwise we are in 'multi-year' view.
    return Math.floor(this._dateAdapter.getYear(date1) / yearsPerPage) ==
      Math.floor(this._dateAdapter.getYear(date2) / yearsPerPage);
  }
}

/** Default presets component for SatCalendar */
@Component({
  moduleId: module.id,
  selector: 'sat-calendar-presets',
  templateUrl: 'calendar-presets.html',
  exportAs: 'matCalendarPresets',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SatCalendarPresets<D> { }

/** Default footer for SatCalendar */
@Component({
  moduleId: module.id,
  selector: 'sat-calendar-footer',
  templateUrl: 'calendar-footer.html',
  exportAs: 'matCalendarFooter',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SatCalendarFooter<D> {
}

/**
 * A calendar that is used as part of the datepicker.
 * @docs-private
 */
@Component({
  moduleId: module.id,
  selector: 'sat-calendar',
  templateUrl: 'calendar.html',
  styleUrls: ['calendar.css'],
  host: {
    'class': 'mat-calendar',
  },
  exportAs: 'matCalendar',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SatCalendar<D> implements AfterContentInit, AfterViewChecked, OnDestroy, OnChanges {

  /** Beginning of date range. */
  @Input()
  get beginDate(): D | null { return this._beginDate; }
  set beginDate(value: D | null) {
    this._beginDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _beginDate: D | null;

  /** Date range end. */
  @Input()
  get endDate(): D | null { return this._endDate; }
  set endDate(value: D | null) {
    this._endDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _endDate: D | null;

  /** Whenever datepicker is for selecting range of dates. */
  @Input() rangeMode = false;

  /** Enables datepicker closing after selection */
  @Input() closeAfterSelection = true;

  /** Emits when new pair of dates selected. */
  @Output() dateRangesChange = new EventEmitter<SatDatepickerRangeValue<D>>();


  /** Whenever user already selected start of dates interval. */
  beginDateSelected: D | boolean = false;

  /** Emits when a new start date has been selected in range mode. */
  @Output() beginDateSelectedChange = new EventEmitter<D>();

  /** An input indicating the type of the header component, if set. */
  @Input() headerComponent: ComponentType<any>;

  /** A portal containing the header component type for this calendar. */
  _calendarHeaderPortal: Portal<any>;

  /** An input indicating the type of the footer component, if set. */
  @Input() footerComponent: ComponentType<any>;

  /** A portal containing the footer component type for this calendar. */
  _calendarFooterPortal: Portal<any>;

  /** An input indicating the type of the presets component, if set. */
  @Input() presetsComponent: ComponentType<any>;

  _calendarPresetsPortal: Portal<any>;

  private _intlChanges: Subscription;

  /**
   * Used for scheduling that focus should be moved to the active cell on the next tick.
   * We need to schedule it, rather than do it immediately, because we have to wait
   * for Angular to re-evaluate the view children.
   */
  private _moveFocusOnNextTick = false;

  /** A date representing the period (month or year) to start the calendar in. */
  @Input()
  get startAt(): D | null { return this._startAt; }
  set startAt(value: D | null) {
    this._startAt = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _startAt: D | null;

  /** Whether the calendar should be started in month or year view. */
  @Input() startView: SatCalendarView = 'month';

  /** The currently selected date. */
  @Input()
  get selected(): D | null { return this._selected; }
  set selected(value: D | null) {
    this._selected = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _selected: D | null;

  /** The minimum selectable date. */
  @Input()
  get minDate(): D | null { return this._minDate; }
  set minDate(value: D | null) {
    this._minDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _minDate: D | null;

  /** The maximum selectable date. */
  @Input()
  get maxDate(): D | null { return this._maxDate; }
  set maxDate(value: D | null) {
    this._maxDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _maxDate: D | null;

  /** Function used to filter which dates are selectable. */
  @Input() dateFilter: (date: D) => boolean;

  /** Function that can be used to add custom CSS classes to dates. */
  @Input() dateClass: (date: D) => SatCalendarCellCssClasses;

  /** Order the views when clicking on period label button */
  @Input() orderPeriodLabel: 'multi-year' | 'month' = 'multi-year';

  /** Emits when the currently selected date changes. */
  @Output() readonly selectedChange: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits the year chosen in multiyear view.
   * This doesn't imply a change on the selected date.
   */
  @Output() readonly yearSelected: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits the month chosen in year view.
   * This doesn't imply a change on the selected date.
   */
  @Output() readonly monthSelected: EventEmitter<D> = new EventEmitter<D>();

  /** Emits when any date is selected. */
  @Output() readonly _userSelection: EventEmitter<void> = new EventEmitter<void>();

  /** Reference to the current month view component. */
  @ViewChild(SatMonthView) monthView: SatMonthView<D>;

  /** Reference to the current year view component. */
  @ViewChild(SatYearView) yearView: SatYearView<D>;

  /** Reference to the current multi-year view component. */
  @ViewChild(SatMultiYearView) multiYearView: SatMultiYearView<D>;

  /**
   * The current active date. This determines which time period is shown and which date is
   * highlighted when using keyboard navigation.
   */
  get activeDate(): D { return this._clampedActiveDate; }
  set activeDate(value: D) {
    this._clampedActiveDate = this._dateAdapter.clampDate(value, this.minDate, this.maxDate);
    this.stateChanges.next();
    this._changeDetectorRef.markForCheck();
  }
  private _clampedActiveDate: D;

  /** Whether the calendar is in month view. */
  get currentView(): SatCalendarView { return this._currentView; }
  set currentView(value: SatCalendarView) {
    this._currentView = value;
    this._moveFocusOnNextTick = true;
    this._changeDetectorRef.markForCheck();
  }
  private _currentView: SatCalendarView;

  /**
   * Emits whenever there is a state change that the header may need to respond to.
   */
  stateChanges = new Subject<void>();

  constructor(_intl: SatDatepickerIntl,
    @Optional() private _dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats,
    private _changeDetectorRef: ChangeDetectorRef) {

    if (!this._dateAdapter) {
      throw createMissingDateImplError('DateAdapter');
    }

    if (!this._dateFormats) {
      throw createMissingDateImplError('MAT_DATE_FORMATS');
    }

    this._intlChanges = _intl.changes.subscribe(() => {
      _changeDetectorRef.markForCheck();
      this.stateChanges.next();
    });
  }

  ngAfterContentInit() {
    this._calendarHeaderPortal = new ComponentPortal(this.headerComponent || SatCalendarHeader);
    this._calendarFooterPortal = new ComponentPortal(this.footerComponent || SatCalendarFooter);
    this._calendarPresetsPortal = new ComponentPortal(this.presetsComponent || SatCalendarPresets);
    this.activeDate = this.startAt || this._dateAdapter.today();

    // Assign to the private property since we don't want to move focus on init.
    this._currentView = this.startView;
  }

  ngAfterViewChecked() {
    if (this._moveFocusOnNextTick) {
      this._moveFocusOnNextTick = false;
      this.focusActiveCell();
    }
  }

  ngOnDestroy() {
    this._intlChanges.unsubscribe();
    this.stateChanges.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    const change =
      changes['minDate'] || changes['maxDate'] || changes['dateFilter'];

    if (change && !change.firstChange) {
      const view = this._getCurrentViewComponent();

      if (view) {
        // We need to `detectChanges` manually here, because the `minDate`, `maxDate` etc. are
        // passed down to the view via data bindings which won't be up-to-date when we call `_init`.
        this._changeDetectorRef.detectChanges();
        view._init();
      }
    }

    this.stateChanges.next();
  }

  focusActiveCell() {
    this._getCurrentViewComponent()._focusActiveCell();
  }

  /** Updates today's date after an update of the active date */
  updateTodaysDate() {
    let view = this.currentView == 'month' ? this.monthView :
      (this.currentView == 'year' ? this.yearView : this.multiYearView);

    view.ngAfterContentInit();
  }

  /** Handles date selection in the month view. */
  _dateSelected(date: D): void {
    if (this.rangeMode) {
      if (!this.beginDateSelected) {
        this.beginDateSelected = date;
        this.beginDate = date;
        this.endDate = date;
        this.beginDateSelectedChange.emit(date);
      } else {
        this.beginDateSelected = false;
        if (this._dateAdapter.compareDate(<D>this.beginDate, date) <= 0) {
          this.endDate = date;
        } else {
          this.endDate = this.beginDate;
          this.beginDate = date;
        }
        this.dateRangesChange.emit({ begin: <D>this.beginDate, end: this.endDate });
      }
    } else if (!this._dateAdapter.sameDate(date, this.selected)) {
      this.selectedChange.emit(date);
    }
  }

  /** Handles year selection in the multiyear view. */
  _yearSelectedInMultiYearView(normalizedYear: D) {
    this.yearSelected.emit(normalizedYear);
  }

  /** Handles month selection in the year view. */
  _monthSelectedInYearView(normalizedMonth: D) {
    this.monthSelected.emit(normalizedMonth);
  }

  _userSelected(): void {
    this._userSelection.emit();
  }

  /** Handles year/month selection in the multi-year/year views. */
  _goToDateInView(date: D, view: 'month' | 'year' | 'multi-year'): void {
    this.activeDate = date;
    this.currentView = view;
  }

  /**
   * @param obj The object to check.
   * @returns The given object if it is both a date instance and valid, otherwise null.
   */
  private _getValidDateOrNull(obj: any): D | null {
    return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
  }

  /** Returns the component instance that corresponds to the current calendar view. */
  private _getCurrentViewComponent() {
    return this.monthView || this.yearView || this.multiYearView;
  }
}
