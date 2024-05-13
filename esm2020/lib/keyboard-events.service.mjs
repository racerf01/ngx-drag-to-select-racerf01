import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { fromEvent } from 'rxjs';
import { share } from 'rxjs/operators';
import { distinctKeyEvents } from './operators';
import * as i0 from "@angular/core";
export class KeyboardEventsService {
    constructor(platformId) {
        this.platformId = platformId;
        if (isPlatformBrowser(this.platformId)) {
            this._initializeKeyboardStreams();
        }
    }
    _initializeKeyboardStreams() {
        this.keydown$ = fromEvent(window, 'keydown').pipe(share());
        this.keyup$ = fromEvent(window, 'keyup').pipe(share());
        // distinctKeyEvents is used to prevent multiple key events to be fired repeatedly
        // on Windows when a key is being pressed
        this.distinctKeydown$ = this.keydown$.pipe(distinctKeyEvents(), share());
        this.distinctKeyup$ = this.keyup$.pipe(distinctKeyEvents(), share());
        this.mouseup$ = fromEvent(window, 'mouseup').pipe(share());
        this.mousemove$ = fromEvent(window, 'mousemove').pipe(share());
    }
}
KeyboardEventsService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: KeyboardEventsService, deps: [{ token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Injectable });
KeyboardEventsService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: KeyboardEventsService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: KeyboardEventsService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmQtZXZlbnRzLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZHJhZy10by1zZWxlY3Qvc3JjL2xpYi9rZXlib2FyZC1ldmVudHMuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUFFLFNBQVMsRUFBYyxNQUFNLE1BQU0sQ0FBQztBQUM3QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdkMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sYUFBYSxDQUFDOztBQUdoRCxNQUFNLE9BQU8scUJBQXFCO0lBUWhDLFlBQXlDLFVBQW1DO1FBQW5DLGVBQVUsR0FBVixVQUFVLENBQXlCO1FBQzFFLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3RDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1NBQ25DO0lBQ0gsQ0FBQztJQUVPLDBCQUEwQjtRQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBZ0IsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFnQixNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFdEUsa0ZBQWtGO1FBQ2xGLHlDQUF5QztRQUV6QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXpFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXJFLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFhLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN2RSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBYSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDN0UsQ0FBQzs7a0hBM0JVLHFCQUFxQixrQkFRWixXQUFXO3NIQVJwQixxQkFBcUI7MkZBQXJCLHFCQUFxQjtrQkFEakMsVUFBVTs7MEJBU0ksTUFBTTsyQkFBQyxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNQbGF0Zm9ybUJyb3dzZXIgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xyXG5pbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUsIFBMQVRGT1JNX0lEIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IGZyb21FdmVudCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBzaGFyZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHsgZGlzdGluY3RLZXlFdmVudHMgfSBmcm9tICcuL29wZXJhdG9ycyc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBLZXlib2FyZEV2ZW50c1NlcnZpY2Uge1xyXG4gIGtleWRvd24kOiBPYnNlcnZhYmxlPEtleWJvYXJkRXZlbnQ+O1xyXG4gIGtleXVwJDogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PjtcclxuICBkaXN0aW5jdEtleWRvd24kOiBPYnNlcnZhYmxlPEtleWJvYXJkRXZlbnQ+O1xyXG4gIGRpc3RpbmN0S2V5dXAkOiBPYnNlcnZhYmxlPEtleWJvYXJkRXZlbnQ+O1xyXG4gIG1vdXNldXAkOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+O1xyXG4gIG1vdXNlbW92ZSQ6IE9ic2VydmFibGU8TW91c2VFdmVudD47XHJcblxyXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcclxuICAgIGlmIChpc1BsYXRmb3JtQnJvd3Nlcih0aGlzLnBsYXRmb3JtSWQpKSB7XHJcbiAgICAgIHRoaXMuX2luaXRpYWxpemVLZXlib2FyZFN0cmVhbXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2luaXRpYWxpemVLZXlib2FyZFN0cmVhbXMoKSB7XHJcbiAgICB0aGlzLmtleWRvd24kID0gZnJvbUV2ZW50PEtleWJvYXJkRXZlbnQ+KHdpbmRvdywgJ2tleWRvd24nKS5waXBlKHNoYXJlKCkpO1xyXG4gICAgdGhpcy5rZXl1cCQgPSBmcm9tRXZlbnQ8S2V5Ym9hcmRFdmVudD4od2luZG93LCAna2V5dXAnKS5waXBlKHNoYXJlKCkpO1xyXG5cclxuICAgIC8vIGRpc3RpbmN0S2V5RXZlbnRzIGlzIHVzZWQgdG8gcHJldmVudCBtdWx0aXBsZSBrZXkgZXZlbnRzIHRvIGJlIGZpcmVkIHJlcGVhdGVkbHlcclxuICAgIC8vIG9uIFdpbmRvd3Mgd2hlbiBhIGtleSBpcyBiZWluZyBwcmVzc2VkXHJcblxyXG4gICAgdGhpcy5kaXN0aW5jdEtleWRvd24kID0gdGhpcy5rZXlkb3duJC5waXBlKGRpc3RpbmN0S2V5RXZlbnRzKCksIHNoYXJlKCkpO1xyXG5cclxuICAgIHRoaXMuZGlzdGluY3RLZXl1cCQgPSB0aGlzLmtleXVwJC5waXBlKGRpc3RpbmN0S2V5RXZlbnRzKCksIHNoYXJlKCkpO1xyXG5cclxuICAgIHRoaXMubW91c2V1cCQgPSBmcm9tRXZlbnQ8TW91c2VFdmVudD4od2luZG93LCAnbW91c2V1cCcpLnBpcGUoc2hhcmUoKSk7XHJcbiAgICB0aGlzLm1vdXNlbW92ZSQgPSBmcm9tRXZlbnQ8TW91c2VFdmVudD4od2luZG93LCAnbW91c2Vtb3ZlJykucGlwZShzaGFyZSgpKTtcclxuICB9XHJcbn1cclxuIl19