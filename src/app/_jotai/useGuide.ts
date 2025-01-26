import { atom } from "jotai";
import { Guide, GuideKind, TempGuide } from "../_types/types";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

const initGuides = Object.keys(GuideKind).map((kind) => {
    return {
        kind: kind as GuideKind,
        operationed: false,
    }
});
export const guidesAtom = atom<Guide[]>(initGuides);

export const tempGuideAtom = atom<TempGuide|undefined>();

export default function useGuide() {

    /**
     * 指定のガイドを操作済みにより表示終了する
     */
    const operatedGuide = useAtomCallback(
        useCallback((get, set, kind: GuideKind) => {
            set(guidesAtom, (cur) => {
                const newVal = cur.map(guide => {
                    if (guide.kind !== kind) return guide;
                    return {
                        kind: guide.kind,
                        operationed: true,
                    } as Guide;
                })
                return newVal;
            })
        }, [])
    )

    return {
        operatedGuide,
    }
}