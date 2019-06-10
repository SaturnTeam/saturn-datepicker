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

  selectionModes = ['date', 'range', 'since', 'until'];
  selectionModesRange = ['range'];
  selectionModesSinceUntil = ['since', 'until'];

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      picker1: [new Date(2018, 7, 5)],
      picker2: [{ begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25) }],
      picker3: [{ begin: new Date(2018, 7, 5), end: Infinity }],
      picker4: [{ begin: new Date(2018, 7, 5), end: Infinity }],
      picker5: [{ begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25) }],
      picker6: [{ begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25) }],
      picker7: [{ begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25) }],
      picker8: [{ begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25) }],
      picker9: [{ begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25) }]
    });
  }

  inlineRangeChange($event) {
    this.inlineRange = $event;
  }

}
