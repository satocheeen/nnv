import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import useApi, { hasTokenAtom } from '@/app/_util/useApi';
import { useTranslation } from 'react-i18next';
import * as EventController from '@/app/_util/EventController';
import { WorkspaceInfo } from '@/app/api/get_dblist/types';
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
import SelectFilterPropertyBody from './SelectFilterPropertyBody';
import { createCallable } from 'react-call';
import { NetworkDefine } from '@/app/_types/types';

enum Step {
    SelectDataset,
    SelectDb,
    SelectRelationCol,
    SelectFilterCol,
}

export const SettingDialog = createCallable<void, void>(({ call }) => {
    const [ step, setStep ] = useState<Step>(Step.SelectDataset);
    const [ selectDatasetId, setSelectDatasetId ] = useState<string|undefined>();
    const [ networkDefine, setNetworkDefine ] = useState<NetworkDefine>({
        workspaceId: '',
        dbList: [],
        relationList: [],
    });
    const [loading, setLoading] = useState(false);
    const [workspaceList, setWorkspaceList] = useState([] as WorkspaceInfo[]);
    const [ datasets ] = useAtom(dataSetsAtom);
    const { t } = useTranslation();
    const { getDbList, oAuth } = useApi();
    const [ hasToken ] = useAtom(hasTokenAtom);
    const { loadLatestData: getData, createDataset, updateNetworkDefine } = useData();

    const onHide = useCallback(() => {
        call.end();
    }, [call]);

    // 初期化
    // TODO: 記述場所見直し
    useEffect(() => {
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
        if (!hasToken) {
            oAuth();
            return;
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // DB一覧読み込み
    useEffect(() => {
        const loadDbList = async() => {
            setLoading(true);
            try {
                const workspaceInfo = await getDbList();
                setWorkspaceList(workspaceInfo);
            } catch(e) {
                Confirm.call({
                    message: t('Error_GetDbList') + '\n' + e,
                })
            } finally {
                setLoading(false);
            }
        }
        loadDbList();
    }, [getDbList, t]);

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
        }

    }, [t, getData]);

    const handleSave = useAtomCallback(
        useCallback((get, set, def: NetworkDefine) => {
            if (!selectDatasetId) return;

            // 定義保存 & カレントデータセット切り替え
            if (selectDatasetId === 'new') {
                // 新規追加
                const id = createDataset(def);
                set(currentDatasetIdAtom, id)
            } else{
                // 更新
                updateNetworkDefine({
                    datasetId: selectDatasetId,
                    networkDefine: def,
                    dataClear: true,

                })
                set(currentDatasetIdAtom, selectDatasetId)
            }
            // 最新データ取得
            setReserveLoadLatestData(true);
    
            call.end();
        }, [call, createDataset, selectDatasetId, updateNetworkDefine])
    )

    const handleNextSelectDataset = useCallback((datasetId: string, networkDefine: NetworkDefine) => {
        setSelectDatasetId(datasetId);
        setNetworkDefine(networkDefine);
        setStep(cur => cur + 1);
    }, [])

    const handleNext = useCallback((def: NetworkDefine) => {
        setNetworkDefine(def);
        setStep(cur => cur + 1);
    }, [])

    const onBack = useCallback(() => {
        setStep(step - 1);
    }, [step, setStep]);

    const body = useMemo(() => {
        switch(step) {
            case Step.SelectDataset:
                return <SelectDatasetBody onNext={handleNextSelectDataset} onClose={onHide} />
            case Step.SelectDb:
                if (loading) {
                    return (
                        <div className={styles.SpinnerArea}>
                            <Spinner animation='border' variant='info'/>
                        </div>
                    );
                }
                return <SelectDatabaseBody
                        onNext={handleNext}
                        onBack={onBack}
                        networkDefine={networkDefine}
                        workspaceList={workspaceList} />;
            case Step.SelectRelationCol:
                return <SelectRelationBody
                        networkDefine={networkDefine}
                        dbList={dbList}
                        onNext={handleNext}
                        onBack={onBack} />;
            case Step.SelectFilterCol:
                return <SelectFilterPropertyBody
                        networkDefine={networkDefine}
                        onSave={handleSave}
                        onBack={onBack} />
        }
    }, [step, handleNextSelectDataset, onHide, loading, handleNext, onBack, networkDefine, workspaceList, dbList, handleSave])

    return (
        <Modal show onHide={onHide} backdrop="static">
            <Modal.Header closeButton>
                {t('Setting')}
            </Modal.Header>
            {body}
        </Modal>
    )
})
