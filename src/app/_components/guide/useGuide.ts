import { atom } from "jotai";
import { TempGuide } from "../../_types/types";
import { atomWithStorage, useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

/**
 * 操作説明
 * lang.tsのGuide_XXXXが対応する
 */
export enum GuideKind {
    NodeClick = 'NodeClick',
    CoreClick = 'CoreClick',
    EdgeClick = 'EdgeClick',
}

export const operatedGuidesAtom = atomWithStorage<GuideKind[]>('operatedGuides', []);

export const tempGuideAtom = atom<TempGuide|undefined>();

export default function useGuide() {

    /**
     * 指定のガイドを操作済みにより表示終了する
     */
    const operatedGuide = useAtomCallback(
        useCallback((get, set, kind: GuideKind) => {
            set(operatedGuidesAtom, (cur) => {
                return cur.concat(kind);
            })
        }, [])
    )

    return {
        operatedGuide,
    }
}