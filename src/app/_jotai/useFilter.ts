import { atom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

export type Filter = {
    categories: {[id: string]: boolean};   // key = DBID-属性ID-カテゴリID, value = 表示or非表示
    keywords: string[]; // キーワード。AND検索。
}

export const filterAtom = atom<Filter>({
    categories: {},
    keywords: [],
});

export default function useFilter() {
    const setKeywordFilter = useAtomCallback(
        useCallback((get, set, keywords: string[]) => {
            set(filterAtom, cur => {
                return {
                    categories: cur.categories,
                    keywords,
                }
            })
        }, [])
    )

    const clearFilter = useAtomCallback(
        useCallback((get, set) => {
            set(filterAtom, cur => {
                const categories = Object.assign({}, cur.categories);
                Object.keys(categories).forEach(key => {
                    categories[key] = true;
                })
                return {
                    categories,
                    keywords: [],
                }
            })
        }, [])
    )

    return {
        setKeywordFilter,
        clearFilter,
    }
}