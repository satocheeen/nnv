"use client"
import styles from "./page.module.scss";
import useSettingStore from "./_jotai/useSettingStore";
import { useCallback, useEffect } from "react";
import { SettingDialog } from "./_components/setting/SettingDialog";
import { dataSetsAtom } from "./_jotai/useData";
import Graph from "./_components/chart/Graph";
import { useAtomCallback } from "jotai/utils";
import ControlPanel from "./_components/panel/ControlPanel";

export default function Home() {
    const { hasData } = useSettingStore();

    const checkShowSettingDialog = useAtomCallback(
        useCallback((get) => {
            const datasets = get(dataSetsAtom);
            // 設定画面の情報があるなら、設定画面を開く
            if (hasData) {
                SettingDialog.call();
            }
            if (datasets.length === 0) {
                // データセットが存在しない場合も、設定画面を開く
                SettingDialog.call();
            }
        }, [hasData])
    )
    
    // 起動時
    useEffect(() => {
        // storageからの値読み込みが完了するのを待つ
        setTimeout(checkShowSettingDialog, 500)
    }, [checkShowSettingDialog]);

    return (
        <div>
            {/* <Guide /> */}
            <div className={styles.Graph}>
                <Graph />
            </div>
            <ControlPanel />
            {/* {createPageDialogTarget &&
                <CreatePageDialog show={showCreatePageDialog} onHide={onCreatePageDialogHide} target={createPageDialogTarget}/>
            } */}
            {/* <AlertDialog /> */}
        </div>
    );
}
