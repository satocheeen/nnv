import { atom } from "jotai";
import { DbDefine, DialogParam } from "../_types/types";
import { dataSetsAtom } from "./useData";

export const visitedAtom = atom(false);
export const currentDatasetIdAtom = atom<string|undefined>();

export const currentDatasetAtom = atom((get) => {
    const currentDatasetId = get(currentDatasetIdAtom);
    const datasets = get(dataSetsAtom);
    return datasets.find(ds => ds.id === currentDatasetId);
})

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

export const loadingInfoAtom = atom<{
    loading: boolean;
    status?: string;
}>({
    loading: false,
})
