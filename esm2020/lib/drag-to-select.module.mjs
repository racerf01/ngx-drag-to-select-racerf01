import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DEFAULT_CONFIG } from './config';
import { KeyboardEventsService } from './keyboard-events.service';
import { SelectContainerComponent } from './select-container.component';
import { SelectItemDirective } from './select-item.directive';
import { ShortcutService } from './shortcut.service';
import { CONFIG, USER_CONFIG } from './tokens';
import { mergeDeep } from './utils';
import * as i0 from "@angular/core";
const COMPONENTS = [SelectContainerComponent, SelectItemDirective];
function configFactory(config) {
    return mergeDeep(DEFAULT_CONFIG, config);
}
export class DragToSelectModule {
    static forRoot(config = {}) {
        return {
            ngModule: DragToSelectModule,
            providers: [
                ShortcutService,
                KeyboardEventsService,
                { provide: USER_CONFIG, useValue: config },
                {
                    provide: CONFIG,
                    useFactory: configFactory,
                    deps: [USER_CONFIG],
                },
            ],
        };
    }
}
DragToSelectModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
DragToSelectModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, declarations: [SelectContainerComponent, SelectItemDirective], imports: [CommonModule], exports: [SelectContainerComponent, SelectItemDirective] });
DragToSelectModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, imports: [[CommonModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule],
                    declarations: [...COMPONENTS],
                    exports: [...COMPONENTS],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy10by1zZWxlY3QubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWRyYWctdG8tc2VsZWN0L3NyYy9saWIvZHJhZy10by1zZWxlY3QubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQXVCLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM5RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzFDLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRWxFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzlELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMvQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sU0FBUyxDQUFDOztBQUVwQyxNQUFNLFVBQVUsR0FBRyxDQUFDLHdCQUF3QixFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFFbkUsU0FBUyxhQUFhLENBQUMsTUFBbUM7SUFDeEQsT0FBTyxTQUFTLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFPRCxNQUFNLE9BQU8sa0JBQWtCO0lBQzdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBc0MsRUFBRTtRQUNyRCxPQUFPO1lBQ0wsUUFBUSxFQUFFLGtCQUFrQjtZQUM1QixTQUFTLEVBQUU7Z0JBQ1QsZUFBZTtnQkFDZixxQkFBcUI7Z0JBQ3JCLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO2dCQUMxQztvQkFDRSxPQUFPLEVBQUUsTUFBTTtvQkFDZixVQUFVLEVBQUUsYUFBYTtvQkFDekIsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUNwQjthQUNGO1NBQ0YsQ0FBQztJQUNKLENBQUM7OytHQWZVLGtCQUFrQjtnSEFBbEIsa0JBQWtCLGlCQVhYLHdCQUF3QixFQUFFLG1CQUFtQixhQU9yRCxZQUFZLGFBUEosd0JBQXdCLEVBQUUsbUJBQW1CO2dIQVdwRCxrQkFBa0IsWUFKcEIsQ0FBQyxZQUFZLENBQUM7MkZBSVosa0JBQWtCO2tCQUw5QixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQztvQkFDdkIsWUFBWSxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUM7b0JBQzdCLE9BQU8sRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDO2lCQUN6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XHJcbmltcG9ydCB7IE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERFRkFVTFRfQ09ORklHIH0gZnJvbSAnLi9jb25maWcnO1xyXG5pbXBvcnQgeyBLZXlib2FyZEV2ZW50c1NlcnZpY2UgfSBmcm9tICcuL2tleWJvYXJkLWV2ZW50cy5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRHJhZ1RvU2VsZWN0Q29uZmlnIH0gZnJvbSAnLi9tb2RlbHMnO1xyXG5pbXBvcnQgeyBTZWxlY3RDb250YWluZXJDb21wb25lbnQgfSBmcm9tICcuL3NlbGVjdC1jb250YWluZXIuY29tcG9uZW50JztcclxuaW1wb3J0IHsgU2VsZWN0SXRlbURpcmVjdGl2ZSB9IGZyb20gJy4vc2VsZWN0LWl0ZW0uZGlyZWN0aXZlJztcclxuaW1wb3J0IHsgU2hvcnRjdXRTZXJ2aWNlIH0gZnJvbSAnLi9zaG9ydGN1dC5zZXJ2aWNlJztcclxuaW1wb3J0IHsgQ09ORklHLCBVU0VSX0NPTkZJRyB9IGZyb20gJy4vdG9rZW5zJztcclxuaW1wb3J0IHsgbWVyZ2VEZWVwIH0gZnJvbSAnLi91dGlscyc7XHJcblxyXG5jb25zdCBDT01QT05FTlRTID0gW1NlbGVjdENvbnRhaW5lckNvbXBvbmVudCwgU2VsZWN0SXRlbURpcmVjdGl2ZV07XHJcblxyXG5mdW5jdGlvbiBjb25maWdGYWN0b3J5KGNvbmZpZzogUGFydGlhbDxEcmFnVG9TZWxlY3RDb25maWc+KSB7XHJcbiAgcmV0dXJuIG1lcmdlRGVlcChERUZBVUxUX0NPTkZJRywgY29uZmlnKTtcclxufVxyXG5cclxuQE5nTW9kdWxlKHtcclxuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcclxuICBkZWNsYXJhdGlvbnM6IFsuLi5DT01QT05FTlRTXSxcclxuICBleHBvcnRzOiBbLi4uQ09NUE9ORU5UU10sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEcmFnVG9TZWxlY3RNb2R1bGUge1xyXG4gIHN0YXRpYyBmb3JSb290KGNvbmZpZzogUGFydGlhbDxEcmFnVG9TZWxlY3RDb25maWc+ID0ge30pOiBNb2R1bGVXaXRoUHJvdmlkZXJzPERyYWdUb1NlbGVjdE1vZHVsZT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmdNb2R1bGU6IERyYWdUb1NlbGVjdE1vZHVsZSxcclxuICAgICAgcHJvdmlkZXJzOiBbXHJcbiAgICAgICAgU2hvcnRjdXRTZXJ2aWNlLFxyXG4gICAgICAgIEtleWJvYXJkRXZlbnRzU2VydmljZSxcclxuICAgICAgICB7IHByb3ZpZGU6IFVTRVJfQ09ORklHLCB1c2VWYWx1ZTogY29uZmlnIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcHJvdmlkZTogQ09ORklHLFxyXG4gICAgICAgICAgdXNlRmFjdG9yeTogY29uZmlnRmFjdG9yeSxcclxuICAgICAgICAgIGRlcHM6IFtVU0VSX0NPTkZJR10sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcbiJdfQ==