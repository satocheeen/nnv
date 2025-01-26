/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { currentDatasetAtom, loadingInfoAtom } from '@/app/_jotai/operation';
import { useAtom } from 'jotai';
import React, { useCallback, useEffect, useRef } from 'react';
import styles from './Graph.module.scss';
import Chart from './Chart';
import { t } from 'i18next';
import useGuide, { tempGuideAtom } from '@/app/_jotai/useGuide';
import { GuideKind } from '@/app/_types/types';
import { filterAtom } from '@/app/_jotai/useFilter';
import useData from '@/app/_jotai/useData';
import { addEventListener, removeEventListener, Event } from '@/app/_util/EventController';
import { useAtomCallback } from 'jotai/utils';
import { useWatch } from '@/app/_util/useWatch';

export default function Graph() {
    const [ currentDataset ] = useAtom(currentDatasetAtom);
    const myRef = useRef(null as HTMLDivElement | null);
    const chartRef = useRef(null as Chart | null);
    const [ filter ] = useAtom(filterAtom);
    const [ , setTempGuide ] = useAtom(tempGuideAtom);
    const [ , setLoadingInfo ] = useAtom(loadingInfoAtom);
    const { operatedGuide } = useGuide();
    const { updatePosition } = useData();

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
            },
            onRelationCreated(args) {
                
            },
            onRelationRemoveed(args) {
                
            },
            onError(msg) {
                
            },
        });

        return () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        }
    }, [operatedGuide, setLoadingInfo, setTempGuide, updatePosition]);

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
        <div className={styles.Container}>
            <div ref={myRef} className={styles.Chart} />
        </div>
    );
}