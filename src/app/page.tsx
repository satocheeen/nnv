"use client"
import styles from "./page.module.scss";
import { useCallback, useEffect } from "react";
import { SettingDialog } from "./_components/setting/SettingDialog";
import { dataSetsAtom } from "./_jotai/useData";
import { useAtomCallback } from "jotai/utils";
import { Spinner } from "react-bootstrap";
import { useAtom } from "jotai";
import { loadingInfoAtom, visitedAtom } from "./_jotai/operation";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Graph from "./_components/chart/Graph";
import { oAuthRedirectStateAtom } from "./_util/useApi";

// const Graph = dynamic(() => import("./_components/chart/Graph"), { ssr: false });
const ControlPanel = dynamic(() => import("./_components/panel/ControlPanel"), { ssr: false });
const Guide = dynamic(() => import("./_components/guide/Guide"), { ssr: false });

// ダイアログの二重起動を防ぐためのもの
let settingDlgPromise: Promise<void> | null = null;
export default function Home() {
    const router = useRouter();

    const checkShowSettingDialog = useAtomCallback(
        useCallback(async(get, set) => {
            // 最初の訪問時はWelcome画面に遷移
            const visited = get(visitedAtom);
            if (!visited) {
                router.push('/welcome');
                return;
            }
            // OAuthのリダイレクトStateがあるなら遷移する
            const oAuthRedirectState = get(oAuthRedirectStateAtom);
            if (oAuthRedirectState?.state === 'select-database') {
                // 設定画面を開く
                console.log('open1')
                settingDlgPromise = SettingDialog.call({
                    datasetId: oAuthRedirectState.datasetId,
                });
                set(oAuthRedirectStateAtom, undefined);
                await settingDlgPromise;
                console.log('reset state');
                settingDlgPromise = null;
                return;
            }
            const datasets = get(dataSetsAtom);
            if (datasets.length === 0 && settingDlgPromise === null) {
                // データセットが存在しない場合も、設定画面を開く
                console.log('open2')
                SettingDialog.call({
                    datasetId: 'new',
                });
                return;
            }
        }, [router])
    )
    
    // 起動時
    useEffect(() => {
        checkShowSettingDialog();
    }, [checkShowSettingDialog]);

    const [ loadingInfo ] = useAtom(loadingInfoAtom);

    return (
        <div>
            <Guide />
            <div className={styles.Graph}>
                <Graph />
            </div>
            <ControlPanel />
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
