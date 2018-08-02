import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AppComponent} from './app.component';
import {SatDatepickerModule} from "../../saturn-datepicker/src/datepicker";
import {SatNativeDateModule} from "../../saturn-datepicker/src/datetime";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule} from "@angular/material";

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule, ReactiveFormsModule, MatDatepickerModule,
        MatNativeDateModule, MatFormFieldModule, MatInputModule,
        SatDatepickerModule, SatNativeDateModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
