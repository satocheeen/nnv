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
import useSetting, { WorkSettingInfo } from './useSetting';
import { oAuthRedirectStateAtom } from '@/app/_util/useApi';
import { useAtom } from 'jotai';
import { useWatch } from '@/app/_util/useWatch';

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
    targetWorkspaceDbList?: DbDefine[];  // 基点データベースの属するワークスペースに存在するDB一覧
    targetRelations?: RelationKey[];     // 使用するリレーション項目
    targetProperties?: PropertyKey[];  // 使用するフィルタやURL項目
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
    const [ step, setStep ] = useState<Step>(datasetId === 'new' ? Step.SelectDb : Step.SelectDataset);
    const [ workData, setWorkData ] = useState<WorkData>({});
    const { t } = useTranslation();
    const { loadLatestData: getData, createDataset, updateNetworkDefine } = useData();

    // 編集前のNetworkDefine情報
    const [ datasets ] = useAtom(dataSetsAtom);
    const baseNetworkDefine = useMemo(() => {
        const target = datasets.find(item => item.id === selectedDatasetId);
        return target?.networkDefine;
    }, [datasets, selectedDatasetId])

    const [ baseDb, setBaseDb ] = useState<DbKey|undefined>();
    const workSettingInfo = useMemo((): WorkSettingInfo | undefined => {
        if (baseNetworkDefine) {
            return {
                type: 'edit',
                baseNetworkDefine,
                workData,
            }
        } else {
            return {
                type: 'new',
                baseDb,
                workData,
            }
        }
    }, [baseDb, baseNetworkDefine, workData])
    
    
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

    // OAuthリダイレクト後の復帰用
    const [ , setOAuthRedirectState ] = useAtom(oAuthRedirectStateAtom);
    useWatch(step, val => {
        if (val === Step.SelectDb && selectedDatasetId) {
            setOAuthRedirectState({
                state: 'select-database',
                datasetId: selectedDatasetId,
            });
        } else {
            setOAuthRedirectState(undefined);
        }
    }, { immediate: true })

    const { networkDefine } = useSetting({
        data: workSettingInfo,
    });
    const handleSave = useAtomCallback(
        useCallback((get, set, targets: PropertyKey[]) => {
            if (!workData || !selectedDatasetId || !networkDefine) {
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
                        if (prop.type === 'relation') return true;
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
        }, [call, createDataset, loadLatestData, networkDefine, selectedDatasetId, updateNetworkDefine, workData])
    )

    const updateWorkDataByDatasetId = useAtomCallback(
        useCallback((get, set, datasetId: string) => {
            const datasets = get(dataSetsAtom);
            const target = datasets.find(item => item.id === datasetId);
            console.log('setWorkData', target);
            setSelectedDatasetId(datasetId);
        }, [])
    )

    const handleNextSelectDataset = useAtomCallback(
        useCallback((get, set, datasetId: string) => {
            console.log('datasetId', datasetId);
            setStep(cur => cur + 1);
            if (selectedDatasetId === datasetId) return;
            setSelectedDatasetId(datasetId);
            updateWorkDataByDatasetId(datasetId);
        }, [selectedDatasetId, updateWorkDataByDatasetId])
    )

    if (datasetId && !workData) {
        updateWorkDataByDatasetId(datasetId);
    }

    const handleNextSelectDatabase = useCallback((targetWorkspaceDbList: DbDefine[], baseDbKey: DbKey) => {
        setWorkData(cur => {
            return {
                targetWorkspaceDbList,
                targetRelations: cur?.targetRelations,
                targetProperties: cur?.targetProperties,
            }
        })
        setBaseDb(baseDbKey);
        setStep(cur => cur + 1);
    }, [])

    const handleNextSelectRealtion = useCallback((rels: RelationKey[]) => {
        setWorkData(cur => {
            if (!cur)  {
                console.warn('想定外');
                return cur;
            }
            return {
                targetWorkspaceDbList: cur.targetWorkspaceDbList,
                targetRelations: rels,
                targetProperties: cur.targetProperties,
            }
        })
        setStep(cur => cur + 1);
    }, [])

    const onBack = useCallback(() => {
        setStep(cur => cur -1);
    }, []);

    const body = useMemo(() => {
        switch(step) {
            case Step.SelectDataset:
                return <SelectDatasetBody onNext={handleNextSelectDataset} onClose={()=>call.end()} />
            case Step.SelectDb:
                if (!workSettingInfo) {
                    console.warn('想定外 workSettingInfo undefined' )
                    return null;
                }
                return <SelectDatabaseBody
                        onNext={handleNextSelectDatabase}
                        onBack={onBack}
                        data={workSettingInfo}
                        />;
            case Step.SelectRelationCol:
                if (!workSettingInfo) {
                    console.warn('想定外')
                    return null;
                }
                return <SelectRelationBody
                        data={workSettingInfo}
                        onNext={handleNextSelectRealtion}
                        onBack={onBack} />;
            case Step.SelectFilterCol:
                if (!workSettingInfo) {
                    console.warn('想定外')
                    return null;
                }
                return <SelectFilterPropertyBody
                        data={workSettingInfo}
                        onSave={handleSave}
                        onBack={onBack} />
        }
    }, [step, handleNextSelectDataset, selectedDatasetId, handleNextSelectDatabase, onBack, workSettingInfo, handleNextSelectRealtion, handleSave, call])

    return (
        <Modal show onHide={()=>call.end()} backdrop="static">
            <Modal.Header closeButton>
                {t('Setting')}
            </Modal.Header>
            {body}
        </Modal>
    )
})
