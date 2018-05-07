<?php
function replace($dir) {

    $files = scandir($dir);
    $sources = [
        'mat-calendar',
        'MatCalendar',
        'MatDatepicker',
        'mat-datepicker',
        'mat-month',
        'MatMonth',
        'mat-multi',
        'MatMulti',
        'mat-year',
        'MatYear',
        'MatNativeDateModule',
    ];
    $targets = str_replace(['mat', 'Mat'], ['sat', 'Sat'], $sources);

    array_push($sources, '.sat');
    array_push($sources, '"sat');
    array_push($sources, "'class': 'sat");
    array_push($sources, "exportAs: 'sat");
    array_push($sources, "panelClass: 'sat");

    array_push($targets, '.mat');
    array_push($targets, '"mat');
    array_push($targets, "'class': 'mat");
    array_push($targets, "exportAs: 'mat");
    array_push($targets, "panelClass: 'mat");
    foreach ($files as $file) {
        if (strrpos($file, 'html') > 0 || strrpos($file, 'ts') > 0) {
            $contents = file_get_contents($dir . $file);
            $contents = str_replace($sources, $targets, $contents);
            file_put_contents($dir . $file, $contents);
//        echo $contents;
        }
    }
}
replace('src/lib/datepicker/');
replace('src/lib/core/datetime/');