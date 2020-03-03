import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  SatCalendar,
  SatCalendarFooter,
  SatDatepicker,
  SatDatepickerRangeValue,
} from '../../saturn-datepicker/src/datepicker';
import { DateAdapter } from '../../saturn-datepicker/src/datetime';


export interface IRangesFooterOption {
  key: string,
  label: string,
}

@Component({
  selector: 'app-ranges-footer',
  templateUrl: './ranges-footer.component.html',
})
export class RangesFooter implements OnDestroy, OnInit, SatCalendarFooter<Date> {
  public rangeOptions: IRangesFooterOption[] = [
    { key: 'today', label: 'Today' },
    { key: 'thisWeek', label: 'This Week' },
  ];
  private readonly destroyed: Subject<void> = new Subject<void>();

  constructor(
    private calendar: SatCalendar<Date>,
    private datePicker: SatDatepicker<Date>,
    private dateAdapter: DateAdapter<Date>,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  public ngOnInit(): void {
    this.calendar.stateChanges.pipe(
      takeUntil(this.destroyed),
    ).subscribe((): void => {
      this.changeDetectorRef.markForCheck();
    });
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
  }

  public setRange(range: string): void {
    switch (range) {
      case 'today':
        this.calendar.beginDate = this.dateAdapter.deserialize(new Date());
        this.calendar.endDate = this.dateAdapter.deserialize(new Date());
        this.calendar.activeDate = this.calendar.beginDate;
        break;
      case 'thisWeek':
        const today = moment();
        this.calendar.beginDate = this.dateAdapter.deserialize(
          today.weekday(0).toDate());
        this.calendar.endDate = this.dateAdapter.deserialize(
          today.weekday(6).toDate());
        break;
    }
    this.calendar.activeDate = this.calendar.beginDate;
    this.calendar.beginDateSelectedChange.emit(this.calendar.beginDate);
    const rangeValue: SatDatepickerRangeValue<Date> = {
      begin: this.calendar.beginDate,
      end: this.calendar.endDate,
    };
    this.calendar.dateRangesChange.emit(rangeValue);
    this.datePicker.close();
  }
}
