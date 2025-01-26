/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { currentDatasetAtom, loadingInfoAtom } from '@/app/_jotai/operation';
import { useAtom } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import styles from './Graph.module.scss';
import Chart from './Chart';
import { t } from 'i18next';
import useGuide, { tempGuideAtom } from '@/app/_components/guide/useGuide';
import { DbDefine, GuideKind } from '@/app/_types/types';
import { filterAtom } from '@/app/_jotai/useFilter';
import useData from '@/app/_jotai/useData';
import { useWatch } from '@/app/_util/useWatch';
import CreatePageDialog from '../CreatePageDialog';
import { Confirm } from '../Confirm';

type CreatePageDialogTarget = {
    target: DbDefine;
    position: {x: number; y: number};
}
export default function Graph() {
    const [ currentDataset ] = useAtom(currentDatasetAtom);
    const myRef = useRef(null as HTMLDivElement | null);
    const chartRef = useRef(null as Chart | null);
    const [ filter ] = useAtom(filterAtom);
    const [ , setTempGuide ] = useAtom(tempGuideAtom);
    const [ , setLoadingInfo ] = useAtom(loadingInfoAtom);
    const { operatedGuide } = useGuide();
    const { updatePosition, createRelation, removeRelation } = useData();
    const [ createPageDialogTarget, setCreatePageDialogTarget ] = useState<CreatePageDialogTarget|null>(null);

    // Cytoscape初期化
    useEffect(() => {
        console.log('Cytoscape初期化')
        if (myRef.current === null) {
            console.warn('CytoscapeRef要素が見つかりません');
            return;
        }
        if (chartRef.current !== null) {
            return;
        }

        chartRef.current = new Chart({
            container: myRef.current, 
            t,
            guideController: {
                setTempGuide(kind, onCancel) {
                    setTempGuide({
                        kind,
                        onCancel,
                    })
                },
                clearTempGuide() {
                    setTempGuide(undefined);
                },
                operatedGuide,
            },
            onNodeMove(args) {
                updatePosition(args);
            },
            onRelayoutStart() {
                setLoadingInfo({
                    loading: true,
                })
            },
            onRelayoutEnd() {
                setLoadingInfo({
                    loading: false,
                })
            },
            onCreatePageMenuClicked(args) {
                operatedGuide(GuideKind.CoreClick);
                setCreatePageDialogTarget(args);
            },
            onRelationCreated(args) {
                createRelation(args)
            },
            onRelationRemoveed(args) {
                removeRelation(args);
            },
            onError(msg) {
                Confirm.call({
                    message: msg,
                })
            },
        });

        return () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Datasetに変更が加わったら、チャート再描画
    useWatch(currentDataset, val => {
        chartRef.current?.setDataset(val ?? null);
        chartRef.current?.redraw();
    })

    useWatch(filter, val => {
        // 表示非表示を切り替え
        chartRef.current?.setFilter(val);
    })

    return (
        <>
            <div className={styles.Container}>
                <div ref={myRef} className={styles.Chart} />
            </div>
            {createPageDialogTarget &&
                <CreatePageDialog show onHide={()=>setCreatePageDialogTarget(null)} target={createPageDialogTarget}/>
            }
        </>
    );
}