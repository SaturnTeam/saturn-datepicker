/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {ESCAPE, UP_ARROW} from '@angular/cdk/keycodes';
import {
  Overlay,
  OverlayConfig,
  OverlayRef,
  PositionStrategy,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import {ComponentPortal, ComponentType} from '@angular/cdk/portal';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {
  CanColor,
  CanColorCtor,
  mixinColor,
  ThemePalette,
} from '@angular/material/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {merge, Subject, Subscription} from 'rxjs';
import {filter, take} from 'rxjs/operators';
import {SatCalendar, SelectionModeType} from './calendar';
import {matDatepickerAnimations} from './datepicker-animations';
import {createMissingDateImplError} from './datepicker-errors';
import {SatCalendarCellCssClasses} from './calendar-body';
import {SatDatepickerInput, SatDatepickerRangeValue} from './datepicker-input';
import {DateAdapter} from '../datetime/date-adapter';

/** Used to generate a unique ID for each datepicker instance. */
let datepickerUid = 0;

/** Injection token that determines the scroll handling while the calendar is open. */
export const MAT_DATEPICKER_SCROLL_STRATEGY =
    new InjectionToken<() => ScrollStrategy>('sat-datepicker-scroll-strategy');

/** @docs-private */
export function MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

/** @docs-private */
export const MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER = {
  provide: MAT_DATEPICKER_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY,
};

// Boilerplate for applying mixins to SatDatepickerContent.
/** @docs-private */
export class SatDatepickerContentBase {
  constructor(public _elementRef: ElementRef) { }
}
export const _SatDatepickerContentMixinBase: CanColorCtor & typeof SatDatepickerContentBase =
    mixinColor(SatDatepickerContentBase);

/**
 * Component used as the content for the datepicker dialog and popup. We use this instead of using
 * SatCalendar directly as the content so we can control the initial focus. This also gives us a
 * place to put additional features of the popup that are not part of the calendar itself in the
 * future. (e.g. confirmation buttons).
 * @docs-private
 */
@Component({
  moduleId: module.id,
  selector: 'sat-datepicker-content',
  templateUrl: 'datepicker-content.html',
  styleUrls: ['datepicker-content.css'],
  host: {
    'class': 'mat-datepicker-content',
    '[@transformPanel]': '"enter"',
    '[class.mat-datepicker-content-touch]': 'datepicker.touchUi',
  },
  animations: [
    matDatepickerAnimations.transformPanel,
    matDatepickerAnimations.fadeInCalendar,
  ],
  exportAs: 'matDatepickerContent',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['color'],
})
export class SatDatepickerContent<D> extends _SatDatepickerContentMixinBase
  implements AfterViewInit, CanColor {

  /** Reference to the internal calendar component. */
  @ViewChild(SatCalendar) _calendar: SatCalendar<D>;

  /** Reference to the datepicker that created the overlay. */
  datepicker: SatDatepicker<D>;

  /** Whether the datepicker is above or below the input. */
  _isAbove: boolean;

  constructor(elementRef: ElementRef) {
    super(elementRef);
  }

  ngAfterViewInit() {
    this._calendar.focusActiveCell();
  }

  close() {
    if (this.datepicker.closeAfterSelection) {
      this.datepicker.close();
    }
  }
}


// TODO(mmalerba): We use a component instead of a directive here so the user can use implicit
// template reference variables (e.g. #d vs #d="matDatepicker"). We can change this to a directive
// if angular adds support for `exportAs: '$implicit'` on directives.
/** Component responsible for managing the datepicker popup/dialog. */
@Component({
  moduleId: module.id,
  selector: 'sat-datepicker',
  template: '',
  exportAs: 'matDatepicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SatDatepicker<D> implements OnDestroy, CanColor {

  /** Selection mode */
  get selectionMode(): SelectionModeType {
    return this._selectionMode;
  }
  set selectionMode(mode: SelectionModeType) {
    if (this._selectionMode !== mode) {
      this._selectionMode = mode;
    }
  }
  _selectionMode: SelectionModeType;

  /** If initial value is empty this property determines the initial selection mode,
      otherwise it will be determined by the initial value */
  @Input() initialSelectionMode = '';

  /** Possible selection modes, in the order that they should appear */
  @Input()
  set selectionModes(modes) {
    this._selectionModes = modes.filter((sm) => ['date', 'range', 'since', 'until'].includes(sm));
  }
  get selectionModes() {
    return this._selectionModes;
  }
  private _selectionModes;

  /** Start of dates interval. */
  @Input()
  get beginDate() {
    return this._beginDate;
  }
  set beginDate(value) {
    this._validSelected = null;
    this._beginDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  _beginDate;

  /** End of dates interval. */
  @Input()
  get endDate() {
    return this._endDate;
  }
  set endDate(value) {
    this._validSelected = null;
    this._endDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  _endDate;

  private _scrollStrategy: () => ScrollStrategy;

  /** An input indicating the type of the custom header component for the calendar, if set. */
  @Input() calendarHeaderComponent: ComponentType<any>;

  /** An input indicating the type of the custom footer component for the calendar, if set. */
  @Input() calendarFooterComponent: ComponentType<any>;

  /** The date to open the calendar to initially. */
  @Input()
  get startAt(): D | number | null {
    if (this._startAt) { // If an explicit startAt is set we start there, otherwise...
      return this._startAt;
    } else if (['range', 'since'].includes(this.selectionMode)) { // ..."Range" or "Since"
      return this._datepickerInput && this._datepickerInput.value ?
        (<SatDatepickerRangeValue<D | number>>this._datepickerInput.value).begin : null;
    } else if (this.selectionMode === 'until') { // ..."Until"
      return this._datepickerInput && this._datepickerInput.value ?
        (<SatDatepickerRangeValue<D | number>>this._datepickerInput.value).end : null;
    } else { // ... or "Date"
      return this._datepickerInput ? <any>this._datepickerInput.value : null;
    }
  }
  set startAt(value: D | number | null) {
    this._startAt = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _startAt: D | number | null;

  /** The view that the calendar should start in. */
  @Input() startView: 'month' | 'year' | 'multi-year' = 'month';

  /** Color palette to use on the datepicker's calendar. */
  @Input()
  get color(): ThemePalette {
    return this._color ||
        (this._datepickerInput ? this._datepickerInput._getThemePalette() : undefined);
  }
  set color(value: ThemePalette) {
    this._color = value;
  }
  _color: ThemePalette;

  /**
   * Whether the calendar UI is in touch mode. In touch mode the calendar opens in a dialog rather
   * than a popup and elements have more padding to allow for bigger touch targets.
   */
  @Input()
  get touchUi(): boolean { return this._touchUi; }
  set touchUi(value: boolean) {
    this._touchUi = coerceBooleanProperty(value);
  }
  private _touchUi = false;

  /** Whether the datepicker pop-up should be disabled. */
  @Input()
  get disabled(): boolean {
    return this._disabled === undefined && this._datepickerInput ?
        this._datepickerInput.disabled : !!this._disabled;
  }
  set disabled(value: boolean) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._disabled) {
      this._disabled = newValue;
      this._disabledChange.next(newValue);
    }
  }
  private _disabled: boolean;

  /**
   * Emits selected year in multiyear view.
   * This doesn't imply a change on the selected date.
   */
  @Output() readonly yearSelected: EventEmitter<D|number> = new EventEmitter<D|number>();

  /**
   * Emits selected month in year view.
   * This doesn't imply a change on the selected date.
   */
  @Output() readonly monthSelected: EventEmitter<D|number> = new EventEmitter<D|number>();

  /** Classes to be passed to the date picker panel. Supports the same syntax as `ngClass`. */
  @Input() panelClass: string | string[];

  /** Function that can be used to add custom CSS classes to dates. */
  @Input() dateClass: (date: D) => SatCalendarCellCssClasses;

  /** Emits when the datepicker has been opened. */
  @Output('opened') openedStream: EventEmitter<void> = new EventEmitter<void>();

  /** Emits when the datepicker has been closed. */
  @Output('closed') closedStream: EventEmitter<void> = new EventEmitter<void>();

  /** Enables datepicker closing after selection */
  @Input() closeAfterSelection = true;

  /** In range mod, enable datepicker to select the first date selected as a one-day-range,
   * if the user closes the picker before selecting another date
   */
  @Input() selectFirstDateOnClose = false;

  /** Order the views when clicking on period label button */
  @Input() orderPeriodLabel: 'month' | 'multi-year' = 'multi-year';

  /** Whether the calendar is open. */
  @Input()
  get opened(): boolean { return this._opened; }
  set opened(value: boolean) { value ? this.open() : this.close(); }
  private _opened = false;

  /** The id for the datepicker calendar. */
  id = `sat-datepicker-${datepickerUid++}`;

  /** The currently selected date. */
  get _selected(): D | null { return this._validSelected; }
  set _selected(value: D | null) { this._validSelected = value; }
  private _validSelected: D | null = null;

  /** The minimum selectable date. */
  get _minDate(): D | number | null {
    return this._datepickerInput && this._datepickerInput.min;
  }

  /** The maximum selectable date. */
  get _maxDate(): D | number | null {
    return this._datepickerInput && this._datepickerInput.max;
  }

  get _dateFilter(): (date: D | null) => boolean {
    return this._datepickerInput && this._datepickerInput._dateFilter;
  }

  /** A reference to the overlay when the calendar is opened as a popup. */
  _popupRef: OverlayRef;

  /** A reference to the dialog when the calendar is opened as a dialog. */
  private _dialogRef: MatDialogRef<SatDatepickerContent<D|number>> | null;

  /** A portal containing the calendar for this datepicker. */
  private _calendarPortal: ComponentPortal<SatDatepickerContent<D|number>>;

  /** Reference to the component instantiated in popup mode. */
  private _popupComponentRef: ComponentRef<SatDatepickerContent<D|number>> | null;

  /** The element that was focused before the datepicker was opened. */
  private _focusedElementBeforeOpen: HTMLElement | null = null;

  /** Subscription to value changes in the associated input element. */
  private _inputSubscription = Subscription.EMPTY;

  /** The input element this datepicker is associated with. */
  _datepickerInput: SatDatepickerInput<D|number>;

  /** Emits when the datepicker is disabled. */
  readonly _disabledChange = new Subject<boolean>();

  /** Emits new selected date when selected date changes. */
  readonly _selectedChanged = new Subject<SatDatepickerRangeValue<D | number>|D>();

  /** The date already selected by the user in range mode. */
  private _beginDateSelected: D | null;

  constructor(private _dialog: MatDialog,
              private _overlay: Overlay,
              private _ngZone: NgZone,
              private _viewContainerRef: ViewContainerRef,
              @Inject(MAT_DATEPICKER_SCROLL_STRATEGY) scrollStrategy: any,
              @Optional() private _dateAdapter: DateAdapter<D|number>,
              @Optional() private _dir: Directionality,
              @Optional() @Inject(DOCUMENT) private _document: any) {
    if (!this._dateAdapter) {
      throw createMissingDateImplError('DateAdapter');
    }

    this._scrollStrategy = scrollStrategy;
  }

  ngOnDestroy() {
    this.close();
    this._inputSubscription.unsubscribe();
    this._disabledChange.complete();

    if (this._popupRef) {
      this._popupRef.dispose();
      this._popupComponentRef = null;
    }
  }

  /** Selects the given date */
  select(date: D): void {
    const oldValue = this._selected;
    this._selected = date;
    if (!this._dateAdapter.sameDate(oldValue, this._selected)) {
      this._selectedChanged.next(date);
    }
  }


  /** Selects the given date range */
  _selectRange(dates: SatDatepickerRangeValue<any>): void {
    this._beginDateSelected = null;
    if (
      !this._dateAdapter.sameDate(dates.begin, this.beginDate) ||
      !this._dateAdapter.sameDate(dates.end, this.endDate)
    ) {
      this._selectedChanged.next(dates);
    }
    this._beginDate = dates.begin;
    this._endDate = dates.end;
  }
  /** Emits the selected year in multiyear view */
  _selectYear(normalizedYear: D): void {
    this.yearSelected.emit(normalizedYear);
  }

  /** Emits selected month in year view */
  _selectMonth(normalizedMonth: D): void {
    this.monthSelected.emit(normalizedMonth);
  }

  /**
   * Register an input with this datepicker.
   * @param input The datepicker input to register with this datepicker.
   */
  _registerInput(input: SatDatepickerInput<D|number>): void {
    if (this._datepickerInput) {
      throw Error('A SatDatepicker can only be associated with a single input.');
    }
    this._datepickerInput = input;
    this._inputSubscription =
        this._datepickerInput._valueChange
          .subscribe((value: SatDatepickerRangeValue<D|number>) => {
            if (value === null) {
              this.beginDate = this.endDate = this._selected = null;
              return;
            }
            if (value && value.hasOwnProperty('begin') && value.hasOwnProperty('end')) {
              value = <SatDatepickerRangeValue<D|number>>value;

              /* When the input value changes, determines the selection mode
                 based on this value and if it differs from the current selection
                 mode, updates it */
              if (value.begin === Infinity) {
                this.selectionMode = SelectionModeType.Until;
              } else if (value.end === Infinity) {
                this.selectionMode = SelectionModeType.Since;
              } else {
                this.selectionMode = SelectionModeType.Range;
              }

              if (value.begin && value.end) {
                this.beginDate = value.begin;
                this.endDate = value.end;
              } else {
                this.beginDate = this.endDate = null;
              }
            } else {
              this.selectionMode = SelectionModeType.Date;
              this._selected = <any>value;
            }
        });
  }

  /** Open the calendar. */
  open(): void {
    if (this._opened || this.disabled) {
      return;
    }
    if (!this._datepickerInput) {
      throw Error('Attempted to open an SatDatepicker with no associated input.');
    }
    if (this._document) {
      this._focusedElementBeforeOpen = this._document.activeElement;
    }

    this.touchUi ? this._openAsDialog() : this._openAsPopup();
    this._opened = true;
    this.openedStream.emit();
  }

  /** Close the calendar. */
  close(): void {
    if (!this._opened) {
      return;
    }
    if (this._popupRef && this._popupRef.hasAttached()) {
      this._popupRef.detach();
    }
    if (this._dialogRef) {
      this._dialogRef.close();
      this._dialogRef = null;
    }
    if (this._calendarPortal && this._calendarPortal.isAttached) {
      this._calendarPortal.detach();
    }
    if (this._beginDateSelected && this.selectFirstDateOnClose ) {
      this._selectRange({begin: this._beginDateSelected, end: this._beginDateSelected});
    }

    const completeClose = () => {
      // The `_opened` could've been reset already if
      // we got two events in quick succession.
      if (this._opened) {
        this._opened = false;
        this.closedStream.emit();
        this._focusedElementBeforeOpen = null;
      }
    };

    if (this._focusedElementBeforeOpen &&
      typeof this._focusedElementBeforeOpen.focus === 'function') {
      // Because IE moves focus asynchronously, we can't count on it being restored before we've
      // marked the datepicker as closed. If the event fires out of sequence and the element that
      // we're refocusing opens the datepicker on focus, the user could be stuck with not being
      // able to close the calendar at all. We work around it by making the logic, that marks
      // the datepicker as closed, async as well.
      this._focusedElementBeforeOpen.focus();
      setTimeout(completeClose);
    } else {
      completeClose();
    }
  }

  setBeginDateSelected(date: D): void {
    this._beginDateSelected = date;
  }

  /** Open the calendar as a dialog. */
  private _openAsDialog(): void {
    // Usually this would be handled by `open` which ensures that we can only have one overlay
    // open at a time, however since we reset the variables in async handlers some overlays
    // may slip through if the user opens and closes multiple times in quick succession (e.g.
    // by holding down the enter key).
    if (this._dialogRef) {
      this._dialogRef.close();
    }

    this._dialogRef = this._dialog.open<SatDatepickerContent<D|number>>(SatDatepickerContent, {
      direction: this._dir ? this._dir.value : 'ltr',
      viewContainerRef: this._viewContainerRef,
      panelClass: 'mat-datepicker-dialog',
    });

    this._dialogRef.afterClosed().subscribe(() => this.close());
    this._dialogRef.componentInstance.datepicker = this;
    this._setColor();
  }

  /** Open the calendar as a popup. */
  private _openAsPopup(): void {
    if (!this._calendarPortal) {
      this._calendarPortal = new ComponentPortal<SatDatepickerContent<D|number>>(SatDatepickerContent,
                                                                          this._viewContainerRef);
    }

    if (!this._popupRef) {
      this._createPopup();
    }

    if (!this._popupRef.hasAttached()) {
      this._popupComponentRef = this._popupRef.attach(this._calendarPortal);
      this._popupComponentRef.instance.datepicker = this;
      this._setColor();

      // Update the position once the calendar has rendered.
      this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
        this._popupRef.updatePosition();
      });
    }
  }

  /** Create the popup. */
  private _createPopup(): void {
    const overlayConfig = new OverlayConfig({
      positionStrategy: this._createPopupPositionStrategy(),
      hasBackdrop: true,
      backdropClass: 'mat-overlay-transparent-backdrop',
      direction: this._dir,
      scrollStrategy: this._scrollStrategy(),
      panelClass: 'mat-datepicker-popup',
    });

    this._popupRef = this._overlay.create(overlayConfig);
    this._popupRef.overlayElement.setAttribute('role', 'dialog');

    merge(
      this._popupRef.backdropClick(),
      this._popupRef.detachments(),
      this._popupRef.keydownEvents().pipe(filter(event => {
        // Closing on alt + up is only valid when there's an input associated with the datepicker.
        return event.keyCode === ESCAPE ||
               (this._datepickerInput && event.altKey && event.keyCode === UP_ARROW);
      }))
    ).subscribe(() => this.close());
  }

  /** Create the popup PositionStrategy. */
  private _createPopupPositionStrategy(): PositionStrategy {
    return this._overlay.position()
      .flexibleConnectedTo(this._datepickerInput.getConnectedOverlayOrigin())
      .withTransformOriginOn('.mat-datepicker-content')
      .withFlexibleDimensions(false)
      .withViewportMargin(8)
      .withLockedPosition()
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top'
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom'
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top'
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom'
        }
      ]);
  }

  /**
   * @param obj The object to check.
   * @returns The given object if it is both a date instance and valid, otherwise null.
   */
  private _getValidDateOrNull(obj: any): D | null {
    return (obj === Infinity || (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj))) ? obj : null;
  }

  /** Passes the current theme color along to the calendar overlay. */
  private _setColor(): void {
    const color = this.color;
    if (this._popupComponentRef) {
      this._popupComponentRef.instance.color = color;
    }
    if (this._dialogRef) {
      this._dialogRef.componentInstance.color = color;
    }
  }
}
