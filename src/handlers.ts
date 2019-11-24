import { Nullable } from 'tsdef';
import {
    addLongPressTimeout,
    clearLongPressTimeout,
    fetchHandlerData,
    getGlobalMenuHandler,
    getLocalMenuHandler,
    hasLongPressTimeout,
    hideAllMenus,
} from './globalState';

const LONG_PRESS_DURATION_IN_MS = 420;

export enum DataAttributes {
    MenuId = 'data-contextmenu-menu-id',
    DataId = 'data-contextmenu-data-id',
}

export enum ContextMenuEventType {
    Show = 'Show',
    Hide = 'Hide',
}
export interface ContextMenuEvent {
    type: ContextMenuEventType;
    clientX: number;
    clientY: number;
    data: any;
}

type ContextMenuTarget = EventTarget & Element;

const isTouchEvent = (event: any): event is TouchEvent => {
    return !!event.targetTouches;
};
const createMenuEvent = (type: ContextMenuEventType, event: MouseEvent | TouchEvent, data: any): ContextMenuEvent => {
    let clientX;
    let clientY;
    if (isTouchEvent(event)) {
        const touch = event.targetTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        type,
        clientX,
        clientY,
        data,
    };
};

const getData = (target: Nullable<ContextMenuTarget>) => {
    let data = undefined;
    if (target) {
        const dataId = target.getAttribute(DataAttributes.DataId);
        data = dataId ? fetchHandlerData(dataId) : undefined;
    }
    return data;
};

const GenericHandlers = {
    handleContextMenu: (event: MouseEvent, target: Nullable<ContextMenuTarget>) => {
        const menuId = target ? target.getAttribute(DataAttributes.MenuId) : null;
        const handler = menuId ? getLocalMenuHandler(menuId) : getGlobalMenuHandler();
        if (!handler) return;

        event.preventDefault();
        event.stopPropagation();

        const data = getData(target);
        const menuEvent = createMenuEvent(ContextMenuEventType.Show, event, data);

        hideAllMenus();
        handler(menuEvent);
    },
    handleTouchStart: (event: TouchEvent, target: Nullable<ContextMenuTarget>) => {
        const menuId = target ? target.getAttribute(DataAttributes.MenuId) : null;
        const handler = menuId ? getLocalMenuHandler(menuId) : getGlobalMenuHandler();
        if (!handler || hasLongPressTimeout()) return;

        const data = getData(target);
        const menuEvent = createMenuEvent(ContextMenuEventType.Show, event, data);
        addLongPressTimeout(() => {
            clearLongPressTimeout();
            hideAllMenus();
            handler(menuEvent);
        }, LONG_PRESS_DURATION_IN_MS);
    },
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    handleTouchCancel: (event: TouchEvent, target: Nullable<ContextMenuTarget>) => clearLongPressTimeout(),
} as const;

export const GlobalHandlers = {
    handleContextMenu: (e: MouseEvent) => GenericHandlers.handleContextMenu(e, null),
    handleTouchStart: (e: TouchEvent) => GenericHandlers.handleTouchStart(e, null),
    handleTouchMove: (e: TouchEvent) => GenericHandlers.handleTouchCancel(e, null),
    handleTouchEnd: (e: TouchEvent) => GenericHandlers.handleTouchCancel(e, null),
    handleTouchCancel: (e: TouchEvent) => GenericHandlers.handleTouchCancel(e, null),
} as const;

export const LocalHandlers = {
    handleContextMenu: (e: MouseEvent) => GenericHandlers.handleContextMenu(e, e.currentTarget as ContextMenuTarget),
    handleTouchStart: (e: TouchEvent) => GenericHandlers.handleTouchStart(e, e.currentTarget as ContextMenuTarget),
    handleTouchMove: (e: TouchEvent) => GenericHandlers.handleTouchCancel(e, e.currentTarget as ContextMenuTarget),
    handleTouchEnd: (e: TouchEvent) => GenericHandlers.handleTouchCancel(e, e.currentTarget as ContextMenuTarget),
    handleTouchCancel: (e: TouchEvent) => GenericHandlers.handleTouchCancel(e, e.currentTarget as ContextMenuTarget),
} as const;
