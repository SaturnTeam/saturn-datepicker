import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SatDatepickerModule } from '../../saturn-datepicker/src/datepicker';
import { SatNativeDateModule } from '../../saturn-datepicker/src/datetime';
import { AppComponent } from './app.component';
import { RangesFooter } from './ranges-footer.component';


@NgModule({
    declarations: [
        AppComponent,
        RangesFooter
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule, ReactiveFormsModule, MatDatepickerModule,
        MatNativeDateModule, MatFormFieldModule, MatInputModule,
        MatButtonModule, SatDatepickerModule, SatNativeDateModule
    ],
    entryComponents: [RangesFooter],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
