import { NgModule } from '@angular/core';


import {SatDatepickerModule} from "./datepicker";
import {MatFormFieldModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';


@NgModule({
  declarations: [
  ],
  imports: [
      BrowserModule,

      SatDatepickerModule,
      MatFormFieldModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
