import { atom, useAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useMemo } from "react";
import { NetworkDefine } from "../_types/types";

export enum Step {
    SelectDataset,
    SelectDb,
    SelectRelationCol,
    SelectFilterCol,
}

const stepAtom = atom(Step.SelectDataset);
const selectDatasetIdAtom = atom<string|undefined>();
const networkDefineAtom = atom<NetworkDefine|undefined>();

/**
 * Notion認証へ遷移した場合に復帰できるように
 * 復帰に必要な情報を状態保存している。
 */
export default function useSettingStore() {
    const initialize = useAtomCallback(
        useCallback((get, set) => {
            set(stepAtom, Step.SelectDataset);
            set(selectDatasetIdAtom, undefined);
            set(networkDefineAtom, undefined);
        }, [])
    )

    const [ step, setStep ] = useAtom(stepAtom);

    // 選択中のデータセット
    const [ selectDatasetId, setSelectDatasetId ] = useAtom(selectDatasetIdAtom);

    // 設定途中のNetworkDefine
    const [ networkDefine, setNetworkDefine ] = useAtom(networkDefineAtom);

    const hasData = useMemo(() => {
        return !(step === Step.SelectDataset && selectDatasetId === undefined && networkDefine === undefined);
    }, [step, selectDatasetId, networkDefine]);


    return {
        initialize,
        hasData,
        step,
        setStep,
        selectDatasetId,
        setSelectDatasetId,
        networkDefine,
        setNetworkDefine,
    };
}