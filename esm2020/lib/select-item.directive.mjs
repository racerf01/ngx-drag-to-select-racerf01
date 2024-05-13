import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, Inject, Input, PLATFORM_ID, Renderer2, HostBinding, } from '@angular/core';
import { CONFIG } from './tokens';
import { calculateBoundingClientRect } from './utils';
import * as i0 from "@angular/core";
export const SELECT_ITEM_INSTANCE = Symbol();
export class SelectItemDirective {
    constructor(config, platformId, host, renderer) {
        this.config = config;
        this.platformId = platformId;
        this.host = host;
        this.renderer = renderer;
        this.selected = false;
        this.rangeStart = false;
        this.hostClass = true;
        this.dtsDisabled = false;
    }
    get value() {
        return this.dtsSelectItem != null ? this.dtsSelectItem : this;
    }
    ngOnInit() {
        this.nativeElememnt[SELECT_ITEM_INSTANCE] = this;
    }
    ngDoCheck() {
        this.applySelectedClass();
    }
    toggleRangeStart() {
        this.rangeStart = !this.rangeStart;
    }
    get nativeElememnt() {
        return this.host.nativeElement;
    }
    getBoundingClientRect() {
        if (isPlatformBrowser(this.platformId) && !this._boundingClientRect) {
            this.calculateBoundingClientRect();
        }
        return this._boundingClientRect;
    }
    calculateBoundingClientRect() {
        const boundingBox = calculateBoundingClientRect(this.host.nativeElement);
        this._boundingClientRect = boundingBox;
        return boundingBox;
    }
    _select() {
        this.selected = true;
    }
    _deselect() {
        this.selected = false;
    }
    applySelectedClass() {
        if (this.selected) {
            this.renderer.addClass(this.host.nativeElement, this.config.selectedClass);
        }
        else {
            this.renderer.removeClass(this.host.nativeElement, this.config.selectedClass);
        }
    }
}
SelectItemDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectItemDirective, deps: [{ token: CONFIG }, { token: PLATFORM_ID }, { token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Directive });
SelectItemDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.3", type: SelectItemDirective, selector: "[dtsSelectItem]", inputs: { dtsSelectItem: "dtsSelectItem", dtsDisabled: "dtsDisabled" }, host: { properties: { "class.dts-range-start": "this.rangeStart", "class.dts-select-item": "this.hostClass", "class.dts-disabled": "this.dtsDisabled" } }, exportAs: ["dtsSelectItem"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectItemDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[dtsSelectItem]',
                    exportAs: 'dtsSelectItem',
                }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [CONFIG]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { rangeStart: [{
                type: HostBinding,
                args: ['class.dts-range-start']
            }], hostClass: [{
                type: HostBinding,
                args: ['class.dts-select-item']
            }], dtsSelectItem: [{
                type: Input
            }], dtsDisabled: [{
                type: Input
            }, {
                type: HostBinding,
                args: ['class.dts-disabled']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LWl0ZW0uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWRyYWctdG8tc2VsZWN0L3NyYy9saWIvc2VsZWN0LWl0ZW0uZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXBELE9BQU8sRUFDTCxTQUFTLEVBRVQsVUFBVSxFQUNWLE1BQU0sRUFDTixLQUFLLEVBQ0wsV0FBVyxFQUNYLFNBQVMsRUFFVCxXQUFXLEdBQ1osTUFBTSxlQUFlLENBQUM7QUFHdkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNsQyxPQUFPLEVBQUUsMkJBQTJCLEVBQUUsTUFBTSxTQUFTLENBQUM7O0FBRXRELE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLE1BQU0sRUFBRSxDQUFDO0FBTTdDLE1BQU0sT0FBTyxtQkFBbUI7SUFxQjlCLFlBQzBCLE1BQTBCLEVBQ3JCLFVBQW1DLEVBQ3hELElBQWdCLEVBQ2hCLFFBQW1CO1FBSEgsV0FBTSxHQUFOLE1BQU0sQ0FBb0I7UUFDckIsZUFBVSxHQUFWLFVBQVUsQ0FBeUI7UUFDeEQsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUNoQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBdEI3QixhQUFRLEdBQUcsS0FBSyxDQUFDO1FBR2pCLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFHVixjQUFTLEdBQUcsSUFBSSxDQUFDO1FBTTFCLGdCQUFXLEdBQUcsS0FBSyxDQUFDO0lBV2pCLENBQUM7SUFUSixJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEUsQ0FBQztJQVNELFFBQVE7UUFDTixJQUFJLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ25ELENBQUM7SUFFRCxTQUFTO1FBQ1AsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELGdCQUFnQjtRQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxJQUFJLGNBQWM7UUFDaEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUNqQyxDQUFDO0lBRUQscUJBQXFCO1FBQ25CLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ25FLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1NBQ3BDO1FBQ0QsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7SUFDbEMsQ0FBQztJQUVELDJCQUEyQjtRQUN6QixNQUFNLFdBQVcsR0FBRywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pFLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxXQUFXLENBQUM7UUFDdkMsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztJQUN2QixDQUFDO0lBRUQsU0FBUztRQUNQLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3hCLENBQUM7SUFFTyxrQkFBa0I7UUFDeEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDNUU7YUFBTTtZQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDL0U7SUFDSCxDQUFDOztnSEF2RVUsbUJBQW1CLGtCQXNCcEIsTUFBTSxhQUNOLFdBQVc7b0dBdkJWLG1CQUFtQjsyRkFBbkIsbUJBQW1CO2tCQUovQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxpQkFBaUI7b0JBQzNCLFFBQVEsRUFBRSxlQUFlO2lCQUMxQjs7MEJBdUJJLE1BQU07MkJBQUMsTUFBTTs7MEJBQ2IsTUFBTTsyQkFBQyxXQUFXOzZGQWpCckIsVUFBVTtzQkFEVCxXQUFXO3VCQUFDLHVCQUF1QjtnQkFJM0IsU0FBUztzQkFEakIsV0FBVzt1QkFBQyx1QkFBdUI7Z0JBRzNCLGFBQWE7c0JBQXJCLEtBQUs7Z0JBSU4sV0FBVztzQkFGVixLQUFLOztzQkFDTCxXQUFXO3VCQUFDLG9CQUFvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzUGxhdGZvcm1Ccm93c2VyIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcclxuXHJcbmltcG9ydCB7XHJcbiAgRGlyZWN0aXZlLFxyXG4gIERvQ2hlY2ssXHJcbiAgRWxlbWVudFJlZixcclxuICBJbmplY3QsXHJcbiAgSW5wdXQsXHJcbiAgUExBVEZPUk1fSUQsXHJcbiAgUmVuZGVyZXIyLFxyXG4gIE9uSW5pdCxcclxuICBIb3N0QmluZGluZyxcclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuXHJcbmltcG9ydCB7IERyYWdUb1NlbGVjdENvbmZpZywgQm91bmRpbmdCb3ggfSBmcm9tICcuL21vZGVscyc7XHJcbmltcG9ydCB7IENPTkZJRyB9IGZyb20gJy4vdG9rZW5zJztcclxuaW1wb3J0IHsgY2FsY3VsYXRlQm91bmRpbmdDbGllbnRSZWN0IH0gZnJvbSAnLi91dGlscyc7XHJcblxyXG5leHBvcnQgY29uc3QgU0VMRUNUX0lURU1fSU5TVEFOQ0UgPSBTeW1ib2woKTtcclxuXHJcbkBEaXJlY3RpdmUoe1xyXG4gIHNlbGVjdG9yOiAnW2R0c1NlbGVjdEl0ZW1dJyxcclxuICBleHBvcnRBczogJ2R0c1NlbGVjdEl0ZW0nLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgU2VsZWN0SXRlbURpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgRG9DaGVjayB7XHJcbiAgcHJpdmF0ZSBfYm91bmRpbmdDbGllbnRSZWN0OiBCb3VuZGluZ0JveCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgc2VsZWN0ZWQgPSBmYWxzZTtcclxuXHJcbiAgQEhvc3RCaW5kaW5nKCdjbGFzcy5kdHMtcmFuZ2Utc3RhcnQnKVxyXG4gIHJhbmdlU3RhcnQgPSBmYWxzZTtcclxuXHJcbiAgQEhvc3RCaW5kaW5nKCdjbGFzcy5kdHMtc2VsZWN0LWl0ZW0nKVxyXG4gIHJlYWRvbmx5IGhvc3RDbGFzcyA9IHRydWU7XHJcblxyXG4gIEBJbnB1dCgpIGR0c1NlbGVjdEl0ZW06IGFueSB8IHVuZGVmaW5lZDtcclxuXHJcbiAgQElucHV0KClcclxuICBASG9zdEJpbmRpbmcoJ2NsYXNzLmR0cy1kaXNhYmxlZCcpXHJcbiAgZHRzRGlzYWJsZWQgPSBmYWxzZTtcclxuXHJcbiAgZ2V0IHZhbHVlKCk6IFNlbGVjdEl0ZW1EaXJlY3RpdmUgfCBhbnkge1xyXG4gICAgcmV0dXJuIHRoaXMuZHRzU2VsZWN0SXRlbSAhPSBudWxsID8gdGhpcy5kdHNTZWxlY3RJdGVtIDogdGhpcztcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgQEluamVjdChDT05GSUcpIHByaXZhdGUgY29uZmlnOiBEcmFnVG9TZWxlY3RDb25maWcsXHJcbiAgICBASW5qZWN0KFBMQVRGT1JNX0lEKSBwcml2YXRlIHBsYXRmb3JtSWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgcHJpdmF0ZSBob3N0OiBFbGVtZW50UmVmLFxyXG4gICAgcHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyXHJcbiAgKSB7fVxyXG5cclxuICBuZ09uSW5pdCgpIHtcclxuICAgIHRoaXMubmF0aXZlRWxlbWVtbnRbU0VMRUNUX0lURU1fSU5TVEFOQ0VdID0gdGhpcztcclxuICB9XHJcblxyXG4gIG5nRG9DaGVjaygpIHtcclxuICAgIHRoaXMuYXBwbHlTZWxlY3RlZENsYXNzKCk7XHJcbiAgfVxyXG5cclxuICB0b2dnbGVSYW5nZVN0YXJ0KCkge1xyXG4gICAgdGhpcy5yYW5nZVN0YXJ0ID0gIXRoaXMucmFuZ2VTdGFydDtcclxuICB9XHJcblxyXG4gIGdldCBuYXRpdmVFbGVtZW1udCgpIHtcclxuICAgIHJldHVybiB0aGlzLmhvc3QubmF0aXZlRWxlbWVudDtcclxuICB9XHJcblxyXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIHtcclxuICAgIGlmIChpc1BsYXRmb3JtQnJvd3Nlcih0aGlzLnBsYXRmb3JtSWQpICYmICF0aGlzLl9ib3VuZGluZ0NsaWVudFJlY3QpIHtcclxuICAgICAgdGhpcy5jYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9ib3VuZGluZ0NsaWVudFJlY3Q7XHJcbiAgfVxyXG5cclxuICBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKSB7XHJcbiAgICBjb25zdCBib3VuZGluZ0JveCA9IGNhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLmhvc3QubmF0aXZlRWxlbWVudCk7XHJcbiAgICB0aGlzLl9ib3VuZGluZ0NsaWVudFJlY3QgPSBib3VuZGluZ0JveDtcclxuICAgIHJldHVybiBib3VuZGluZ0JveDtcclxuICB9XHJcblxyXG4gIF9zZWxlY3QoKSB7XHJcbiAgICB0aGlzLnNlbGVjdGVkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIF9kZXNlbGVjdCgpIHtcclxuICAgIHRoaXMuc2VsZWN0ZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXBwbHlTZWxlY3RlZENsYXNzKCkge1xyXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWQpIHtcclxuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyh0aGlzLmhvc3QubmF0aXZlRWxlbWVudCwgdGhpcy5jb25maWcuc2VsZWN0ZWRDbGFzcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKHRoaXMuaG9zdC5uYXRpdmVFbGVtZW50LCB0aGlzLmNvbmZpZy5zZWxlY3RlZENsYXNzKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19