/**
 * non reactive event controller
 */
export enum Event {
    ChartReLayout,  // チャート再レイアウト命令
}
type CallbackFunction = (options?: object) => void;
type Listener = {
    id: number;
    event: Event;
    callback: CallbackFunction;
}
let listenerList = [] as Listener[];
// const listenerMap = {} as {[event: number]: CallbackFunction[]};

let id = 0;

/**
 * 指定のイベントに対するリスナーを登録する
 * @param event listenするイベント
 * @param callback イベント発火時のコールバック関数
 */
export function addEventListener(event: Event, callback: CallbackFunction): number {
    listenerList.push({
        id: ++id,
        event,
        callback,
    });
    console.log('addEventListener', listenerList);
    return id;
}
export function removeEventListener(listenerId: number) {
    listenerList = listenerList.filter(listener => listener.id !== listenerId);
    console.log('removeEventListener', listenerList);
}
export function fireEvent(event: Event, options?: object) {
    listenerList.forEach(listener => {
        if (listener.event === event) {
            listener.callback(options);
        }
    })
}
