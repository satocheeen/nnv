/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { currentDatasetAtom, loadingInfoAtom } from '@/app/_jotai/operation';
import { useAtom } from 'jotai';
import React, { useEffect, useRef } from 'react';
import styles from './Graph.module.scss';
import Chart from './Chart';
import { t } from 'i18next';
import useGuide, { tempGuideAtom } from '@/app/_jotai/useGuide';
import { GuideKind } from '@/app/_types/types';
import { filterAtom } from '@/app/_jotai/useFilter';

export default function Graph() {
    const [ currentDataset ] = useAtom(currentDatasetAtom);
    const myRef = useRef(null as HTMLDivElement | null);
    const chartRef = useRef(null as Chart | null);
    const [ filter ] = useAtom(filterAtom);
    const [ , setTempGuide ] = useAtom(tempGuideAtom);
    const [ , setLoadingInfo ] = useAtom(loadingInfoAtom);
    const { operatedGuide } = useGuide();

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
    }, [operatedGuide, setLoadingInfo, setTempGuide]);

    useEffect(() => {
        if (!currentDataset) {
            return;
        }
        chartRef.current?.setDataset(currentDataset);
        chartRef.current?.redraw();
    }, [currentDataset, currentDataset?.dataMap, currentDataset?.edges]);

    useEffect(() => {
        // 表示非表示を切り替え
        chartRef.current?.setFilter(filter);
    }, [filter, currentDataset?.dataMap]);

    // if (!currentDataset) return null;
    return (
        <div className={styles.Container}>
            <div ref={myRef} className={styles.Chart} />
        </div>
    );
}