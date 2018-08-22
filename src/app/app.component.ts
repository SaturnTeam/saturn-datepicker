import { Component } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-root',
  template: `
      <form [formGroup]="form">
          <mat-form-field>
              <input matInput
                     placeholder="Choose a date"
                     [satDatepicker]="picker"
                     formControlName="date">
              <sat-datepicker #picker [rangeMode]="true"
                              [closeAfterSelection]="false">
              </sat-datepicker>
              <sat-datepicker-toggle matSuffix [for]="picker"></sat-datepicker-toggle>
          </mat-form-field>
      </form>
`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    form: FormGroup;
    constructor(fb: FormBuilder) {
        this.form = fb.group({
            date: [{ begin: new Date(2018, 7, 5), end: new Date(2018, 7, 25) }]
        });
    }

}
