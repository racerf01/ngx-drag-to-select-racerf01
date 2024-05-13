import { Component, ElementRef, Output, EventEmitter, Input, Renderer2, ViewChild, NgZone, ContentChildren, QueryList, HostBinding, PLATFORM_ID, Inject, } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, combineLatest, merge, from, fromEvent, BehaviorSubject, asyncScheduler } from 'rxjs';
import { switchMap, takeUntil, map, tap, filter, auditTime, mapTo, share, withLatestFrom, distinctUntilChanged, observeOn, startWith, concatMapTo, first, } from 'rxjs/operators';
import { SelectItemDirective, SELECT_ITEM_INSTANCE } from './select-item.directive';
import { ShortcutService } from './shortcut.service';
import { createSelectBox, whenSelectBoxVisible } from './operators';
import { Action, UpdateActions, } from './models';
import { AUDIT_TIME, NO_SELECT_CLASS } from './constants';
import { inBoundingBox, cursorWithinElement, clearSelection, boxIntersects, calculateBoundingClientRect, getRelativeMousePosition, getMousePosition, hasMinimumSize, } from './utils';
import { KeyboardEventsService } from './keyboard-events.service';
import * as i0 from "@angular/core";
import * as i1 from "./shortcut.service";
import * as i2 from "./keyboard-events.service";
import * as i3 from "@angular/common";
export class SelectContainerComponent {
    constructor(platformId, shortcuts, keyboardEvents, hostElementRef, renderer, ngZone) {
        this.platformId = platformId;
        this.shortcuts = shortcuts;
        this.keyboardEvents = keyboardEvents;
        this.hostElementRef = hostElementRef;
        this.renderer = renderer;
        this.ngZone = ngZone;
        this.selectOnDrag = true;
        this.disabled = false;
        this.disableDrag = false;
        this.selectOnClick = true;
        this.dragOverItems = true;
        this.disableRangeSelection = false;
        this.selectMode = false;
        this.selectWithShortcut = false;
        this.custom = false;
        this.hostClass = true;
        this.selectedItemsChange = new EventEmitter();
        this.select = new EventEmitter();
        this.itemSelected = new EventEmitter();
        this.itemDeselected = new EventEmitter();
        this.selectionStarted = new EventEmitter();
        this.selectionEnded = new EventEmitter();
        this._tmpItems = new Map();
        this._selectedItems$ = new BehaviorSubject([]);
        this._selectableItems = [];
        this.updateItems$ = new Subject();
        this.destroy$ = new Subject();
        this._lastRange = [-1, -1];
        this._lastStartIndex = undefined;
        this._newRangeStart = false;
        this._lastRangeSelection = new Map();
    }
    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.host = this.hostElementRef.nativeElement;
            this._initSelectedItemsChange();
            this._calculateBoundingClientRect();
            this._observeBoundingRectChanges();
            this._observeSelectableItems();
            const mouseup$ = this.keyboardEvents.mouseup$.pipe(filter(() => !this.disabled), tap(() => this._onMouseUp()), share());
            const mousemove$ = this.keyboardEvents.mousemove$.pipe(filter(() => !this.disabled), share());
            const mousedown$ = fromEvent(this.host, 'mousedown').pipe(filter((event) => event.button === 0), // only emit left mouse
            filter(() => !this.disabled), filter((event) => this.selectOnClick || event.target === this.host), tap((event) => this._onMouseDown(event)), share());
            const dragging$ = mousedown$.pipe(filter((event) => !this.shortcuts.disableSelection(event)), 
            // filter(() => !this.selectMode),
            filter(() => !this.disableDrag), filter((event) => this.dragOverItems || event.target === this.host), switchMap(() => mousemove$.pipe(takeUntil(mouseup$))), share());
            const currentMousePosition$ = mousedown$.pipe(map((event) => getRelativeMousePosition(event, this.host)));
            const show$ = dragging$.pipe(mapTo(1));
            const hide$ = mouseup$.pipe(mapTo(0));
            const opacity$ = merge(show$, hide$).pipe(distinctUntilChanged());
            const selectBox$ = combineLatest([dragging$, opacity$, currentMousePosition$]).pipe(createSelectBox(this.host), share());
            this.selectBoxClasses$ = merge(dragging$, mouseup$, this.keyboardEvents.distinctKeydown$, this.keyboardEvents.distinctKeyup$).pipe(auditTime(AUDIT_TIME), withLatestFrom(selectBox$), map(([event, selectBox]) => {
                return {
                    'dts-adding': hasMinimumSize(selectBox, 0, 0) && !this.shortcuts.removeFromSelection(event),
                    'dts-removing': this.shortcuts.removeFromSelection(event),
                };
            }), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)));
            const selectOnMouseUp$ = dragging$.pipe(filter(() => !this.selectOnDrag), filter(() => !this.selectMode), filter((event) => this._cursorWithinHost(event)), switchMap((_) => mouseup$.pipe(first())), filter((event) => (!this.shortcuts.disableSelection(event) && !this.shortcuts.toggleSingleItem(event)) ||
                this.shortcuts.removeFromSelection(event)));
            const selectOnDrag$ = selectBox$.pipe(auditTime(AUDIT_TIME), withLatestFrom(mousemove$, (selectBox, event) => ({
                selectBox,
                event,
            })), filter(() => this.selectOnDrag), filter(({ selectBox }) => hasMinimumSize(selectBox)), map(({ event }) => event));
            const selectOnKeyboardEvent$ = merge(this.keyboardEvents.distinctKeydown$, this.keyboardEvents.distinctKeyup$).pipe(auditTime(AUDIT_TIME), whenSelectBoxVisible(selectBox$), tap((event) => {
                if (this._isExtendedSelection(event)) {
                    this._tmpItems.clear();
                }
                else {
                    this._flushItems();
                }
            }));
            merge(selectOnMouseUp$, selectOnDrag$, selectOnKeyboardEvent$)
                .pipe(takeUntil(this.destroy$))
                .subscribe((event) => this._selectItems(event));
            this.selectBoxStyles$ = selectBox$.pipe(map((selectBox) => ({
                top: `${selectBox.top}px`,
                left: `${selectBox.left}px`,
                width: `${selectBox.width}px`,
                height: `${selectBox.height}px`,
                opacity: selectBox.opacity,
            })));
            this._initSelectionOutputs(mousedown$, mouseup$);
        }
    }
    ngAfterContentInit() {
        this._selectableItems = this.$selectableItems.toArray();
    }
    selectAll() {
        this.$selectableItems.forEach((item) => {
            this._selectItem(item);
        });
    }
    toggleItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((item) => this._toggleItem(item));
    }
    selectItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((item) => this._selectItem(item));
    }
    deselectItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((item) => this._deselectItem(item));
    }
    clearSelection() {
        this.$selectableItems.forEach((item) => {
            this._deselectItem(item);
        });
    }
    update() {
        this._calculateBoundingClientRect();
        this.$selectableItems.forEach((item) => item.calculateBoundingClientRect());
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    _filterSelectableItems(predicate) {
        // Wrap select items in an observable for better efficiency as
        // no intermediate arrays are created and we only need to process
        // every item once.
        return from(this._selectableItems).pipe(filter((item) => predicate(item.value)));
    }
    _initSelectedItemsChange() {
        this._selectedItems$.pipe(auditTime(AUDIT_TIME), takeUntil(this.destroy$)).subscribe({
            next: (selectedItems) => {
                this.selectedItemsChange.emit(selectedItems);
                this.select.emit(selectedItems);
            },
            complete: () => {
                this.selectedItemsChange.emit([]);
            },
        });
    }
    _observeSelectableItems() {
        // Listen for updates and either select or deselect an item
        this.updateItems$
            .pipe(withLatestFrom(this._selectedItems$), takeUntil(this.destroy$), filter(([update]) => !update.item.dtsDisabled))
            .subscribe(([update, selectedItems]) => {
            const item = update.item;
            switch (update.type) {
                case UpdateActions.Add:
                    if (this._addItem(item, selectedItems)) {
                        item._select();
                    }
                    break;
                case UpdateActions.Remove:
                    if (this._removeItem(item, selectedItems)) {
                        item._deselect();
                    }
                    break;
            }
        });
        // Update the container as well as all selectable items if the list has changed
        this.$selectableItems.changes
            .pipe(withLatestFrom(this._selectedItems$), observeOn(asyncScheduler), takeUntil(this.destroy$))
            .subscribe(([items, selectedItems]) => {
            const newList = items.toArray();
            this._selectableItems = newList;
            const newValues = newList.map((item) => item.value);
            const removedItems = selectedItems.filter((item) => !newValues.includes(item));
            if (removedItems.length) {
                removedItems.forEach((item) => this._removeItem(item, selectedItems));
            }
            this.update();
        });
    }
    _observeBoundingRectChanges() {
        this.ngZone.runOutsideAngular(() => {
            const resize$ = fromEvent(window, 'resize');
            const windowScroll$ = fromEvent(window, 'scroll');
            const containerScroll$ = fromEvent(this.host, 'scroll');
            merge(resize$, windowScroll$, containerScroll$)
                .pipe(startWith('INITIAL_UPDATE'), auditTime(AUDIT_TIME), takeUntil(this.destroy$))
                .subscribe(() => {
                this.update();
            });
        });
    }
    _initSelectionOutputs(mousedown$, mouseup$) {
        mousedown$
            .pipe(filter((event) => this._cursorWithinHost(event)), tap(() => this.selectionStarted.emit()), concatMapTo(mouseup$.pipe(first())), withLatestFrom(this._selectedItems$), map(([, items]) => items), takeUntil(this.destroy$))
            .subscribe((items) => {
            this.selectionEnded.emit(items);
        });
    }
    _calculateBoundingClientRect() {
        this.host.boundingClientRect = calculateBoundingClientRect(this.host);
    }
    _cursorWithinHost(event) {
        return cursorWithinElement(event, this.host);
    }
    _onMouseUp() {
        this._flushItems();
        this.renderer.removeClass(document.body, NO_SELECT_CLASS);
    }
    _onMouseDown(event) {
        if (this.shortcuts.disableSelection(event) || this.disabled) {
            return;
        }
        clearSelection(window);
        if (!this.disableDrag) {
            this.renderer.addClass(document.body, NO_SELECT_CLASS);
        }
        if (this.shortcuts.removeFromSelection(event)) {
            return;
        }
        const mousePoint = getMousePosition(event);
        const [currentIndex, clickedItem] = this._getClosestSelectItem(event);
        let [startIndex, endIndex] = this._lastRange;
        const isMoveRangeStart = this.shortcuts.moveRangeStart(event);
        const shouldResetRangeSelection = !this.shortcuts.extendedSelectionShortcut(event) || isMoveRangeStart || this.disableRangeSelection;
        if (shouldResetRangeSelection) {
            this._resetRangeStart();
        }
        // move range start
        if (shouldResetRangeSelection && !this.disableRangeSelection) {
            if (currentIndex > -1) {
                this._newRangeStart = true;
                this._lastStartIndex = currentIndex;
                clickedItem.toggleRangeStart();
                this._lastRangeSelection.clear();
            }
            else {
                this._lastStartIndex = -1;
            }
        }
        if (currentIndex > -1) {
            startIndex = Math.min(this._lastStartIndex, currentIndex);
            endIndex = Math.max(this._lastStartIndex, currentIndex);
            this._lastRange = [startIndex, endIndex];
        }
        if (isMoveRangeStart) {
            return;
        }
        this.$selectableItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const withinBoundingBox = inBoundingBox(mousePoint, itemRect);
            if (this.shortcuts.extendedSelectionShortcut(event) && this.disableRangeSelection) {
                return;
            }
            const withinRange = this.shortcuts.extendedSelectionShortcut(event) &&
                startIndex > -1 &&
                endIndex > -1 &&
                index >= startIndex &&
                index <= endIndex &&
                startIndex !== endIndex;
            const shouldAdd = (withinBoundingBox &&
                !this.shortcuts.toggleSingleItem(event) &&
                !this.selectMode &&
                !this.selectWithShortcut) ||
                (this.shortcuts.extendedSelectionShortcut(event) && item.selected && !this._lastRangeSelection.get(item)) ||
                withinRange ||
                (withinBoundingBox && this.shortcuts.toggleSingleItem(event) && !item.selected) ||
                (!withinBoundingBox && this.shortcuts.toggleSingleItem(event) && item.selected) ||
                (withinBoundingBox && !item.selected && this.selectMode) ||
                (!withinBoundingBox && item.selected && this.selectMode);
            const shouldRemove = (!withinBoundingBox &&
                !this.shortcuts.toggleSingleItem(event) &&
                !this.selectMode &&
                !this.shortcuts.extendedSelectionShortcut(event) &&
                !this.selectWithShortcut) ||
                (this.shortcuts.extendedSelectionShortcut(event) && currentIndex > -1) ||
                (!withinBoundingBox && this.shortcuts.toggleSingleItem(event) && !item.selected) ||
                (withinBoundingBox && this.shortcuts.toggleSingleItem(event) && item.selected) ||
                (!withinBoundingBox && !item.selected && this.selectMode) ||
                (withinBoundingBox && item.selected && this.selectMode);
            if (shouldAdd) {
                this._selectItem(item);
            }
            else if (shouldRemove) {
                this._deselectItem(item);
            }
            if (withinRange && !this._lastRangeSelection.get(item)) {
                this._lastRangeSelection.set(item, true);
            }
            else if (!withinRange && !this._newRangeStart && !item.selected) {
                this._lastRangeSelection.delete(item);
            }
        });
        // if we don't toggle a single item, we set `newRangeStart` to `false`
        // meaning that we are building up a range
        if (!this.shortcuts.toggleSingleItem(event)) {
            this._newRangeStart = false;
        }
    }
    _selectItems(event) {
        const selectionBox = calculateBoundingClientRect(this.$selectBox.nativeElement);
        this.$selectableItems.forEach((item, index) => {
            if (this._isExtendedSelection(event)) {
                this._extendedSelectionMode(selectionBox, item, event);
            }
            else {
                this._normalSelectionMode(selectionBox, item, event);
                if (this._lastStartIndex < 0 && item.selected) {
                    item.toggleRangeStart();
                    this._lastStartIndex = index;
                }
            }
        });
    }
    _isExtendedSelection(event) {
        return this.shortcuts.extendedSelectionShortcut(event) && this.selectOnDrag;
    }
    _normalSelectionMode(selectBox, item, event) {
        const inSelection = boxIntersects(selectBox, item.getBoundingClientRect());
        const shouldAdd = inSelection && !item.selected && !this.shortcuts.removeFromSelection(event);
        const shouldRemove = (!inSelection && item.selected && !this.shortcuts.addToSelection(event)) ||
            (inSelection && item.selected && this.shortcuts.removeFromSelection(event));
        if (shouldAdd) {
            this._selectItem(item);
        }
        else if (shouldRemove) {
            this._deselectItem(item);
        }
    }
    _extendedSelectionMode(selectBox, item, event) {
        const inSelection = boxIntersects(selectBox, item.getBoundingClientRect());
        const shoudlAdd = (inSelection && !item.selected && !this.shortcuts.removeFromSelection(event) && !this._tmpItems.has(item)) ||
            (inSelection && item.selected && this.shortcuts.removeFromSelection(event) && !this._tmpItems.has(item));
        const shouldRemove = (!inSelection && item.selected && this.shortcuts.addToSelection(event) && this._tmpItems.has(item)) ||
            (!inSelection && !item.selected && this.shortcuts.removeFromSelection(event) && this._tmpItems.has(item));
        if (shoudlAdd) {
            if (item.selected) {
                item._deselect();
            }
            else {
                item._select();
            }
            const action = this.shortcuts.removeFromSelection(event)
                ? Action.Delete
                : this.shortcuts.addToSelection(event)
                    ? Action.Add
                    : Action.None;
            this._tmpItems.set(item, action);
        }
        else if (shouldRemove) {
            if (this.shortcuts.removeFromSelection(event)) {
                item._select();
            }
            else {
                item._deselect();
            }
            this._tmpItems.delete(item);
        }
    }
    _flushItems() {
        this._tmpItems.forEach((action, item) => {
            if (action === Action.Add) {
                this._selectItem(item);
            }
            if (action === Action.Delete) {
                this._deselectItem(item);
            }
        });
        this._tmpItems.clear();
    }
    _addItem(item, selectedItems) {
        let success = false;
        if (!this._hasItem(item, selectedItems)) {
            success = true;
            selectedItems.push(item.value);
            this._selectedItems$.next(selectedItems);
            this.itemSelected.emit(item.value);
        }
        return success;
    }
    _removeItem(item, selectedItems) {
        let success = false;
        const value = item instanceof SelectItemDirective ? item.value : item;
        const index = selectedItems.indexOf(value);
        if (index > -1) {
            success = true;
            selectedItems.splice(index, 1);
            this._selectedItems$.next(selectedItems);
            this.itemDeselected.emit(value);
        }
        return success;
    }
    _toggleItem(item) {
        if (item.selected) {
            this._deselectItem(item);
        }
        else {
            this._selectItem(item);
        }
    }
    _selectItem(item) {
        this.updateItems$.next({ type: UpdateActions.Add, item });
    }
    _deselectItem(item) {
        this.updateItems$.next({ type: UpdateActions.Remove, item });
    }
    _hasItem(item, selectedItems) {
        return selectedItems.includes(item.value);
    }
    _getClosestSelectItem(event) {
        const target = event.target.closest('.dts-select-item');
        let index = -1;
        let targetItem = null;
        if (target) {
            targetItem = target[SELECT_ITEM_INSTANCE];
            index = this._selectableItems.indexOf(targetItem);
        }
        return [index, targetItem];
    }
    _resetRangeStart() {
        this._lastRange = [-1, -1];
        const lastRangeStart = this._getLastRangeSelection();
        if (lastRangeStart && lastRangeStart.rangeStart) {
            lastRangeStart.toggleRangeStart();
        }
    }
    _getLastRangeSelection() {
        if (this._lastStartIndex >= 0) {
            return this._selectableItems[this._lastStartIndex];
        }
        return null;
    }
}
SelectContainerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectContainerComponent, deps: [{ token: PLATFORM_ID }, { token: i1.ShortcutService }, { token: i2.KeyboardEventsService }, { token: i0.ElementRef }, { token: i0.Renderer2 }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
SelectContainerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: SelectContainerComponent, selector: "dts-select-container", inputs: { selectedItems: "selectedItems", selectOnDrag: "selectOnDrag", disabled: "disabled", disableDrag: "disableDrag", selectOnClick: "selectOnClick", dragOverItems: "dragOverItems", disableRangeSelection: "disableRangeSelection", selectMode: "selectMode", selectWithShortcut: "selectWithShortcut", custom: "custom" }, outputs: { selectedItemsChange: "selectedItemsChange", select: "select", itemSelected: "itemSelected", itemDeselected: "itemDeselected", selectionStarted: "selectionStarted", selectionEnded: "selectionEnded" }, host: { properties: { "class.dts-custom": "this.custom", "class.dts-select-container": "this.hostClass" } }, queries: [{ propertyName: "$selectableItems", predicate: SelectItemDirective, descendants: true }], viewQueries: [{ propertyName: "$selectBox", first: true, predicate: ["selectBox"], descendants: true, static: true }], exportAs: ["dts-select-container"], ngImport: i0, template: `
    <ng-content></ng-content>
    <div
      class="dts-select-box"
      #selectBox
      [ngClass]="selectBoxClasses$ | async"
      [ngStyle]="selectBoxStyles$ | async"
    ></div>
  `, isInline: true, styles: [":host{display:block;position:relative}\n"], directives: [{ type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }], pipes: { "async": i3.AsyncPipe } });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectContainerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'dts-select-container', exportAs: 'dts-select-container', template: `
    <ng-content></ng-content>
    <div
      class="dts-select-box"
      #selectBox
      [ngClass]="selectBoxClasses$ | async"
      [ngStyle]="selectBoxStyles$ | async"
    ></div>
  `, styles: [":host{display:block;position:relative}\n"] }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i1.ShortcutService }, { type: i2.KeyboardEventsService }, { type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i0.NgZone }]; }, propDecorators: { $selectBox: [{
                type: ViewChild,
                args: ['selectBox', { static: true }]
            }], $selectableItems: [{
                type: ContentChildren,
                args: [SelectItemDirective, { descendants: true }]
            }], selectedItems: [{
                type: Input
            }], selectOnDrag: [{
                type: Input
            }], disabled: [{
                type: Input
            }], disableDrag: [{
                type: Input
            }], selectOnClick: [{
                type: Input
            }], dragOverItems: [{
                type: Input
            }], disableRangeSelection: [{
                type: Input
            }], selectMode: [{
                type: Input
            }], selectWithShortcut: [{
                type: Input
            }], custom: [{
                type: Input
            }, {
                type: HostBinding,
                args: ['class.dts-custom']
            }], hostClass: [{
                type: HostBinding,
                args: ['class.dts-select-container']
            }], selectedItemsChange: [{
                type: Output
            }], select: [{
                type: Output
            }], itemSelected: [{
                type: Output
            }], itemDeselected: [{
                type: Output
            }], selectionStarted: [{
                type: Output
            }], selectionEnded: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LWNvbnRhaW5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZHJhZy10by1zZWxlY3Qvc3JjL2xpYi9zZWxlY3QtY29udGFpbmVyLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sWUFBWSxFQUNaLEtBQUssRUFFTCxTQUFTLEVBQ1QsU0FBUyxFQUNULE1BQU0sRUFDTixlQUFlLEVBQ2YsU0FBUyxFQUNULFdBQVcsRUFFWCxXQUFXLEVBQ1gsTUFBTSxHQUVQLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXBELE9BQU8sRUFBYyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFFbkgsT0FBTyxFQUNMLFNBQVMsRUFDVCxTQUFTLEVBQ1QsR0FBRyxFQUNILEdBQUcsRUFDSCxNQUFNLEVBQ04sU0FBUyxFQUNULEtBQUssRUFDTCxLQUFLLEVBQ0wsY0FBYyxFQUNkLG9CQUFvQixFQUNwQixTQUFTLEVBQ1QsU0FBUyxFQUNULFdBQVcsRUFDWCxLQUFLLEdBQ04sTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUNwRixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFckQsT0FBTyxFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBcUIsTUFBTSxhQUFhLENBQUM7QUFFdkYsT0FBTyxFQUNMLE1BQU0sRUFLTixhQUFhLEdBR2QsTUFBTSxVQUFVLENBQUM7QUFFbEIsT0FBTyxFQUFFLFVBQVUsRUFBRSxlQUFl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QWE7c0JBQXJCLEtBQUs7Z0JBQ0cscUJBQXFCO3NCQUE3QixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csa0JBQWtCO3NCQUExQixLQUFLO2dCQUlOLE1BQU07c0JBRkwsS0FBSzs7c0JBQ0wsV0FBVzt1QkFBQyxrQkFBa0I7Z0JBSXRCLFNBQVM7c0JBRGpCLFdBQVc7dUJBQUMsNEJBQTRCO2dCQUl6QyxtQkFBbUI7c0JBRGxCLE1BQU07Z0JBRUcsTUFBTTtzQkFBZixNQUFNO2dCQUNHLFlBQVk7c0JBQXJCLE1BQU07Z0JBQ0csY0FBYztzQkFBdkIsTUFBTTtnQkFDRyxnQkFBZ0I7c0JBQXpCLE1BQU07Z0JBQ0csY0FBYztzQkFBdkIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgQ29tcG9uZW50LFxyXG4gIEVsZW1lbnRSZWYsXHJcbiAgT3V0cHV0LFxyXG4gIEV2ZW50RW1pdHRlcixcclxuICBJbnB1dCxcclxuICBPbkRlc3Ryb3ksXHJcbiAgUmVuZGVyZXIyLFxyXG4gIFZpZXdDaGlsZCxcclxuICBOZ1pvbmUsXHJcbiAgQ29udGVudENoaWxkcmVuLFxyXG4gIFF1ZXJ5TGlzdCxcclxuICBIb3N0QmluZGluZyxcclxuICBBZnRlclZpZXdJbml0LFxyXG4gIFBMQVRGT1JNX0lELFxyXG4gIEluamVjdCxcclxuICBBZnRlckNvbnRlbnRJbml0LFxyXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5cclxuaW1wb3J0IHsgaXNQbGF0Zm9ybUJyb3dzZXIgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgY29tYmluZUxhdGVzdCwgbWVyZ2UsIGZyb20sIGZyb21FdmVudCwgQmVoYXZpb3JTdWJqZWN0LCBhc3luY1NjaGVkdWxlciB9IGZyb20gJ3J4anMnO1xyXG5cclxuaW1wb3J0IHtcclxuICBzd2l0Y2hNYXAsXHJcbiAgdGFrZVVudGlsLFxyXG4gIG1hcCxcclxuICB0YXAsXHJcbiAgZmlsdGVyLFxyXG4gIGF1ZGl0VGltZSxcclxuICBtYXBUbyxcclxuICBzaGFyZSxcclxuICB3aXRoTGF0ZXN0RnJvbSxcclxuICBkaXN0aW5jdFVudGlsQ2hhbmdlZCxcclxuICBvYnNlcnZlT24sXHJcbiAgc3RhcnRXaXRoLFxyXG4gIGNvbmNhdE1hcFRvLFxyXG4gIGZpcnN0LFxyXG59IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuXHJcbmltcG9ydCB7IFNlbGVjdEl0ZW1EaXJlY3RpdmUsIFNFTEVDVF9JVEVNX0lOU1RBTkNFIH0gZnJvbSAnLi9zZWxlY3QtaXRlbS5kaXJlY3RpdmUnO1xyXG5pbXBvcnQgeyBTaG9ydGN1dFNlcnZpY2UgfSBmcm9tICcuL3Nob3J0Y3V0LnNlcnZpY2UnO1xyXG5cclxuaW1wb3J0IHsgY3JlYXRlU2VsZWN0Qm94LCB3aGVuU2VsZWN0Qm94VmlzaWJsZSwgZGlzdGluY3RLZXlFdmVudHMgfSBmcm9tICcuL29wZXJhdG9ycyc7XHJcblxyXG5pbXBvcnQge1xyXG4gIEFjdGlvbixcclxuICBTZWxlY3RCb3gsXHJcbiAgTW91c2VQb3NpdGlvbixcclxuICBTZWxlY3RDb250YWluZXJIb3N0LFxyXG4gIFVwZGF0ZUFjdGlvbixcclxuICBVcGRhdGVBY3Rpb25zLFxyXG4gIFByZWRpY2F0ZUZuLFxyXG4gIEJvdW5kaW5nQm94LFxyXG59IGZyb20gJy4vbW9kZWxzJztcclxuXHJcbmltcG9ydCB7IEFVRElUX1RJTUUsIE5PX1NFTEVDVF9DTEFTUyB9IGZyb20gJy4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCB7XHJcbiAgaW5Cb3VuZGluZ0JveCxcclxuICBjdXJzb3JXaXRoaW5FbGVtZW50LFxyXG4gIGNsZWFyU2VsZWN0aW9uLFxyXG4gIGJveEludGVyc2VjdHMsXHJcbiAgY2FsY3VsYXRlQm91bmRpbmdDbGllbnRSZWN0LFxyXG4gIGdldFJlbGF0aXZlTW91c2VQb3NpdGlvbixcclxuICBnZXRNb3VzZVBvc2l0aW9uLFxyXG4gIGhhc01pbmltdW1TaXplLFxyXG59IGZyb20gJy4vdXRpbHMnO1xyXG5pbXBvcnQgeyBLZXlib2FyZEV2ZW50c1NlcnZpY2UgfSBmcm9tICcuL2tleWJvYXJkLWV2ZW50cy5zZXJ2aWNlJztcclxuXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnZHRzLXNlbGVjdC1jb250YWluZXInLFxyXG4gIGV4cG9ydEFzOiAnZHRzLXNlbGVjdC1jb250YWluZXInLFxyXG4gIHRlbXBsYXRlOiBgXHJcbiAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XHJcbiAgICA8ZGl2XHJcbiAgICAgIGNsYXNzPVwiZHRzLXNlbGVjdC1ib3hcIlxyXG4gICAgICAjc2VsZWN0Qm94XHJcbiAgICAgIFtuZ0NsYXNzXT1cInNlbGVjdEJveENsYXNzZXMkIHwgYXN5bmNcIlxyXG4gICAgICBbbmdTdHlsZV09XCJzZWxlY3RCb3hTdHlsZXMkIHwgYXN5bmNcIlxyXG4gICAgPjwvZGl2PlxyXG4gIGAsXHJcbiAgc3R5bGVVcmxzOiBbJy4vc2VsZWN0LWNvbnRhaW5lci5jb21wb25lbnQuc2NzcyddLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgU2VsZWN0Q29udGFpbmVyQ29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95LCBBZnRlckNvbnRlbnRJbml0IHtcclxuICBob3N0OiBTZWxlY3RDb250YWluZXJIb3N0O1xyXG4gIHNlbGVjdEJveFN0eWxlcyQ6IE9ic2VydmFibGU8U2VsZWN0Qm94PHN0cmluZz4+O1xyXG4gIHNlbGVjdEJveENsYXNzZXMkOiBPYnNlcnZhYmxlPHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9PjtcclxuXHJcbiAgQFZpZXdDaGlsZCgnc2VsZWN0Qm94JywgeyBzdGF0aWM6IHRydWUgfSlcclxuICBwcml2YXRlICRzZWxlY3RCb3g6IEVsZW1lbnRSZWY7XHJcblxyXG4gIEBDb250ZW50Q2hpbGRyZW4oU2VsZWN0SXRlbURpcmVjdGl2ZSwgeyBkZXNjZW5kYW50czogdHJ1ZSB9KVxyXG4gIHByaXZhdGUgJHNlbGVjdGFibGVJdGVtczogUXVlcnlMaXN0PFNlbGVjdEl0ZW1EaXJlY3RpdmU+O1xyXG5cclxuICBASW5wdXQoKSBzZWxlY3RlZEl0ZW1zOiBhbnk7XHJcbiAgQElucHV0KCkgc2VsZWN0T25EcmFnID0gdHJ1ZTtcclxuICBASW5wdXQoKSBkaXNhYmxlZCA9IGZhbHNlO1xyXG4gIEBJbnB1dCgpIGRpc2FibGVEcmFnID0gZmFsc2U7XHJcbiAgQElucHV0KCkgc2VsZWN0T25DbGljayA9IHRydWU7XHJcbiAgQElucHV0KCkgZHJhZ092ZXJJdGVtcyA9IHRydWU7XHJcbiAgQElucHV0KCkgZGlzYWJsZVJhbmdlU2VsZWN0aW9uID0gZmFsc2U7XHJcbiAgQElucHV0KCkgc2VsZWN0TW9kZSA9IGZhbHNlO1xyXG4gIEBJbnB1dCgpIHNlbGVjdFdpdGhTaG9ydGN1dCA9IGZhbHNlO1xyXG5cclxuICBASW5wdXQoKVxyXG4gIEBIb3N0QmluZGluZygnY2xhc3MuZHRzLWN1c3RvbScpXHJcbiAgY3VzdG9tID0gZmFsc2U7XHJcblxyXG4gIEBIb3N0QmluZGluZygnY2xhc3MuZHRzLXNlbGVjdC1jb250YWluZXInKVxyXG4gIHJlYWRvbmx5IGhvc3RDbGFzcyA9IHRydWU7XHJcblxyXG4gIEBPdXRwdXQoKVxyXG4gIHNlbGVjdGVkSXRlbXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcclxuICBAT3V0cHV0KCkgc2VsZWN0ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XHJcbiAgQE91dHB1dCgpIGl0ZW1TZWxlY3RlZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xyXG4gIEBPdXRwdXQoKSBpdGVtRGVzZWxlY3RlZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xyXG4gIEBPdXRwdXQoKSBzZWxlY3Rpb25TdGFydGVkID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG4gIEBPdXRwdXQoKSBzZWxlY3Rpb25FbmRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8QXJyYXk8YW55Pj4oKTtcclxuXHJcbiAgcHJpdmF0ZSBfdG1wSXRlbXMgPSBuZXcgTWFwPFNlbGVjdEl0ZW1EaXJlY3RpdmUsIEFjdGlvbj4oKTtcclxuXHJcbiAgcHJpdmF0ZSBfc2VsZWN0ZWRJdGVtcyQgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PEFycmF5PGFueT4+KFtdKTtcclxuICBwcml2YXRlIF9zZWxlY3RhYmxlSXRlbXM6IEFycmF5PFNlbGVjdEl0ZW1EaXJlY3RpdmU+ID0gW107XHJcbiAgcHJpdmF0ZSB1cGRhdGVJdGVtcyQgPSBuZXcgU3ViamVjdDxVcGRhdGVBY3Rpb24+KCk7XHJcbiAgcHJpdmF0ZSBkZXN0cm95JCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XHJcblxyXG4gIHByaXZhdGUgX2xhc3RSYW5nZTogW251bWJlciwgbnVtYmVyXSA9IFstMSwgLTFdO1xyXG4gIHByaXZhdGUgX2xhc3RTdGFydEluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBfbmV3UmFuZ2VTdGFydCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX2xhc3RSYW5nZVNlbGVjdGlvbjogTWFwPFNlbGVjdEl0ZW1EaXJlY3RpdmUsIGJvb2xlYW4+ID0gbmV3IE1hcCgpO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXHJcbiAgICBwcml2YXRlIHNob3J0Y3V0czogU2hvcnRjdXRTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBrZXlib2FyZEV2ZW50czogS2V5Ym9hcmRFdmVudHNTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBob3N0RWxlbWVudFJlZjogRWxlbWVudFJlZixcclxuICAgIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMixcclxuICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmVcclxuICApIHt9XHJcblxyXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcclxuICAgIGlmIChpc1BsYXRmb3JtQnJvd3Nlcih0aGlzLnBsYXRmb3JtSWQpKSB7XHJcbiAgICAgIHRoaXMuaG9zdCA9IHRoaXMuaG9zdEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcclxuXHJcbiAgICAgIHRoaXMuX2luaXRTZWxlY3RlZEl0ZW1zQ2hhbmdlKCk7XHJcblxyXG4gICAgICB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgdGhpcy5fb2JzZXJ2ZUJvdW5kaW5nUmVjdENoYW5nZXMoKTtcclxuICAgICAgdGhpcy5fb2JzZXJ2ZVNlbGVjdGFibGVJdGVtcygpO1xyXG5cclxuICAgICAgY29uc3QgbW91c2V1cCQgPSB0aGlzLmtleWJvYXJkRXZlbnRzLm1vdXNldXAkLnBpcGUoXHJcbiAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLmRpc2FibGVkKSxcclxuICAgICAgICB0YXAoKCkgPT4gdGhpcy5fb25Nb3VzZVVwKCkpLFxyXG4gICAgICAgIHNoYXJlKClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IG1vdXNlbW92ZSQgPSB0aGlzLmtleWJvYXJkRXZlbnRzLm1vdXNlbW92ZSQucGlwZShcclxuICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuZGlzYWJsZWQpLFxyXG4gICAgICAgIHNoYXJlKClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IG1vdXNlZG93biQgPSBmcm9tRXZlbnQ8TW91c2VFdmVudD4odGhpcy5ob3N0LCAnbW91c2Vkb3duJykucGlwZShcclxuICAgICAgICBmaWx0ZXIoKGV2ZW50KSA9PiBldmVudC5idXR0b24gPT09IDApLCAvLyBvbmx5IGVtaXQgbGVmdCBtb3VzZVxyXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5kaXNhYmxlZCksXHJcbiAgICAgICAgZmlsdGVyKChldmVudCkgPT4gdGhpcy5zZWxlY3RPbkNsaWNrIHx8IGV2ZW50LnRhcmdldCA9PT0gdGhpcy5ob3N0KSxcclxuICAgICAgICB0YXAoKGV2ZW50KSA9PiB0aGlzLl9vbk1vdXNlRG93bihldmVudCkpLFxyXG4gICAgICAgIHNoYXJlKClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IGRyYWdnaW5nJCA9IG1vdXNlZG93biQucGlwZShcclxuICAgICAgICBmaWx0ZXIoKGV2ZW50KSA9PiAhdGhpcy5zaG9ydGN1dHMuZGlzYWJsZVNlbGVjdGlvbihldmVudCkpLFxyXG4gICAgICAgIC8vIGZpbHRlcigoKSA9PiAhdGhpcy5zZWxlY3RNb2RlKSxcclxuICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuZGlzYWJsZURyYWcpLFxyXG4gICAgICAgIGZpbHRlcigoZXZlbnQpID0+IHRoaXMuZHJhZ092ZXJJdGVtcyB8fCBldmVudC50YXJnZXQgPT09IHRoaXMuaG9zdCksXHJcbiAgICAgICAgc3dpdGNoTWFwKCgpID0+IG1vdXNlbW92ZSQucGlwZSh0YWtlVW50aWwobW91c2V1cCQpKSksXHJcbiAgICAgICAgc2hhcmUoKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3QgY3VycmVudE1vdXNlUG9zaXRpb24kOiBPYnNlcnZhYmxlPE1vdXNlUG9zaXRpb24+ID0gbW91c2Vkb3duJC5waXBlKFxyXG4gICAgICAgIG1hcCgoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IGdldFJlbGF0aXZlTW91c2VQb3NpdGlvbihldmVudCwgdGhpcy5ob3N0KSlcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IHNob3ckID0gZHJhZ2dpbmckLnBpcGUobWFwVG8oMSkpO1xyXG4gICAgICBjb25zdCBoaWRlJCA9IG1vdXNldXAkLnBpcGUobWFwVG8oMCkpO1xyXG4gICAgICBjb25zdCBvcGFjaXR5JCA9IG1lcmdlKHNob3ckLCBoaWRlJCkucGlwZShkaXN0aW5jdFVudGlsQ2hhbmdlZCgpKTtcclxuXHJcbiAgICAgIGNvbnN0IHNlbGVjdEJveCQgPSBjb21iaW5lTGF0ZXN0KFtkcmFnZ2luZyQsIG9wYWNpdHkkLCBjdXJyZW50TW91c2VQb3NpdGlvbiRdKS5waXBlKFxyXG4gICAgICAgIGNyZWF0ZVNlbGVjdEJveCh0aGlzLmhvc3QpLFxyXG4gICAgICAgIHNoYXJlKClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHRoaXMuc2VsZWN0Qm94Q2xhc3NlcyQgPSBtZXJnZShcclxuICAgICAgICBkcmFnZ2luZyQsXHJcbiAgICAgICAgbW91c2V1cCQsXHJcbiAgICAgICAgdGhpcy5rZXlib2FyZEV2ZW50cy5kaXN0aW5jdEtleWRvd24kLFxyXG4gICAgICAgIHRoaXMua2V5Ym9hcmRFdmVudHMuZGlzdGluY3RLZXl1cCRcclxuICAgICAgKS5waXBlKFxyXG4gICAgICAgIGF1ZGl0VGltZShBVURJVF9USU1FKSxcclxuICAgICAgICB3aXRoTGF0ZXN0RnJvbShzZWxlY3RCb3gkKSxcclxuICAgICAgICBtYXAoKFtldmVudCwgc2VsZWN0Qm94XSkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgJ2R0cy1hZGRpbmcnOiBoYXNNaW5pbXVtU2l6ZShzZWxlY3RCb3gsIDAsIDApICYmICF0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSxcclxuICAgICAgICAgICAgJ2R0cy1yZW1vdmluZyc6IHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9KSxcclxuICAgICAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgoYSwgYikgPT4gSlNPTi5zdHJpbmdpZnkoYSkgPT09IEpTT04uc3RyaW5naWZ5KGIpKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3Qgc2VsZWN0T25Nb3VzZVVwJCA9IGRyYWdnaW5nJC5waXBlKFxyXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5zZWxlY3RPbkRyYWcpLFxyXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5zZWxlY3RNb2RlKSxcclxuICAgICAgICBmaWx0ZXIoKGV2ZW50KSA9PiB0aGlzLl9jdXJzb3JXaXRoaW5Ib3N0KGV2ZW50KSksXHJcbiAgICAgICAgc3dpdGNoTWFwKChfKSA9PiBtb3VzZXVwJC5waXBlKGZpcnN0KCkpKSxcclxuICAgICAgICBmaWx0ZXIoXHJcbiAgICAgICAgICAoZXZlbnQpID0+XHJcbiAgICAgICAgICAgICghdGhpcy5zaG9ydGN1dHMuZGlzYWJsZVNlbGVjdGlvbihldmVudCkgJiYgIXRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpKSB8fFxyXG4gICAgICAgICAgICB0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IHNlbGVjdE9uRHJhZyQgPSBzZWxlY3RCb3gkLnBpcGUoXHJcbiAgICAgICAgYXVkaXRUaW1lKEFVRElUX1RJTUUpLFxyXG4gICAgICAgIHdpdGhMYXRlc3RGcm9tKG1vdXNlbW92ZSQsIChzZWxlY3RCb3gsIGV2ZW50OiBNb3VzZUV2ZW50KSA9PiAoe1xyXG4gICAgICAgICAgc2VsZWN0Qm94LFxyXG4gICAgICAgICAgZXZlbnQsXHJcbiAgICAgICAgfSkpLFxyXG4gICAgICAgIGZpbHRlcigoKSA9PiB0aGlzLnNlbGVjdE9uRHJhZyksXHJcbiAgICAgICAgZmlsdGVyKCh7IHNlbGVjdEJveCB9KSA9PiBoYXNNaW5pbXVtU2l6ZShzZWxlY3RCb3gpKSxcclxuICAgICAgICBtYXAoKHsgZXZlbnQgfSkgPT4gZXZlbnQpXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBjb25zdCBzZWxlY3RPbktleWJvYXJkRXZlbnQkID0gbWVyZ2UoXHJcbiAgICAgICAgdGhpcy5rZXlib2FyZEV2ZW50cy5kaXN0aW5jdEtleWRvd24kLFxyXG4gICAgICAgIHRoaXMua2V5Ym9hcmRFdmVudHMuZGlzdGluY3RLZXl1cCRcclxuICAgICAgKS5waXBlKFxyXG4gICAgICAgIGF1ZGl0VGltZShBVURJVF9USU1FKSxcclxuICAgICAgICB3aGVuU2VsZWN0Qm94VmlzaWJsZShzZWxlY3RCb3gkKSxcclxuICAgICAgICB0YXAoKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICBpZiAodGhpcy5faXNFeHRlbmRlZFNlbGVjdGlvbihldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5fdG1wSXRlbXMuY2xlYXIoKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZsdXNoSXRlbXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG5cclxuICAgICAgbWVyZ2Uoc2VsZWN0T25Nb3VzZVVwJCwgc2VsZWN0T25EcmFnJCwgc2VsZWN0T25LZXlib2FyZEV2ZW50JClcclxuICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpXHJcbiAgICAgICAgLnN1YnNjcmliZSgoZXZlbnQpID0+IHRoaXMuX3NlbGVjdEl0ZW1zKGV2ZW50KSk7XHJcblxyXG4gICAgICB0aGlzLnNlbGVjdEJveFN0eWxlcyQgPSBzZWxlY3RCb3gkLnBpcGUoXHJcbiAgICAgICAgbWFwKChzZWxlY3RCb3gpID0+ICh7XHJcbiAgICAgICAgICB0b3A6IGAke3NlbGVjdEJveC50b3B9cHhgLFxyXG4gICAgICAgICAgbGVmdDogYCR7c2VsZWN0Qm94LmxlZnR9cHhgLFxyXG4gICAgICAgICAgd2lkdGg6IGAke3NlbGVjdEJveC53aWR0aH1weGAsXHJcbiAgICAgICAgICBoZWlnaHQ6IGAke3NlbGVjdEJveC5oZWlnaHR9cHhgLFxyXG4gICAgICAgICAgb3BhY2l0eTogc2VsZWN0Qm94Lm9wYWNpdHksXHJcbiAgICAgICAgfSkpXHJcbiAgICAgICk7XHJcblxyXG4gICAgICB0aGlzLl9pbml0U2VsZWN0aW9uT3V0cHV0cyhtb3VzZWRvd24kLCBtb3VzZXVwJCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RhYmxlSXRlbXMgPSB0aGlzLiRzZWxlY3RhYmxlSXRlbXMudG9BcnJheSgpO1xyXG4gIH1cclxuXHJcbiAgc2VsZWN0QWxsKCkge1xyXG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgdGhpcy5fc2VsZWN0SXRlbShpdGVtKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdG9nZ2xlSXRlbXM8VD4ocHJlZGljYXRlOiBQcmVkaWNhdGVGbjxUPikge1xyXG4gICAgdGhpcy5fZmlsdGVyU2VsZWN0YWJsZUl0ZW1zKHByZWRpY2F0ZSkuc3Vic2NyaWJlKChpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlKSA9PiB0aGlzLl90b2dnbGVJdGVtKGl0ZW0pKTtcclxuICB9XHJcblxyXG4gIHNlbGVjdEl0ZW1zPFQ+KHByZWRpY2F0ZTogUHJlZGljYXRlRm48VD4pIHtcclxuICAgIHRoaXMuX2ZpbHRlclNlbGVjdGFibGVJdGVtcyhwcmVkaWNhdGUpLnN1YnNjcmliZSgoaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkgPT4gdGhpcy5fc2VsZWN0SXRlbShpdGVtKSk7XHJcbiAgfVxyXG5cclxuICBkZXNlbGVjdEl0ZW1zPFQ+KHByZWRpY2F0ZTogUHJlZGljYXRlRm48VD4pIHtcclxuICAgIHRoaXMuX2ZpbHRlclNlbGVjdGFibGVJdGVtcyhwcmVkaWNhdGUpLnN1YnNjcmliZSgoaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkgPT4gdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pKTtcclxuICB9XHJcblxyXG4gIGNsZWFyU2VsZWN0aW9uKCkge1xyXG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB1cGRhdGUoKSB7XHJcbiAgICB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLmNhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcclxuICB9XHJcblxyXG4gIG5nT25EZXN0cm95KCkge1xyXG4gICAgdGhpcy5kZXN0cm95JC5uZXh0KCk7XHJcbiAgICB0aGlzLmRlc3Ryb3kkLmNvbXBsZXRlKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9maWx0ZXJTZWxlY3RhYmxlSXRlbXM8VD4ocHJlZGljYXRlOiBQcmVkaWNhdGVGbjxUPikge1xyXG4gICAgLy8gV3JhcCBzZWxlY3QgaXRlbXMgaW4gYW4gb2JzZXJ2YWJsZSBmb3IgYmV0dGVyIGVmZmljaWVuY3kgYXNcclxuICAgIC8vIG5vIGludGVybWVkaWF0ZSBhcnJheXMgYXJlIGNyZWF0ZWQgYW5kIHdlIG9ubHkgbmVlZCB0byBwcm9jZXNzXHJcbiAgICAvLyBldmVyeSBpdGVtIG9uY2UuXHJcbiAgICByZXR1cm4gZnJvbSh0aGlzLl9zZWxlY3RhYmxlSXRlbXMpLnBpcGUoZmlsdGVyKChpdGVtKSA9PiBwcmVkaWNhdGUoaXRlbS52YWx1ZSkpKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2luaXRTZWxlY3RlZEl0ZW1zQ2hhbmdlKCkge1xyXG4gICAgdGhpcy5fc2VsZWN0ZWRJdGVtcyQucGlwZShhdWRpdFRpbWUoQVVESVRfVElNRSksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSkuc3Vic2NyaWJlKHtcclxuICAgICAgbmV4dDogKHNlbGVjdGVkSXRlbXMpID0+IHtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbXNDaGFuZ2UuZW1pdChzZWxlY3RlZEl0ZW1zKTtcclxuICAgICAgICB0aGlzLnNlbGVjdC5lbWl0KHNlbGVjdGVkSXRlbXMpO1xyXG4gICAgICB9LFxyXG4gICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtc0NoYW5nZS5lbWl0KFtdKTtcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfb2JzZXJ2ZVNlbGVjdGFibGVJdGVtcygpIHtcclxuICAgIC8vIExpc3RlbiBmb3IgdXBkYXRlcyBhbmQgZWl0aGVyIHNlbGVjdCBvciBkZXNlbGVjdCBhbiBpdGVtXHJcbiAgICB0aGlzLnVwZGF0ZUl0ZW1zJFxyXG4gICAgICAucGlwZShcclxuICAgICAgICB3aXRoTGF0ZXN0RnJvbSh0aGlzLl9zZWxlY3RlZEl0ZW1zJCksXHJcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveSQpLFxyXG4gICAgICAgIGZpbHRlcigoW3VwZGF0ZV0pID0+ICF1cGRhdGUuaXRlbS5kdHNEaXNhYmxlZClcclxuICAgICAgKVxyXG4gICAgICAuc3Vic2NyaWJlKChbdXBkYXRlLCBzZWxlY3RlZEl0ZW1zXTogW1VwZGF0ZUFjdGlvbiwgYW55W11dKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHVwZGF0ZS5pdGVtO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHVwZGF0ZS50eXBlKSB7XHJcbiAgICAgICAgICBjYXNlIFVwZGF0ZUFjdGlvbnMuQWRkOlxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYWRkSXRlbShpdGVtLCBzZWxlY3RlZEl0ZW1zKSkge1xyXG4gICAgICAgICAgICAgIGl0ZW0uX3NlbGVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSBVcGRhdGVBY3Rpb25zLlJlbW92ZTpcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3JlbW92ZUl0ZW0oaXRlbSwgc2VsZWN0ZWRJdGVtcykpIHtcclxuICAgICAgICAgICAgICBpdGVtLl9kZXNlbGVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRoZSBjb250YWluZXIgYXMgd2VsbCBhcyBhbGwgc2VsZWN0YWJsZSBpdGVtcyBpZiB0aGUgbGlzdCBoYXMgY2hhbmdlZFxyXG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmNoYW5nZXNcclxuICAgICAgLnBpcGUod2l0aExhdGVzdEZyb20odGhpcy5fc2VsZWN0ZWRJdGVtcyQpLCBvYnNlcnZlT24oYXN5bmNTY2hlZHVsZXIpLCB0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpXHJcbiAgICAgIC5zdWJzY3JpYmUoKFtpdGVtcywgc2VsZWN0ZWRJdGVtc106IFtRdWVyeUxpc3Q8U2VsZWN0SXRlbURpcmVjdGl2ZT4sIGFueVtdXSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IG5ld0xpc3QgPSBpdGVtcy50b0FycmF5KCk7XHJcbiAgICAgICAgdGhpcy5fc2VsZWN0YWJsZUl0ZW1zID0gbmV3TGlzdDtcclxuICAgICAgICBjb25zdCBuZXdWYWx1ZXMgPSBuZXdMaXN0Lm1hcCgoaXRlbSkgPT4gaXRlbS52YWx1ZSk7XHJcbiAgICAgICAgY29uc3QgcmVtb3ZlZEl0ZW1zID0gc2VsZWN0ZWRJdGVtcy5maWx0ZXIoKGl0ZW0pID0+ICFuZXdWYWx1ZXMuaW5jbHVkZXMoaXRlbSkpO1xyXG5cclxuICAgICAgICBpZiAocmVtb3ZlZEl0ZW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgcmVtb3ZlZEl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHRoaXMuX3JlbW92ZUl0ZW0oaXRlbSwgc2VsZWN0ZWRJdGVtcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGUoKTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9vYnNlcnZlQm91bmRpbmdSZWN0Q2hhbmdlcygpIHtcclxuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcclxuICAgICAgY29uc3QgcmVzaXplJCA9IGZyb21FdmVudCh3aW5kb3csICdyZXNpemUnKTtcclxuICAgICAgY29uc3Qgd2luZG93U2Nyb2xsJCA9IGZyb21FdmVudCh3aW5kb3csICdzY3JvbGwnKTtcclxuICAgICAgY29uc3QgY29udGFpbmVyU2Nyb2xsJCA9IGZyb21FdmVudCh0aGlzLmhvc3QsICdzY3JvbGwnKTtcclxuXHJcbiAgICAgIG1lcmdlKHJlc2l6ZSQsIHdpbmRvd1Njcm9sbCQsIGNvbnRhaW5lclNjcm9sbCQpXHJcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKCdJTklUSUFMX1VQREFURScpLCBhdWRpdFRpbWUoQVVESVRfVElNRSksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSlcclxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2luaXRTZWxlY3Rpb25PdXRwdXRzKG1vdXNlZG93biQ6IE9ic2VydmFibGU8TW91c2VFdmVudD4sIG1vdXNldXAkOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+KSB7XHJcbiAgICBtb3VzZWRvd24kXHJcbiAgICAgIC5waXBlKFxyXG4gICAgICAgIGZpbHRlcigoZXZlbnQpID0+IHRoaXMuX2N1cnNvcldpdGhpbkhvc3QoZXZlbnQpKSxcclxuICAgICAgICB0YXAoKCkgPT4gdGhpcy5zZWxlY3Rpb25TdGFydGVkLmVtaXQoKSksXHJcbiAgICAgICAgY29uY2F0TWFwVG8obW91c2V1cCQucGlwZShmaXJzdCgpKSksXHJcbiAgICAgICAgd2l0aExhdGVzdEZyb20odGhpcy5fc2VsZWN0ZWRJdGVtcyQpLFxyXG4gICAgICAgIG1hcCgoWywgaXRlbXNdKSA9PiBpdGVtcyksXHJcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveSQpXHJcbiAgICAgIClcclxuICAgICAgLnN1YnNjcmliZSgoaXRlbXMpID0+IHtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbkVuZGVkLmVtaXQoaXRlbXMpO1xyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2NhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCgpIHtcclxuICAgIHRoaXMuaG9zdC5ib3VuZGluZ0NsaWVudFJlY3QgPSBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QodGhpcy5ob3N0KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2N1cnNvcldpdGhpbkhvc3QoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgIHJldHVybiBjdXJzb3JXaXRoaW5FbGVtZW50KGV2ZW50LCB0aGlzLmhvc3QpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfb25Nb3VzZVVwKCkge1xyXG4gICAgdGhpcy5fZmx1c2hJdGVtcygpO1xyXG4gICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyhkb2N1bWVudC5ib2R5LCBOT19TRUxFQ1RfQ0xBU1MpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfb25Nb3VzZURvd24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICh0aGlzLnNob3J0Y3V0cy5kaXNhYmxlU2VsZWN0aW9uKGV2ZW50KSB8fCB0aGlzLmRpc2FibGVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhclNlbGVjdGlvbih3aW5kb3cpO1xyXG5cclxuICAgIGlmICghdGhpcy5kaXNhYmxlRHJhZykge1xyXG4gICAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKGRvY3VtZW50LmJvZHksIE5PX1NFTEVDVF9DTEFTUyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtb3VzZVBvaW50ID0gZ2V0TW91c2VQb3NpdGlvbihldmVudCk7XHJcbiAgICBjb25zdCBbY3VycmVudEluZGV4LCBjbGlja2VkSXRlbV0gPSB0aGlzLl9nZXRDbG9zZXN0U2VsZWN0SXRlbShldmVudCk7XHJcblxyXG4gICAgbGV0IFtzdGFydEluZGV4LCBlbmRJbmRleF0gPSB0aGlzLl9sYXN0UmFuZ2U7XHJcblxyXG4gICAgY29uc3QgaXNNb3ZlUmFuZ2VTdGFydCA9IHRoaXMuc2hvcnRjdXRzLm1vdmVSYW5nZVN0YXJ0KGV2ZW50KTtcclxuXHJcbiAgICBjb25zdCBzaG91bGRSZXNldFJhbmdlU2VsZWN0aW9uID1cclxuICAgICAgIXRoaXMuc2hvcnRjdXRzLmV4dGVuZGVkU2VsZWN0aW9uU2hvcnRjdXQoZXZlbnQpIHx8IGlzTW92ZVJhbmdlU3RhcnQgfHwgdGhpcy5kaXNhYmxlUmFuZ2VTZWxlY3Rpb247XHJcblxyXG4gICAgaWYgKHNob3VsZFJlc2V0UmFuZ2VTZWxlY3Rpb24pIHtcclxuICAgICAgdGhpcy5fcmVzZXRSYW5nZVN0YXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbW92ZSByYW5nZSBzdGFydFxyXG4gICAgaWYgKHNob3VsZFJlc2V0UmFuZ2VTZWxlY3Rpb24gJiYgIXRoaXMuZGlzYWJsZVJhbmdlU2VsZWN0aW9uKSB7XHJcbiAgICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xyXG4gICAgICAgIHRoaXMuX25ld1JhbmdlU3RhcnQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX2xhc3RTdGFydEluZGV4ID0gY3VycmVudEluZGV4O1xyXG4gICAgICAgIGNsaWNrZWRJdGVtLnRvZ2dsZVJhbmdlU3RhcnQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fbGFzdFJhbmdlU2VsZWN0aW9uLmNsZWFyKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fbGFzdFN0YXJ0SW5kZXggPSAtMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xyXG4gICAgICBzdGFydEluZGV4ID0gTWF0aC5taW4odGhpcy5fbGFzdFN0YXJ0SW5kZXgsIGN1cnJlbnRJbmRleCk7XHJcbiAgICAgIGVuZEluZGV4ID0gTWF0aC5tYXgodGhpcy5fbGFzdFN0YXJ0SW5kZXgsIGN1cnJlbnRJbmRleCk7XHJcbiAgICAgIHRoaXMuX2xhc3RSYW5nZSA9IFtzdGFydEluZGV4LCBlbmRJbmRleF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzTW92ZVJhbmdlU3RhcnQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtUmVjdCA9IGl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgIGNvbnN0IHdpdGhpbkJvdW5kaW5nQm94ID0gaW5Cb3VuZGluZ0JveChtb3VzZVBvaW50LCBpdGVtUmVjdCk7XHJcblxyXG4gICAgICBpZiAodGhpcy5zaG9ydGN1dHMuZXh0ZW5kZWRTZWxlY3Rpb25TaG9ydGN1dChldmVudCkgJiYgdGhpcy5kaXNhYmxlUmFuZ2VTZWxlY3Rpb24pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHdpdGhpblJhbmdlID1cclxuICAgICAgICB0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJlxyXG4gICAgICAgIHN0YXJ0SW5kZXggPiAtMSAmJlxyXG4gICAgICAgIGVuZEluZGV4ID4gLTEgJiZcclxuICAgICAgICBpbmRleCA+PSBzdGFydEluZGV4ICYmXHJcbiAgICAgICAgaW5kZXggPD0gZW5kSW5kZXggJiZcclxuICAgICAgICBzdGFydEluZGV4ICE9PSBlbmRJbmRleDtcclxuXHJcbiAgICAgIGNvbnN0IHNob3VsZEFkZCA9XHJcbiAgICAgICAgKHdpdGhpbkJvdW5kaW5nQm94ICYmXHJcbiAgICAgICAgICAhdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkgJiZcclxuICAgICAgICAgICF0aGlzLnNlbGVjdE1vZGUgJiZcclxuICAgICAgICAgICF0aGlzLnNlbGVjdFdpdGhTaG9ydGN1dCkgfHxcclxuICAgICAgICAodGhpcy5zaG9ydGN1dHMuZXh0ZW5kZWRTZWxlY3Rpb25TaG9ydGN1dChldmVudCkgJiYgaXRlbS5zZWxlY3RlZCAmJiAhdGhpcy5fbGFzdFJhbmdlU2VsZWN0aW9uLmdldChpdGVtKSkgfHxcclxuICAgICAgICB3aXRoaW5SYW5nZSB8fFxyXG4gICAgICAgICh3aXRoaW5Cb3VuZGluZ0JveCAmJiB0aGlzLnNob3J0Y3V0cy50b2dnbGVTaW5nbGVJdGVtKGV2ZW50KSAmJiAhaXRlbS5zZWxlY3RlZCkgfHxcclxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmIHRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmIGl0ZW0uc2VsZWN0ZWQpIHx8XHJcbiAgICAgICAgKHdpdGhpbkJvdW5kaW5nQm94ICYmICFpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2VsZWN0TW9kZSkgfHxcclxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmIGl0ZW0uc2VsZWN0ZWQgJiYgdGhpcy5zZWxlY3RNb2RlKTtcclxuXHJcbiAgICAgIGNvbnN0IHNob3VsZFJlbW92ZSA9XHJcbiAgICAgICAgKCF3aXRoaW5Cb3VuZGluZ0JveCAmJlxyXG4gICAgICAgICAgIXRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmXHJcbiAgICAgICAgICAhdGhpcy5zZWxlY3RNb2RlICYmXHJcbiAgICAgICAgICAhdGhpcy5zaG9ydGN1dHMuZXh0ZW5kZWRTZWxlY3Rpb25TaG9ydGN1dChldmVudCkgJiZcclxuICAgICAgICAgICF0aGlzLnNlbGVjdFdpdGhTaG9ydGN1dCkgfHxcclxuICAgICAgICAodGhpcy5zaG9ydGN1dHMuZXh0ZW5kZWRTZWxlY3Rpb25TaG9ydGN1dChldmVudCkgJiYgY3VycmVudEluZGV4ID4gLTEpIHx8XHJcbiAgICAgICAgKCF3aXRoaW5Cb3VuZGluZ0JveCAmJiB0aGlzLnNob3J0Y3V0cy50b2dnbGVTaW5nbGVJdGVtKGV2ZW50KSAmJiAhaXRlbS5zZWxlY3RlZCkgfHxcclxuICAgICAgICAod2l0aGluQm91bmRpbmdCb3ggJiYgdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkgJiYgaXRlbS5zZWxlY3RlZCkgfHxcclxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmICFpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2VsZWN0TW9kZSkgfHxcclxuICAgICAgICAod2l0aGluQm91bmRpbmdCb3ggJiYgaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNlbGVjdE1vZGUpO1xyXG5cclxuICAgICAgaWYgKHNob3VsZEFkZCkge1xyXG4gICAgICAgIHRoaXMuX3NlbGVjdEl0ZW0oaXRlbSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoc2hvdWxkUmVtb3ZlKSB7XHJcbiAgICAgICAgdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAod2l0aGluUmFuZ2UgJiYgIXRoaXMuX2xhc3RSYW5nZVNlbGVjdGlvbi5nZXQoaXRlbSkpIHtcclxuICAgICAgICB0aGlzLl9sYXN0UmFuZ2VTZWxlY3Rpb24uc2V0KGl0ZW0sIHRydWUpO1xyXG4gICAgICB9IGVsc2UgaWYgKCF3aXRoaW5SYW5nZSAmJiAhdGhpcy5fbmV3UmFuZ2VTdGFydCAmJiAhaXRlbS5zZWxlY3RlZCkge1xyXG4gICAgICAgIHRoaXMuX2xhc3RSYW5nZVNlbGVjdGlvbi5kZWxldGUoaXRlbSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGlmIHdlIGRvbid0IHRvZ2dsZSBhIHNpbmdsZSBpdGVtLCB3ZSBzZXQgYG5ld1JhbmdlU3RhcnRgIHRvIGBmYWxzZWBcclxuICAgIC8vIG1lYW5pbmcgdGhhdCB3ZSBhcmUgYnVpbGRpbmcgdXAgYSByYW5nZVxyXG4gICAgaWYgKCF0aGlzLnNob3J0Y3V0cy50b2dnbGVTaW5nbGVJdGVtKGV2ZW50KSkge1xyXG4gICAgICB0aGlzLl9uZXdSYW5nZVN0YXJ0ID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9zZWxlY3RJdGVtcyhldmVudDogRXZlbnQpIHtcclxuICAgIGNvbnN0IHNlbGVjdGlvbkJveCA9IGNhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLiRzZWxlY3RCb3gubmF0aXZlRWxlbWVudCk7XHJcblxyXG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLl9pc0V4dGVuZGVkU2VsZWN0aW9uKGV2ZW50KSkge1xyXG4gICAgICAgIHRoaXMuX2V4dGVuZGVkU2VsZWN0aW9uTW9kZShzZWxlY3Rpb25Cb3gsIGl0ZW0sIGV2ZW50KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLl9ub3JtYWxTZWxlY3Rpb25Nb2RlKHNlbGVjdGlvbkJveCwgaXRlbSwgZXZlbnQpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbGFzdFN0YXJ0SW5kZXggPCAwICYmIGl0ZW0uc2VsZWN0ZWQpIHtcclxuICAgICAgICAgIGl0ZW0udG9nZ2xlUmFuZ2VTdGFydCgpO1xyXG4gICAgICAgICAgdGhpcy5fbGFzdFN0YXJ0SW5kZXggPSBpbmRleDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaXNFeHRlbmRlZFNlbGVjdGlvbihldmVudDogRXZlbnQpIHtcclxuICAgIHJldHVybiB0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJiB0aGlzLnNlbGVjdE9uRHJhZztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX25vcm1hbFNlbGVjdGlvbk1vZGUoc2VsZWN0Qm94OiBCb3VuZGluZ0JveCwgaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSwgZXZlbnQ6IEV2ZW50KSB7XHJcbiAgICBjb25zdCBpblNlbGVjdGlvbiA9IGJveEludGVyc2VjdHMoc2VsZWN0Qm94LCBpdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcclxuXHJcbiAgICBjb25zdCBzaG91bGRBZGQgPSBpblNlbGVjdGlvbiAmJiAhaXRlbS5zZWxlY3RlZCAmJiAhdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCk7XHJcblxyXG4gICAgY29uc3Qgc2hvdWxkUmVtb3ZlID1cclxuICAgICAgKCFpblNlbGVjdGlvbiAmJiBpdGVtLnNlbGVjdGVkICYmICF0aGlzLnNob3J0Y3V0cy5hZGRUb1NlbGVjdGlvbihldmVudCkpIHx8XHJcbiAgICAgIChpblNlbGVjdGlvbiAmJiBpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpKTtcclxuXHJcbiAgICBpZiAoc2hvdWxkQWRkKSB7XHJcbiAgICAgIHRoaXMuX3NlbGVjdEl0ZW0oaXRlbSk7XHJcbiAgICB9IGVsc2UgaWYgKHNob3VsZFJlbW92ZSkge1xyXG4gICAgICB0aGlzLl9kZXNlbGVjdEl0ZW0oaXRlbSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9leHRlbmRlZFNlbGVjdGlvbk1vZGUoc2VsZWN0Qm94LCBpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlLCBldmVudDogRXZlbnQpIHtcclxuICAgIGNvbnN0IGluU2VsZWN0aW9uID0gYm94SW50ZXJzZWN0cyhzZWxlY3RCb3gsIGl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpO1xyXG5cclxuICAgIGNvbnN0IHNob3VkbEFkZCA9XHJcbiAgICAgIChpblNlbGVjdGlvbiAmJiAhaXRlbS5zZWxlY3RlZCAmJiAhdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCkgJiYgIXRoaXMuX3RtcEl0ZW1zLmhhcyhpdGVtKSkgfHxcclxuICAgICAgKGluU2VsZWN0aW9uICYmIGl0ZW0uc2VsZWN0ZWQgJiYgdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCkgJiYgIXRoaXMuX3RtcEl0ZW1zLmhhcyhpdGVtKSk7XHJcblxyXG4gICAgY29uc3Qgc2hvdWxkUmVtb3ZlID1cclxuICAgICAgKCFpblNlbGVjdGlvbiAmJiBpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2hvcnRjdXRzLmFkZFRvU2VsZWN0aW9uKGV2ZW50KSAmJiB0aGlzLl90bXBJdGVtcy5oYXMoaXRlbSkpIHx8XHJcbiAgICAgICghaW5TZWxlY3Rpb24gJiYgIWl0ZW0uc2VsZWN0ZWQgJiYgdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCkgJiYgdGhpcy5fdG1wSXRlbXMuaGFzKGl0ZW0pKTtcclxuXHJcbiAgICBpZiAoc2hvdWRsQWRkKSB7XHJcbiAgICAgIGlmIChpdGVtLnNlbGVjdGVkKSB7XHJcbiAgICAgICAgaXRlbS5fZGVzZWxlY3QoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpdGVtLl9zZWxlY3QoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgYWN0aW9uID0gdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudClcclxuICAgICAgICA/IEFjdGlvbi5EZWxldGVcclxuICAgICAgICA6IHRoaXMuc2hvcnRjdXRzLmFkZFRvU2VsZWN0aW9uKGV2ZW50KVxyXG4gICAgICAgID8gQWN0aW9uLkFkZFxyXG4gICAgICAgIDogQWN0aW9uLk5vbmU7XHJcblxyXG4gICAgICB0aGlzLl90bXBJdGVtcy5zZXQoaXRlbSwgYWN0aW9uKTtcclxuICAgIH0gZWxzZSBpZiAoc2hvdWxkUmVtb3ZlKSB7XHJcbiAgICAgIGlmICh0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSkge1xyXG4gICAgICAgIGl0ZW0uX3NlbGVjdCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGl0ZW0uX2Rlc2VsZWN0KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3RtcEl0ZW1zLmRlbGV0ZShpdGVtKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2ZsdXNoSXRlbXMoKSB7XHJcbiAgICB0aGlzLl90bXBJdGVtcy5mb3JFYWNoKChhY3Rpb24sIGl0ZW0pID0+IHtcclxuICAgICAgaWYgKGFjdGlvbiA9PT0gQWN0aW9uLkFkZCkge1xyXG4gICAgICAgIHRoaXMuX3NlbGVjdEl0ZW0oaXRlbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhY3Rpb24gPT09IEFjdGlvbi5EZWxldGUpIHtcclxuICAgICAgICB0aGlzLl9kZXNlbGVjdEl0ZW0oaXRlbSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuX3RtcEl0ZW1zLmNsZWFyKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9hZGRJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUsIHNlbGVjdGVkSXRlbXM6IEFycmF5PGFueT4pIHtcclxuICAgIGxldCBzdWNjZXNzID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9oYXNJdGVtKGl0ZW0sIHNlbGVjdGVkSXRlbXMpKSB7XHJcbiAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xyXG4gICAgICBzZWxlY3RlZEl0ZW1zLnB1c2goaXRlbS52YWx1ZSk7XHJcbiAgICAgIHRoaXMuX3NlbGVjdGVkSXRlbXMkLm5leHQoc2VsZWN0ZWRJdGVtcyk7XHJcbiAgICAgIHRoaXMuaXRlbVNlbGVjdGVkLmVtaXQoaXRlbS52YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN1Y2Nlc3M7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9yZW1vdmVJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUsIHNlbGVjdGVkSXRlbXM6IEFycmF5PGFueT4pIHtcclxuICAgIGxldCBzdWNjZXNzID0gZmFsc2U7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGl0ZW0gaW5zdGFuY2VvZiBTZWxlY3RJdGVtRGlyZWN0aXZlID8gaXRlbS52YWx1ZSA6IGl0ZW07XHJcbiAgICBjb25zdCBpbmRleCA9IHNlbGVjdGVkSXRlbXMuaW5kZXhPZih2YWx1ZSk7XHJcblxyXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgc3VjY2VzcyA9IHRydWU7XHJcbiAgICAgIHNlbGVjdGVkSXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgdGhpcy5fc2VsZWN0ZWRJdGVtcyQubmV4dChzZWxlY3RlZEl0ZW1zKTtcclxuICAgICAgdGhpcy5pdGVtRGVzZWxlY3RlZC5lbWl0KHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VjY2VzcztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX3RvZ2dsZUl0ZW0oaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkge1xyXG4gICAgaWYgKGl0ZW0uc2VsZWN0ZWQpIHtcclxuICAgICAgdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fc2VsZWN0SXRlbShpdGVtKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgX3NlbGVjdEl0ZW0oaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkge1xyXG4gICAgdGhpcy51cGRhdGVJdGVtcyQubmV4dCh7IHR5cGU6IFVwZGF0ZUFjdGlvbnMuQWRkLCBpdGVtIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfZGVzZWxlY3RJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUpIHtcclxuICAgIHRoaXMudXBkYXRlSXRlbXMkLm5leHQoeyB0eXBlOiBVcGRhdGVBY3Rpb25zLlJlbW92ZSwgaXRlbSB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2hhc0l0ZW0oaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSwgc2VsZWN0ZWRJdGVtczogQXJyYXk8YW55Pikge1xyXG4gICAgcmV0dXJuIHNlbGVjdGVkSXRlbXMuaW5jbHVkZXMoaXRlbS52YWx1ZSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9nZXRDbG9zZXN0U2VsZWN0SXRlbShldmVudDogRXZlbnQpOiBbbnVtYmVyLCBTZWxlY3RJdGVtRGlyZWN0aXZlXSB7XHJcbiAgICBjb25zdCB0YXJnZXQgPSAoZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KCcuZHRzLXNlbGVjdC1pdGVtJyk7XHJcbiAgICBsZXQgaW5kZXggPSAtMTtcclxuICAgIGxldCB0YXJnZXRJdGVtID0gbnVsbDtcclxuXHJcbiAgICBpZiAodGFyZ2V0KSB7XHJcbiAgICAgIHRhcmdldEl0ZW0gPSB0YXJnZXRbU0VMRUNUX0lURU1fSU5TVEFOQ0VdO1xyXG4gICAgICBpbmRleCA9IHRoaXMuX3NlbGVjdGFibGVJdGVtcy5pbmRleE9mKHRhcmdldEl0ZW0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBbaW5kZXgsIHRhcmdldEl0ZW1dO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfcmVzZXRSYW5nZVN0YXJ0KCkge1xyXG4gICAgdGhpcy5fbGFzdFJhbmdlID0gWy0xLCAtMV07XHJcbiAgICBjb25zdCBsYXN0UmFuZ2VTdGFydCA9IHRoaXMuX2dldExhc3RSYW5nZVNlbGVjdGlvbigpO1xyXG5cclxuICAgIGlmIChsYXN0UmFuZ2VTdGFydCAmJiBsYXN0UmFuZ2VTdGFydC5yYW5nZVN0YXJ0KSB7XHJcbiAgICAgIGxhc3RSYW5nZVN0YXJ0LnRvZ2dsZVJhbmdlU3RhcnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2dldExhc3RSYW5nZVNlbGVjdGlvbigpOiBTZWxlY3RJdGVtRGlyZWN0aXZlIHwgbnVsbCB7XHJcbiAgICBpZiAodGhpcy5fbGFzdFN0YXJ0SW5kZXggPj0gMCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fc2VsZWN0YWJsZUl0ZW1zW3RoaXMuX2xhc3RTdGFydEluZGV4XTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbn1cclxuIl19