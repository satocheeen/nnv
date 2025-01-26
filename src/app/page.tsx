"use client"
import dynamic from "next/dynamic";
import styles from "./page.module.scss";
import useSettingStore from "./_jotai/useSettingStore";
import { useEffect } from "react";
import { SettingDialog } from "./_components/setting/SettingDialog";
import { dataSetsAtom } from "./_jotai/useData";
import { useAtom } from "jotai";
import Graph from "./_components/chart/Graph";

// jotaiのatomWithStorageのgetOnInitを効かせるために、SSR=falseで動的インポート
const ControlPanel = dynamic(() => import("./_components/panel/ControlPanel"), { ssr: false });

export default function Home() {
    const { hasData } = useSettingStore();
    const [ datasets ] = useAtom(dataSetsAtom);

    // 起動時
    useEffect(() => {
        // 設定画面の情報があるなら、設定画面を開く
        if (hasData) {
            SettingDialog.call();
        }
        if (datasets.length === 0) {
            // データセットが存在しない場合も、設定画面を開く
            SettingDialog.call();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
