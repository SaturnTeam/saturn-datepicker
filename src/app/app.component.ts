import { Component } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-root',
  template: `
      <form [formGroup]="form">
          <h2>No auto close</h2>
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
          <h2>Auto close</h2>
          <mat-form-field>
              <input matInput
                     placeholder="Choose a date"
                     [satDatepicker]="picker2"
                     formControlName="date">
              <sat-datepicker #picker2 [rangeMode]="true"
                              [closeAfterSelection]="true">
              </sat-datepicker>
              <sat-datepicker-toggle matSuffix [for]="picker2"></sat-datepicker-toggle>
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
