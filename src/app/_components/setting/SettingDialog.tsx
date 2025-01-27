import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { hasTokenAtom } from '@/app/_util/useApi';
import { useTranslation } from 'react-i18next';
import * as EventController from '@/app/_util/EventController';
import { Confirm } from '../Confirm';
import { useAtom } from 'jotai';
import { dataSetsAtom } from '@/app/_jotai/useData';
import useData from '@/app/_jotai/useData';
import { useAtomCallback } from 'jotai/utils';
import { currentDatasetIdAtom } from '@/app/_jotai/operation';
import SelectDatasetBody from './SelectDatasetBody';
import SelectDatabaseBody from './SelectDatabaseBody';
import SelectRelationBody, { RelationKey } from './SelectRelationBody';
import SelectFilterPropertyBody from './SelectFilterPropertyBody';
import { createCallable } from 'react-call';
import { DbDefine, NetworkDefine, PropertyKey } from '@/app/_types/types';
import useSetting from './useSetting';

enum Step {
    SelectDataset,
    SelectDb,
    SelectRelationCol,
    SelectFilterCol,
}

export type DbKey = {
    workspaceId: string;
    dbId: string;
}
export type WorkData = {
    // 基点データベースID
    baseDb: DbKey;
    targetWorkspaceDbList: DbDefine[];  // 基点データベースの属するワークスペースに存在するDB一覧
    targetRelations: RelationKey[];     // 使用するリレーション項目
}
export type DatasetInfo = {
    id: string;
    networkDefine: NetworkDefine;  // 編集の場合、変更前のものをセットする
}
export const SettingDialog = createCallable<void, void>(({ call }) => {
    const [ step, setStep ] = useState<Step>(Step.SelectDataset);
    // 登録・編集対象のデータセット情報
    const [ selectDataset, setSelectDataset ] = useState<DatasetInfo|undefined>();
    const [ workData, setWorkData ] = useState<WorkData|undefined>();
    const [ datasets ] = useAtom(dataSetsAtom);
    const { t } = useTranslation();
    const [ hasToken ] = useAtom(hasTokenAtom);
    const { loadLatestData: getData, createDataset, updateNetworkDefine } = useData();

    const onHide = useCallback(() => {
        call.end();
    }, [call]);

    console.log('hasToken', hasToken)

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
            setSelectDataset(undefined);
            setStep(Step.SelectDb);
        } else {
            setSelectDataset(undefined);
            setStep(Step.SelectDataset);
        }
        // check token
        // console.log('hasToken', hasToken)
        if (!hasToken) {
            // executeOAuth();
            return;
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // useEffect(() => {
    //     console.log('hasToken', hasToken)
    // }, [hasToken])

    // const dbList = useMemo(() => {
    //     const target = workspaceList.find(ws => ws.workspaceId === networkDefine?.workspaceId);
    //     return target ? target.dbDefines : [];
    // }, [workspaceList, networkDefine]);

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

        // setLoading(true);
        try {
            await getData();

            EventController.fireEvent(EventController.Event.ChartReLayout);
        } catch (e) {
            Confirm.call({
                message: t('Error_GetData') + '\n' + e,
            })
        } finally {
            // setLoading(false);
        }

    }, [t, getData]);

    const { networkDefine } = useSetting({
        workData: {
            baseDb: workData?.baseDb ?? { dbId: '', workspaceId: '' },
            targetRelations: workData?.targetRelations ?? [],
            targetWorkspaceDbList: workData?.targetWorkspaceDbList ?? [],
        }
    });
    const handleSave = useAtomCallback(
        useCallback((get, set, targets: PropertyKey[]) => {
            if (!workData) return;

            const dbList = networkDefine.dbList.map((item): DbDefine => {
                return {
                    id: item.id,
                    icon: item.icon,
                    name: item.name,
                    properties: item.properties.filter(prop => {
                        if (!targets) return false;
                        const hit = targets.some(t => t.dbId === item.id && t.propertyId === prop.id);
                        return hit;
                    }),
                    nodeStyle: item.nodeStyle,
                }
            })
            const newNetWorkDefine: NetworkDefine = {
                workspaceId: networkDefine.workspaceId,
                dbList,
                relationList: networkDefine.relationList,
            }

            // 定義保存 & カレントデータセット切り替え
            if (!selectDataset) {
                // 新規追加
                const id = createDataset(newNetWorkDefine);
                set(currentDatasetIdAtom, id)
            } else{
                // TODO: スタイル情報をマージ
                // 更新
                updateNetworkDefine({
                    datasetId: selectDataset.id,
                    networkDefine: newNetWorkDefine,
                    dataClear: true,
                })
                set(currentDatasetIdAtom, selectDataset.id)
            }
            // 最新データ取得
            setReserveLoadLatestData(true);
    
            call.end();
        }, [call, createDataset, networkDefine.dbList, networkDefine.relationList, networkDefine.workspaceId, selectDataset, updateNetworkDefine, workData])
    )

    const handleNextSelectDataset = useCallback((dataset?: DatasetInfo) => {
        setSelectDataset(dataset);
        if (dataset) {
            const networkDefine = dataset.networkDefine;
            setWorkData({
                baseDb: {
                    dbId: networkDefine.dbList[0].id,
                    workspaceId: networkDefine.workspaceId,
                },
                targetWorkspaceDbList: networkDefine.dbList,
                targetRelations: networkDefine.relationList.map(rel => {
                    return {
                        dbId: rel.from.dbId,
                        propertyId: rel.from.propertyId,
                    }
                })
            })
        }
        setStep(cur => cur + 1);
    }, [])

    const handleNextSelectDatabase = useCallback((targetWorkspaceDbList: DbDefine[], baseDbKey: DbKey) => {
        setWorkData(cur => {
            return {
                baseDb: baseDbKey,
                targetWorkspaceDbList,
                targetRelations: cur?.targetRelations ?? [],
            }
        })
        setStep(cur => cur + 1);
    }, [])

    const handleNextSelectRealtion = useCallback((rels: RelationKey[]) => {
        setWorkData(cur => {
            if (!cur)  {
                console.warn('想定外');
                return cur;
            }
            return {
                baseDb: cur.baseDb,
                targetWorkspaceDbList: cur.targetWorkspaceDbList,
                targetRelations: rels,
            }
        })
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
                return <SelectDatabaseBody
                        onNext={handleNextSelectDatabase}
                        onBack={onBack}
                        workData={workData} />;
            case Step.SelectRelationCol:
                if (!workData) {
                    console.warn('想定外')
                    return null;
                }
                return <SelectRelationBody
                        workData={workData}
                        onNext={handleNextSelectRealtion}
                        onBack={onBack} />;
            case Step.SelectFilterCol:
                if (!workData) {
                    console.warn('想定外')
                    return null;
                }
                return <SelectFilterPropertyBody
                        workData={workData}
                        onSave={handleSave}
                        onBack={onBack} />
        }
    }, [step, handleNextSelectDataset, onHide, handleNextSelectDatabase, onBack, workData, handleNextSelectRealtion, handleSave])

    return (
        <Modal show onHide={onHide} backdrop="static">
            <Modal.Header closeButton>
                {t('Setting')}
            </Modal.Header>
            {body}
        </Modal>
    )
})
