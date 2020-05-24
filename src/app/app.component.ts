import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RangesFooter } from './ranges-footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('inlineRangePicker', {static: false}) inlineRangePicker;
  @ViewChild('inlineSingleDatePicker', {static: false}) inlineSingleDatePicker;

  form: FormGroup;
  rangesFooter = RangesFooter;
  inlineRange;
  inlineBeginDate;
  selectedDate;

  min = new Date(2019, 0, 1);
  max = new Date(2020, 0, 1);

  
  constructor(fb: FormBuilder) {
    this.form = fb.group({
      date: [{begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25)}]
    });
  }

  inlineRangeChange($event) {
    this.inlineRange = $event;
  }

  inlineBeginChange($event) {
    this.inlineBeginDate = $event;
  }

  inlineSingleDateChange($event) {
    this.selectedDate = $event;
  }

  resetRange() {
    this.inlineRange = undefined;
    this.inlineBeginDate = undefined;

    this.inlineRangePicker._reset();
  }

  resetSingleDate() {
    this.selectedDate = undefined;
    this.inlineRangePicker._reset();
  }

}
