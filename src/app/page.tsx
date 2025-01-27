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

export default function Home() {
    const router = useRouter();

    const checkShowSettingDialog = useAtomCallback(
        useCallback((get) => {
            // 最初の訪問時はWelcome画面に遷移
            const visited = get(visitedAtom);
            if (!visited) {
                router.push('/welcome');
                return;
            }
            // OAuthのリダイレクトStateがあるなら遷移する
            const oAuthRedirectState = get(oAuthRedirectStateAtom);
            if (oAuthRedirectState === 'select-database') {
                // 設定画面を開く
                SettingDialog.call();
            }
            const datasets = get(dataSetsAtom);
            if (datasets.length === 0) {
                // データセットが存在しない場合も、設定画面を開く
                SettingDialog.call();
            }
        }, [router])
    )
    
    // 起動時
    useEffect(() => {
        checkShowSettingDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
