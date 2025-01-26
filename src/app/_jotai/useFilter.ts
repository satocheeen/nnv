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

export type CategoryFilterItem = {
    dbId: string;
    propertyId: string;
    optionId: string;
    isShow: boolean;
}
export default function useFilter() {
    /**
     * 指定のカテゴリのフィルタ設定を切り替える
     * @param payload 
     */
    const setCategoryFilter = useAtomCallback(
        useCallback((get, set, categories: CategoryFilterItem[]) => {
            set(filterAtom, cur => {
                const newCategories = structuredClone(cur.categories);
                categories.forEach(category => {
                    const key = category.dbId + '-' + category.propertyId + '-' + category.optionId;
                    newCategories[key] = category.isShow;
                });
                return {
                    categories: newCategories,
                    keywords: cur.keywords,
                }
            })
        }, [])
    )
    
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
        setCategoryFilter,
        setKeywordFilter,
        clearFilter,
    }
}