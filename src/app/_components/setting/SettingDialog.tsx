import React, { useCallback, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import * as EventController from '@/app/_util/EventController';
import { Confirm } from '../Confirm';
import useData, { dataSetsAtom } from '@/app/_jotai/useData';
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

type Props = {
    datasetId?: string;
}
export const SettingDialog = createCallable<Props, void>(({ call, datasetId }) => {
    // 登録・編集対象のデータセット情報
    const [ selectedDatasetId, setSelectedDatasetId ] = useState<string|undefined>(datasetId);
    const [ step, setStep ] = useState<Step>(datasetId ? Step.SelectDb : Step.SelectDataset);
    const [ workData, setWorkData ] = useState<WorkData|undefined>();
    const { t } = useTranslation();
    const { loadLatestData: getData, createDataset, updateNetworkDefine } = useData();

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
            if (!workData || !selectedDatasetId) {
                console.warn('想定外', workData, selectedDatasetId);
                return;
            }

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
            if (selectedDatasetId === 'new') {
                // 新規追加
                const id = createDataset(newNetWorkDefine);
                set(currentDatasetIdAtom, id)
            } else{
                // TODO: スタイル情報をマージ
                // 更新
                updateNetworkDefine({
                    datasetId: selectedDatasetId,
                    networkDefine: newNetWorkDefine,
                    dataClear: true,
                })
                set(currentDatasetIdAtom, selectedDatasetId)
            }
            // 最新データ取得
            loadLatestData();
    
            call.end();
        }, [call, createDataset, loadLatestData, networkDefine.dbList, networkDefine.relationList, networkDefine.workspaceId, selectedDatasetId, updateNetworkDefine, workData])
    )

    const handleNextSelectDataset = useAtomCallback(
        useCallback((get, set, datasetId: string) => {
            setStep(cur => cur + 1);
            if (selectedDatasetId === datasetId) return;

            setSelectedDatasetId(datasetId);
            const datasets = get(dataSetsAtom);
            const target = datasets.find(item => item.id === datasetId);
            if (target) {
                setWorkData({
                    baseDb: {
                        workspaceId: target.networkDefine.workspaceId,
                        dbId: target.networkDefine.dbList[0].id,
                    },
                    targetWorkspaceDbList: [],
                    targetRelations: target.networkDefine.relationList.map(item => {
                        return {
                            dbId: item.from.dbId,
                            propertyId: item.from.propertyId,
                        }
                    }),
                })
            }

        }, [selectedDatasetId])
    )

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
                return <SelectDatasetBody onNext={handleNextSelectDataset} onClose={()=>call.end()} />
            case Step.SelectDb:
                if (!selectedDatasetId) {
                    console.warn('想定外')
                    return null;
                }
                return <SelectDatabaseBody
                        onNext={handleNextSelectDatabase}
                        onBack={onBack}
                        datasetId={selectedDatasetId}
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
    }, [step, handleNextSelectDataset, selectedDatasetId, handleNextSelectDatabase, onBack, workData, handleNextSelectRealtion, handleSave, call])

    return (
        <Modal show onHide={()=>call.end()} backdrop="static">
            <Modal.Header closeButton>
                {t('Setting')}
            </Modal.Header>
            {body}
        </Modal>
    )
})
