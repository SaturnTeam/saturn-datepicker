import { ChangeDetectorRef, Component } from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SatCalendar, SatCalendarFooter, SatDatepicker } from '../../saturn-datepicker/src/datepicker';
import { DateAdapter } from '../../saturn-datepicker/src/datetime';

@Component({
    templateUrl: './ranges-footer.component.html'
})
export class RangesFooter<Date> implements SatCalendarFooter<Date> {
    public ranges: Array<{key: string, label: string}> = [
        {key: 'today', label: 'Today'},
        {key: 'thisWeek', label: 'This Week'},
    ];
    private destroyed = new Subject<void>();

    constructor(
        private calendar: SatCalendar<Date>,
        private datePicker: SatDatepicker<Date>,
        private dateAdapter: DateAdapter<Date>,
        cdr: ChangeDetectorRef
    ) {
        calendar.stateChanges
            .pipe(takeUntil(this.destroyed))
            .subscribe(() => cdr.markForCheck())
    }

    setRange(range: string) {
        switch (range) {
            case 'today':
                this.calendar.beginDate = this.dateAdapter.deserialize(new Date());
                this.calendar.endDate = this.dateAdapter.deserialize(new Date());
                this.calendar.activeDate = this.calendar.beginDate;
                break;
            case 'thisWeek':
                const today = moment();
                this.calendar.beginDate = this.dateAdapter.deserialize(today.weekday(0).toDate());
                this.calendar.endDate = this.dateAdapter.deserialize(today.weekday(6).toDate());
                break;
        }
        this.calendar.activeDate = this.calendar.beginDate;
        this.calendar.beginDateSelectedChange.emit(this.calendar.beginDate);
        this.calendar.dateRangesChange.emit({begin: this.calendar.beginDate, end: this.calendar.endDate});
        this.datePicker.close();
    }
}
