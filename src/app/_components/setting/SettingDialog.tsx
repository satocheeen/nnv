import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
// import SelectFilterPropertyBody from './SelectFilterPropertyBody';
import useApi from '@/app/_util/useApi';
import { useTranslation } from 'react-i18next';
import * as EventController from '@/app/_util/EventController';
import { WorkspaceInfo } from '@/app/api/get_dblist/types';
import useSettingStore, { Step } from '@/app/_jotai/useSettingStore';
import { Confirm } from '../Confirm';
import styles from './SettingDialog.module.scss';
import { useAtom } from 'jotai';
import { dataSetsAtom } from '@/app/_jotai/useData';
import useData from '@/app/_jotai/useData';
import { useAtomCallback } from 'jotai/utils';
import { currentDatasetIdAtom } from '@/app/_jotai/operation';
import SelectDatasetBody from './SelectDatasetBody';
import SelectDatabaseBody from './SelectDatabaseBody';
import SelectRelationBody from './SelectRelationBody';

type Props = {
    show: boolean;
    onHide: () => void;
}
export default function SettingDialog(props: Props) {
    const { step, setStep, selectDatasetId, setSelectDatasetId, networkDefine, initialize } = useSettingStore();
    const [loading, setLoading] = useState(false);
    const [workspaceList, setWorkspaceList] = useState([] as WorkspaceInfo[]);
    const [ datasets ] = useAtom(dataSetsAtom);
    const { t } = useTranslation();
    const api = useApi();
    const { getData, createDataset, updateNetworkDefine } = useData();

    const onHide = useCallback(() => {
        initialize();
        props.onHide();
    }, [props, initialize]);

    // 初期化
    useEffect(() => {
        if (!props.show) {
            return;
        }
        console.log('initialize');
        if (step !== Step.SelectDataset) {
            // 以前の状態が残っている場合
            console.log('step', step);
            return;
        }
        if (datasets.length === 0) {
            // Datasetが０個の場合は、SelectDbから
            setSelectDatasetId('new');
            setStep(Step.SelectDb);
        } else {
            setSelectDatasetId(undefined);
            setStep(Step.SelectDataset);
        }
        // check token
        if (!api.hasToken) {
            api.oAuth();
            return;
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.show]);

    // DB一覧読み込み
    const loadDbList = useCallback(async() => {
        setLoading(true);
        try {
            const workspaceInfo = await api.getDbList();
            setWorkspaceList(workspaceInfo);
        } catch(e) {
            Confirm.call({
                message: t('Error_GetDbList') + '\n' + e,
            })
        } finally {
            setLoading(false);
        }
    }, [t, api]);

    useEffect(() => {
        if (!props.show) {
            return;
        }
        loadDbList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.show]);

    const dbList = useMemo(() => {
        const target = workspaceList.find(ws => ws.workspaceId === networkDefine?.workspaceId);
        return target ? target.dbDefines : [];
    }, [workspaceList, networkDefine]);

    // 直接呼ぶと、新しいdatasetが追加された状態になっていないので、reserveフラグ経由で呼び出す
    // TODO: 見直し
    const [reserveLoadLatestData, setReserveLoadLatestData] = useState(false);
    useEffect(() => {
        if (reserveLoadLatestData) {
            loadLatestData();
            setReserveLoadLatestData(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reserveLoadLatestData]);

    // 最新のストア状態で実行したいので、useCallbackは使用していない
    const loadLatestData = useCallback(async() => {
        // 最新データ取得
        await Confirm.call({
            message: t('Msg_Load_LatestData'),
        })

        setLoading(true);
        try {
            await getData();

            EventController.fireEvent(EventController.Event.ChartReLayout);
        } catch (e) {
            Confirm.call({
                message: t('Error_GetData') + '\n' + e,
            })
        } finally {
            setLoading(false);
            initialize();
        }

    }, [t, getData, initialize]);

    const onSave = useAtomCallback(
        useCallback((get, set) => {
            if (!selectDatasetId || !networkDefine) return;

            // 定義保存 & カレントデータセット切り替え
            if (selectDatasetId === 'new') {
                // 新規追加
                const id = createDataset(networkDefine);
                set(currentDatasetIdAtom, id)
            } else{
                // 更新
                updateNetworkDefine({
                    datasetId: selectDatasetId,
                    networkDefine,
                    dataClear: true,

                })
                set(currentDatasetIdAtom, selectDatasetId)
            }
            // 最新データ取得
            setReserveLoadLatestData(true);
    
            props.onHide();
        }, [createDataset, networkDefine, props, selectDatasetId, updateNetworkDefine])
    )

    const onNext = useCallback(() => {
        setStep(step + 1);
    }, [step, setStep])

    const onBack = useCallback(() => {
        setStep(step - 1);
    }, [step, setStep]);

    const body = useMemo(() => {
        switch(step) {
            case Step.SelectDataset:
                return <SelectDatasetBody onNext={onNext} onClose={onHide} />
            case Step.SelectDb:
                if (loading) {
                    return (
                        <div className={styles.SpinnerArea}>
                            <Spinner animation='border' variant='info'/>
                        </div>
                    );
                }
                return <SelectDatabaseBody onNext={onNext} onBack={onBack} workspaceList={workspaceList} />;
            case Step.SelectRelationCol:
                return <SelectRelationBody dbList={dbList} onNext={onNext} onBack={onBack} />;
            // case Step.SelectFilterCol:
            //     return <SelectFilterPropertyBody onSave={onSave} onBack={onBack} />
        }
    }, [step, workspaceList, loading, dbList, onNext, onBack, onHide, onSave])

    return (
        <Modal show={props.show} onHide={onHide} backdrop="static">
            <Modal.Header closeButton>
                {t('Setting')}
            </Modal.Header>
            {body}
        </Modal>
    )
}
