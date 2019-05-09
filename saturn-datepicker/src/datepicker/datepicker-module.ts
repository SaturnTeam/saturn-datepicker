/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { SatCalendar, SatCalendarFooter, SatCalendarHeader } from './calendar';
import { SatCalendarBody } from './calendar-body';
import { MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER, SatDatepicker, SatDatepickerContent } from './datepicker';
import { SatDatepickerInput } from './datepicker-input';
import { SatDatepickerIntl } from './datepicker-intl';
import { SatDatepickerToggle, SatDatepickerToggleIcon } from './datepicker-toggle';
import { SatMonthView } from './month-view';
import { SatMultiYearView } from './multi-year-view';
import { SatYearView } from './year-view';


@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    OverlayModule,
    A11yModule,
    PortalModule,
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
    SatCalendarHeader,
    SatCalendarFooter,
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
    SatCalendarHeader,
    SatCalendarFooter,
  ],
  providers: [
    SatDatepickerIntl,
    MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER,
  ],
  entryComponents: [
    SatDatepickerContent,
    SatCalendarHeader,
    SatCalendarFooter,
  ]
})
export class SatDatepickerModule {}
