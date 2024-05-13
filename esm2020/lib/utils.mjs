import { MIN_HEIGHT, MIN_WIDTH } from './constants';
export const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
};
export function mergeDeep(target, source) {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                mergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        });
    }
    return target;
}
export const hasMinimumSize = (selectBox, minWidth = MIN_WIDTH, minHeight = MIN_HEIGHT) => {
    return selectBox.width > minWidth || selectBox.height > minHeight;
};
export const clearSelection = (window) => {
    const selection = window.getSelection();
    if (!selection) {
        return;
    }
    if (selection.removeAllRanges) {
        selection.removeAllRanges();
    }
    else if (selection.empty) {
        selection.empty();
    }
};
export const inBoundingBox = (point, box) => {
    return (box.left <= point.x && point.x <= box.left + box.width && box.top <= point.y && point.y <= box.top + box.height);
};
export const boxIntersects = (boxA, boxB) => {
    return (boxA.left <= boxB.left + boxB.width &&
        boxA.left + boxA.width >= boxB.left &&
        boxA.top <= boxB.top + boxB.height &&
        boxA.top + boxA.height >= boxB.top);
};
export const calculateBoundingClientRect = (element) => {
    return element.getBoundingClientRect();
};
export const getMousePosition = (event) => {
    return {
        x: event.clientX,
        y: event.clientY,
    };
};
export const getScroll = () => {
    if (!document || !document.documentElement) {
        return {
            x: 0,
            y: 0,
        };
    }
    return {
        x: document.documentElement.scrollLeft || document.body.scrollLeft,
        y: document.documentElement.scrollTop || document.body.scrollTop,
    };
};
export const getRelativeMousePosition = (event, container) => {
    const { x: clientX, y: clientY } = getMousePosition(event);
    const scroll = getScroll();
    const borderSize = (container.boundingClientRect.width - container.clientWidth) / 2;
    const offsetLeft = container.boundingClientRect.left + scroll.x;
    const offsetTop = container.boundingClientRect.top + scroll.y;
    return {
        x: clientX - borderSize - (offsetLeft - window.pageXOffset) + container.scrollLeft,
        y: clientY - borderSize - (offsetTop - window.pageYOffset) + container.scrollTop,
    };
};
export const cursorWithinElement = (event, element) => {
    const mousePoint = getMousePosition(event);
    return inBoundingBox(mousePoint, calculateBoundingClientRect(element));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZHJhZy10by1zZWxlY3Qvc3JjL2xpYi91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUdwRCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFTLEVBQUUsRUFBRTtJQUNwQyxPQUFPLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUM7QUFDbkYsQ0FBQyxDQUFDO0FBRUYsTUFBTSxVQUFVLFNBQVMsQ0FBQyxNQUEyQixFQUFFLE1BQTJCO0lBQ2hGLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUN4QyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2xDLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNoQixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztpQkFDdEM7Z0JBQ0QsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUNyQztpQkFBTTtnQkFDTCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQzth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LEVBQUUsU0FBOEIsRUFBaUIsRUFBRTtJQUMzRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0QsTUFBTSxNQUFNLEdBQUcsU0FBUyxFQUFFLENBQUM7SUFFM0IsTUFBTSxVQUFVLEdBQUcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEYsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUU5RCxPQUFPO1FBQ0wsQ0FBQyxFQUFFLE9BQU8sR0FBRyxVQUFVLEdBQUcsQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxVQUFVO1FBQ2xGLENBQUMsRUFBRSxPQUFPLEdBQUcsVUFBVSxHQUFHLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxTQUFTLENBQUMsU0FBUztLQUNqRixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxLQUFpQixFQUFFLE9BQW9CLEVBQUUsRUFBRTtJQUM3RSxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxPQUFPLGFBQWEsQ0FBQyxVQUFVLEVBQUUsMkJBQTJCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN6RSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNSU5fSEVJR0hULCBNSU5fV0lEVEggfSBmcm9tICcuL2NvbnN0YW50cyc7XHJcbmltcG9ydCB7IEJvdW5kaW5nQm94LCBNb3VzZVBvc2l0aW9uLCBTZWxlY3RCb3gsIFNlbGVjdENvbnRhaW5lckhvc3QgfSBmcm9tICcuL21vZGVscyc7XHJcblxyXG5leHBvcnQgY29uc3QgaXNPYmplY3QgPSAoaXRlbTogYW55KSA9PiB7XHJcbiAgcmV0dXJuIGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KGl0ZW0pICYmIGl0ZW0gIT09IG51bGw7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VEZWVwKHRhcmdldDogUmVjb3JkPHN0cmluZywgYW55Piwgc291cmNlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XHJcbiAgaWYgKGlzT2JqZWN0KHRhcmdldCkgJiYgaXNPYmplY3Qoc291cmNlKSkge1xyXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgaWYgKGlzT2JqZWN0KHNvdXJjZVtrZXldKSkge1xyXG4gICAgICAgIGlmICghdGFyZ2V0W2tleV0pIHtcclxuICAgICAgICAgIE9iamVjdC5hc3NpZ24odGFyZ2V0LCB7IFtrZXldOiB7fSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbWVyZ2VEZWVwKHRhcmdldFtrZXldLCBzb3VyY2Vba2V5XSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0YXJnZXQsIHsgW2tleV06IHNvdXJjZVtrZXldIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0YXJnZXQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBoYXNNaW5pbXVtU2l6ZSA9IChzZWxlY3RCb3g6IFNlbGVjdEJveDxudW1iZXI+LCBtaW5XaWR0aCA9IE1JTl9XSURUSCwgbWluSGVpZ2h0ID0gTUlOX0hFSUdIVCkgPT4ge1xyXG4gIHJldHVybiBzZWxlY3RCb3gud2lkdGggPiBtaW5XaWR0aCB8fCBzZWxlY3RCb3guaGVpZ2h0ID4gbWluSGVpZ2h0O1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGNsZWFyU2VsZWN0aW9uID0gKHdpbmRvdzogV2luZG93KSA9PiB7XHJcbiAgY29uc3Qgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xyXG5cclxuICBpZiAoIXNlbGVjdGlvbikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMpIHtcclxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcclxuICB9IGVsc2UgaWYgKHNlbGVjdGlvbi5lbXB0eSkge1xyXG4gICAgc2VsZWN0aW9uLmVtcHR5KCk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGluQm91bmRpbmdCb3ggPSAocG9pbnQ6IE1vdXNlUG9zaXRpb24sIGJveDogQm91bmRpbmdCb3gpID0+IHtcclxuICByZXR1cm4gKFxyXG4gICAgYm94LmxlZnQgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IGJveC5sZWZ0ICsgYm94LndpZHRoICYmIGJveC50b3AgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IGJveC50b3AgKyBib3guaGVpZ2h0XHJcbiAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBib3hJbnRlcnNlY3RzID0gKGJveEE6IEJvdW5kaW5nQm94LCBib3hCOiBCb3VuZGluZ0JveCkgPT4ge1xyXG4gIHJldHVybiAoXHJcbiAgICBib3hBLmxlZnQgPD0gYm94Qi5sZWZ0ICsgYm94Qi53aWR0aCAmJlxyXG4gICAgYm94QS5sZWZ0ICsgYm94QS53aWR0aCA+PSBib3hCLmxlZnQgJiZcclxuICAgIGJveEEudG9wIDw9IGJveEIudG9wICsgYm94Qi5oZWlnaHQgJiZcclxuICAgIGJveEEudG9wICsgYm94QS5oZWlnaHQgPj0gYm94Qi50b3BcclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGNhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCA9IChlbGVtZW50OiBIVE1MRWxlbWVudCk6IEJvdW5kaW5nQm94ID0+IHtcclxuICByZXR1cm4gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBnZXRNb3VzZVBvc2l0aW9uID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHg6IGV2ZW50LmNsaWVudFgsXHJcbiAgICB5OiBldmVudC5jbGllbnRZLFxyXG4gIH07XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0U2Nyb2xsID0gKCkgPT4ge1xyXG4gIGlmICghZG9jdW1lbnQgfHwgIWRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgeDogMCxcclxuICAgICAgeTogMCxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgeDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0LFxyXG4gICAgeTogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCxcclxuICB9O1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGdldFJlbGF0aXZlTW91c2VQb3NpdGlvbiA9IChldmVudDogTW91c2VFdmVudCwgY29udGFpbmVyOiBTZWxlY3RDb250YWluZXJIb3N0KTogTW91c2VQb3NpdGlvbiA9PiB7XHJcbiAgY29uc3QgeyB4OiBjbGllbnRYLCB5OiBjbGllbnRZIH0gPSBnZXRNb3VzZVBvc2l0aW9uKGV2ZW50KTtcclxuICBjb25zdCBzY3JvbGwgPSBnZXRTY3JvbGwoKTtcclxuXHJcbiAgY29uc3QgYm9yZGVyU2l6ZSA9IChjb250YWluZXIuYm91bmRpbmdDbGllbnRSZWN0LndpZHRoIC0gY29udGFpbmVyLmNsaWVudFdpZHRoKSAvIDI7XHJcbiAgY29uc3Qgb2Zmc2V0TGVmdCA9IGNvbnRhaW5lci5ib3VuZGluZ0NsaWVudFJlY3QubGVmdCArIHNjcm9sbC54O1xyXG4gIGNvbnN0IG9mZnNldFRvcCA9IGNvbnRhaW5lci5ib3VuZGluZ0NsaWVudFJlY3QudG9wICsgc2Nyb2xsLnk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB4OiBjbGllbnRYIC0gYm9yZGVyU2l6ZSAtIChvZmZzZXRMZWZ0IC0gd2luZG93LnBhZ2VYT2Zmc2V0KSArIGNvbnRhaW5lci5zY3JvbGxMZWZ0LFxyXG4gICAgeTogY2xpZW50WSAtIGJvcmRlclNpemUgLSAob2Zmc2V0VG9wIC0gd2luZG93LnBhZ2VZT2Zmc2V0KSArIGNvbnRhaW5lci5zY3JvbGxUb3AsXHJcbiAgfTtcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBjdXJzb3JXaXRoaW5FbGVtZW50ID0gKGV2ZW50OiBNb3VzZUV2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4ge1xyXG4gIGNvbnN0IG1vdXNlUG9pbnQgPSBnZXRNb3VzZVBvc2l0aW9uKGV2ZW50KTtcclxuICByZXR1cm4gaW5Cb3VuZGluZ0JveChtb3VzZVBvaW50LCBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbWVudCkpO1xyXG59O1xyXG4iXX0=