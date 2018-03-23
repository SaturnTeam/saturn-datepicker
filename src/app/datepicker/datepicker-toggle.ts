/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {
    AfterContentInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewEncapsulation,
    Directive,
    ContentChild,
} from '@angular/core';
import {merge} from 'rxjs/observable/merge';
import {of as observableOf} from 'rxjs/observable/of';
import {Subscription} from 'rxjs/Subscription';
import {SaturnDatepicker} from './datepicker';
import {SaturnDatepickerIntl} from './datepicker-intl';


/** Can be used to override the icon of a `matDatepickerToggle`. */
@Directive({
    selector: '[matDatepickerToggleIcon]'
})
export class SaturnDatepickerToggleIcon {}


@Component({
    moduleId: module.id,
    selector: 'saturn-datepicker-toggle',
    templateUrl: 'datepicker-toggle.html',
    styleUrls: ['datepicker-toggle.css'],
    host: {
        'class': 'mat-datepicker-toggle',
        '[class.mat-datepicker-toggle-active]': 'datepicker && datepicker.opened',
        '[class.mat-accent]': 'datepicker && datepicker.color === "accent"',
        '[class.mat-warn]': 'datepicker && datepicker.color === "warn"',
    },
    exportAs: 'matDatepickerToggle',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaturnDatepickerToggle<D> implements AfterContentInit, OnChanges, OnDestroy {
    private _stateChanges = Subscription.EMPTY;

    /** Datepicker instance that the button will toggle. */
    @Input('for') datepicker: SaturnDatepicker<D>;

    /** Whether the toggle button is disabled. */
    @Input()
    get disabled(): boolean {
        return this._disabled === undefined ? this.datepicker.disabled : !!this._disabled;
    }
    set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
    }
    private _disabled: boolean;

    /** Custom icon set by the consumer. */
    @ContentChild(SaturnDatepickerToggleIcon) _customIcon: SaturnDatepickerToggleIcon;

    constructor(public _intl: SaturnDatepickerIntl, private _changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.datepicker) {
            this._watchStateChanges();
        }
    }

    ngOnDestroy() {
        this._stateChanges.unsubscribe();
    }

    ngAfterContentInit() {
        this._watchStateChanges();
    }

    _open(event: Event): void {
        if (this.datepicker && !this.disabled) {
            this.datepicker.open();
            event.stopPropagation();
        }
    }

    private _watchStateChanges() {
        const datepickerDisabled = this.datepicker ? this.datepicker._disabledChange : observableOf();
        const inputDisabled = this.datepicker && this.datepicker._datepickerInput ?
            this.datepicker._datepickerInput._disabledChange : observableOf();
        const datepickerToggled = this.datepicker ?
            merge(this.datepicker.openedStream, this.datepicker.closedStream) :
            observableOf();

        this._stateChanges.unsubscribe();
        this._stateChanges = merge(
            this._intl.changes,
            datepickerDisabled,
            inputDisabled,
            datepickerToggled
        ).subscribe(() => this._changeDetectorRef.markForCheck());
    }
}
