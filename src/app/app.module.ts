import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SatDatepickerModule } from '../../saturn-datepicker/src/datepicker';
import { SatNativeDateModule } from '../../saturn-datepicker/src/datetime';

import { AppComponent } from './app.component';
import { RangesFooter } from './ranges-footer.component';


@NgModule({
  bootstrap: [
    AppComponent,
  ],
  declarations: [
    AppComponent,
    RangesFooter,
  ],
  entryComponents: [
    RangesFooter,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    SatDatepickerModule,
    SatNativeDateModule,
  ],
})
export class AppModule {
}
