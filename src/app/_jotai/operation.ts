import { atom } from "jotai";
import { DbDefine, DialogParam, Filter, Guide, GuideKind, TempGuide } from "../_types/types";

export const visitedAtom = atom(false);
export const currentDatasetIdAtom = atom<string|undefined>();
export const filterAtom = atom<Filter>({
    categories: {},
    keywords: [],
});
type CreatePageDialogTargetType = {
    dbDefine: DbDefine;
    position: {x: number; y: number};
}
export const createPageDialogTargetAtom = atom<CreatePageDialogTargetType|undefined>();

type AlertDialogInfoType = {
    show: boolean;
    dialogParam: DialogParam | undefined;
};
export const alertDialogInfoAtom = atom<AlertDialogInfoType>({
    show: false,
    dialogParam: undefined,
})

const initGuides = Object.keys(GuideKind).map((kind) => {
    return {
        kind: kind as GuideKind,
        operationed: false,
    }
});
export const guidesAtom = atom<Guide[]>(initGuides);

export const tempGuideAtom = atom<TempGuide|undefined>();

export const loadingInfoAtom = atom({
    loading: false,
})
