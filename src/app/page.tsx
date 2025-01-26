"use client"
import styles from "./page.module.scss";
import useSettingStore from "./_jotai/useSettingStore";
import { useCallback, useEffect } from "react";
import { SettingDialog } from "./_components/setting/SettingDialog";
import { dataSetsAtom } from "./_jotai/useData";
import Graph from "./_components/chart/Graph";
import { useAtomCallback } from "jotai/utils";
import ControlPanel from "./_components/panel/ControlPanel";
import { Spinner } from "react-bootstrap";
import { useAtom } from "jotai";
import { loadingInfoAtom } from "./_jotai/operation";

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
    }, []);

    const [ loadingInfo ] = useAtom(loadingInfoAtom);

    return (
        <div onContextMenu={(evt)=>evt.preventDefault()}>
            {/* <Guide /> */}
            <div className={styles.Graph}>
                <Graph />
            </div>
            <ControlPanel />
            {/* {createPageDialogTarget &&
                <CreatePageDialog show={showCreatePageDialog} onHide={onCreatePageDialogHide} target={createPageDialogTarget}/>
            } */}
            {loadingInfo.loading &&
                <div className={styles.SpinnerOverlay}>
                    <div className={styles.GraphSpinner}>
                        <Spinner animation='border' variant='info'/>
                    </div>
                    <p>{loadingInfo.status}</p>
                </div>
            }
        </div>
    );
}
