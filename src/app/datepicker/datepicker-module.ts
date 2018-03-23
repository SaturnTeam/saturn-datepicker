/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {A11yModule} from '@angular/cdk/a11y';
import {OverlayModule} from '@angular/cdk/overlay';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {SatCalendar} from './calendar';
import {SatCalendarBody} from './calendar-body';
import {
    MAT_DATEPICKER_SCROLL_STRATEGY_PROVIDER, SatDatepicker,
    SatDatepickerContent
} from './datepicker';
import {SatDatepickerInput} from './datepicker-input';
import {SatDatepickerIntl} from './datepicker-intl';
import {SatDatepickerToggle, SatDatepickerToggleIcon} from './datepicker-toggle';
import {SatMonthView} from './month-view';
import {SatMultiYearView} from './multi-year-view';
import {SatYearView} from './year-view';


@NgModule({
    imports: [
        A11yModule,
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        OverlayModule,
    ],
    exports: [
        SatCalendar,
        SatCalendarBody,
        SatDatepicker,
        SatDatepickerContent,
        SatDatepickerInput,
        SatDatepickerToggle,
        SatDatepickerToggleIcon,
        SatMonthView,
        SatYearView,
        SatMultiYearView,
    ],
    declarations: [
        SatCalendar,
        SatCalendarBody,
        SatDatepicker,
        SatDatepickerContent,
        SatDatepickerInput,
        SatDatepickerToggle,
        SatDatepickerToggleIcon,
        SatMonthView,
        SatYearView,
        SatMultiYearView,
    ],
    providers: [
        SatDatepickerIntl,
        MAT_DATEPICKER_SCROLL_STRATEGY_PROVIDER,
    ],
    entryComponents: [
        SatDatepickerContent,
    ]
})
export class SatDatepickerModule {}
