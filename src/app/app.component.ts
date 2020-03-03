import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RangesFooter } from './ranges-footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  form: FormGroup;
  rangesFooter = RangesFooter;
  inlineRange;
  selectedDate;

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      date: [{begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25)}]
    });
  }

  inlineRangeChange($event) {
    this.inlineRange = $event;
  }

}
