# Material range datepicker
Material datepicker with range support
## What is this?

This is a based on Material source code (March 22, 2018) implementation of Material Datepicker for Angular.
I created this repository and this package due to it takes a lot of time to contribute to material2 repository.
[Issue in material2 repo.](https://github.com/angular/material2/issues/4763)
![Material date range picker](screenshot.png)
## [DEMO](https://stackblitz.com/edit/angular-b23dak)
## Advantages
1) Dates range selecting in datepicker 
2) Have special attribute to turn on range mode on datepicker
3) Value managing as easy as it in `MatDatepicker`
4) *You can use all attributes: min, max, formControl and others*
5) Supports input from keyboard
6) Supports keyboard handling
 
## Changelog
## 6.0.1
Updated to material datepicker 6.0.1
## 6.0.0
Styles included! Read below
## 1.1.7
Update to angular material 6.0.0 (2018/05/04)

Now package can be compiled for production. Internal styles - soon!

### 2018/04/18
Datepicker theme supports dark themes. How to use it read below
### 1.1.0
Introduce first day of the week depends on locale

### 1.0.7
Roll back to angular material 5.2 source code

### 1.0

API has been completely changed.

## It's awesome, but how to use it?

As easy as pie.
Installation: `yarn add saturn-datepicker` or `npm install saturn-datepicker`
Import `SatDatepickerModule`, `SatNativeDateModule` and `MatDatepickerModule`
```angular2html
  <mat-form-field>
    <input matInput [satDatepicker]="resultPicker">
    <sat-datepicker
        #resultPicker
        [rangeMode]="true">
    </sat-datepicker>
   </mat-form-field>
```

Add styles:
* If you are using CSS: copy-paste or include somehow the file `saturn-datepicker/bundle.css`
* If you are using SCSS: 
```scss
@import '~saturn-datepicker/theming';
@include sat-datepicker-theme($theme); # material theme data structure https://material.angular.io/guide/theming#defining-a-custom-theme
```

## ngModel/formControl value have this interface:
```typescript
export interface SatDatepickerRangeValue<D> {
  begin: D | null;
  end: D | null;
}
```

Licence: MIT

A little note for myself
```shell
npm run packagr
(cd dist ; npm pack)
yarn add range-0.0.1.tgz 
```
