import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RangesFooter } from './ranges-footer.component';
import { SatDatepickerRangeValue } from '../../saturn-datepicker/src/datepicker';


@Component({
  selector: 'app-root',
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  public formGroup: FormGroup;
  public inlineRange: SatDatepickerRangeValue<Date>;
  public rangesFooter = RangesFooter;
  public selectedDate: Date;

  constructor(private formBuilder: FormBuilder) {
  }

  public ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      date: [
        {
          begin: new Date(2018, 7, 5),
          end: new Date(2018, 7, 25),
        },
      ],
    });
  }

  public inlineRangeChange(rangeValue: SatDatepickerRangeValue<Date>): void {
    this.inlineRange = rangeValue;
  }
}
