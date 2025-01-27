import { atom } from "jotai";
import { GuideKind, TempGuide } from "../../_types/types";
import { atomWithStorage, useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

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