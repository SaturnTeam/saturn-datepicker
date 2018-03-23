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
import {SaturnCalendar} from './calendar';
import {SaturnCalendarBody} from './calendar-body';
import {
    MAT_DATEPICKER_SCROLL_STRATEGY, MAT_DATEPICKER_SCROLL_STRATEGY_PROVIDER, SaturnDatepicker,
    SaturnDatepickerContent
} from './datepicker';
import {SaturnDatepickerInput} from './datepicker-input';
import {SaturnDatepickerIntl} from './datepicker-intl';
import {SaturnDatepickerToggle, SaturnDatepickerToggleIcon} from './datepicker-toggle';
import {SaturnMonthView} from './month-view';
import {SaturnMultiYearView} from './multi-year-view';
import {SaturnYearView} from './year-view';


@NgModule({
    imports: [
        A11yModule,
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        OverlayModule,
    ],
    exports: [
        SaturnCalendar,
        SaturnCalendarBody,
        SaturnDatepicker,
        SaturnDatepickerContent,
        SaturnDatepickerInput,
        SaturnDatepickerToggle,
        SaturnDatepickerToggleIcon,
        SaturnMonthView,
        SaturnYearView,
        SaturnMultiYearView,
    ],
    declarations: [
        SaturnCalendar,
        SaturnCalendarBody,
        SaturnDatepicker,
        SaturnDatepickerContent,
        SaturnDatepickerInput,
        SaturnDatepickerToggle,
        SaturnDatepickerToggleIcon,
        SaturnMonthView,
        SaturnYearView,
        SaturnMultiYearView,
    ],
    providers: [
        SaturnDatepickerIntl,
        MAT_DATEPICKER_SCROLL_STRATEGY_PROVIDER,
    ],
    entryComponents: [
        SaturnDatepickerContent,
    ]
})
export class SaturnDatepickerModule {}
