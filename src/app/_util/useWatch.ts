import { useEffect, useRef } from "react";

type Options = {
    immediate?: boolean;
}
/**
 * 指定のリアクティブな値の変更を検知して、変更時にコールバックするカスタムフック
 * @param reactiveVal 変更検知する値
 * @param callback 変更時コールバック
 */
export function useWatch<T>(reactiveVal: T, callback: (newVal: T, oldVal: T) => void, options?: Options) {
    const prevVal = useRef(structuredClone(reactiveVal));
    const immediateDoneRef = useRef(options?.immediate ? false : true);

    useEffect(() => {
        const isChange = function() {
            if (!immediateDoneRef.current) {
                // 初回実行する場合
                immediateDoneRef.current = true;
                return true;
            }
            if (typeof reactiveVal === 'object') {
                return JSON.stringify(reactiveVal) !== JSON.stringify(prevVal.current);
            } else {
                return reactiveVal !== prevVal.current;
            }
        }();
    
        if (isChange) {
            const newVal = structuredClone(reactiveVal)
            callback(newVal, prevVal.current);
            prevVal.current = newVal;
        }
    }, [reactiveVal, callback])

}
