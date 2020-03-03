import { NgModule } from '@angular/core';
import { PlatformModule } from '@angular/cdk/platform';

import { DateAdapter } from './date-adapter';
import { NativeDateAdapter } from './native-date-adapter';
import { MAT_DATE_FORMATS } from './date-formats';
import { MAT_NATIVE_DATE_FORMATS } from './native-date-formats';


@NgModule({
  imports: [
    PlatformModule,
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: NativeDateAdapter,
    },
  ],
})
export class NativeDateModule {
}

@NgModule({
  imports: [
    NativeDateModule,
  ],
  providers: [
    {
      provide: MAT_DATE_FORMATS,
      useValue: MAT_NATIVE_DATE_FORMATS,
    },
  ],
})
export class SatNativeDateModule {
}
