import {NgModule} from '@angular/core';


import {MatDatepickerModule} from "./datepicker";
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';


@NgModule({
  declarations: [
  ],
  imports: [
      BrowserModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
