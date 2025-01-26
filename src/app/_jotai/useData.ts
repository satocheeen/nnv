import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import useApi from "../_util/useApi";
import { DataSet, DbData, DbDefine, DbDefineWithRelation, Edge, NetworkDefine, NodeItem, Property } from "@/app/_types/types";
import { useAtomCallback } from "jotai/utils";
import { currentDatasetAtom, loadingInfoAtom } from "./operation";
import { isSameProperty } from "../_util/utility";
import { atomWithStorage } from 'jotai/utils';

type NodeItemWithPosition = NodeItem & {
    position?: {x: number; y: number};
}

export const dataSetsAtom = atomWithStorage<DataSet[]>('dataSets', []);

export default function useData() {
    const { t } = useTranslation();
    const api = useApi();

    const createDbDefineWithRelation = useAtomCallback(
        useCallback((get, set, dbDefine: DbDefine): DbDefineWithRelation => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                throw new Error('current dataset not found');
            }
            const relationColIds = currentDataset.networkDefine.relationList
                .filter(rel => rel.from.dbId === dbDefine.id)
                .map(rel => rel.from.propertyId);
            const def = Object.assign({}, dbDefine, {
                relationColIds,
            });
            return def;
        }, [])
    )

    /**
     * 指定のDBのプロパティ項目の定義を更新する。
     * TODO: 現状は、isUse=trueの項目のみ引数で渡されてくるが、
     * 全プロパティの最新情報が渡されてくるように変更してもいいかもしれない
     * @returns 
     */
    const updateFilterOptions = useAtomCallback(
        useCallback((get, set, args: {
            datasetId: string;
            dbId: string;
            properties: Property[];
        }) => {

            const currentDataset = get(currentDatasetAtom);
            if (!currentDataset) {
                return;
            }

            set(dataSetsAtom, cur => {
                const newDataSets = cur.map(ds => {
                    if (ds.id !== args.datasetId) {
                        return ds;
                    }
            
                    const newDbLiset = ds.networkDefine.dbList.map(db => {
                        if (db.id !== args.dbId) {
                            return db;
                        }
                        return Object.assign({}, db, {
                            properties: db.properties.map(prop => {
                                const optionInfo = args.properties.find(pps => pps.id === prop.id);
                                if (!optionInfo) {
                                    return prop;
                                }
                                return Object.assign({}, prop, {
                                    options: optionInfo.options,
                                });
                            }),
                        });
                    });
            
                    return Object.assign({}, ds, {
                        networkDefine: Object.assign({}, ds.networkDefine, {
                            dbList: newDbLiset,
                        }),
                    });
                });
                return newDataSets;
            })
        }, [])
    )

    const replaceDataSet = useAtomCallback(
        useCallback((get, set, args: {
            datasetId: string;
            dataMap?: DataSet['dataMap'];
            positionMap?: DataSet['positionMap'];
            edges?: Edge[];
        }) => {
            set(dataSetsAtom, cur => {
                return cur.map(dataset => {
                    if (dataset.id !== args.datasetId) return dataset;
                    const newDataSet = structuredClone(dataset);
                    if (args.dataMap) {
                        newDataSet.dataMap = args.dataMap;
                    }
                    if (args.positionMap) {
                        newDataSet.positionMap = args.positionMap;
                    }
                    if (args.edges) {
                        newDataSet.edges = args.edges;
                    }
                    return newDataSet;
                })
            })

        }, [])
    )

    const addItems = useAtomCallback(
        useCallback((get, set, payload: {
            datasetId: string;
            dbId: string;
            items: NodeItemWithPosition[];
        }) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                return;
            }

            const items = currentDataset.dataMap[payload.dbId]?.items ? currentDataset.dataMap[payload.dbId].items.concat() : [];
            const newPositionMap = Object.assign({}, currentDataset.positionMap);
            payload.items.forEach(newItem => {
                const index = items.findIndex(item => item.id === newItem.id);
                if (index === -1) {
                    items.push(newItem);
                } else {
                    items.splice(index, 1, newItem);
                }
        
                if (newItem.position) {
                    if (newPositionMap[payload.dbId] === undefined) {
                        newPositionMap[payload.dbId] = {};
                    }
                    newPositionMap[payload.dbId][newItem.id] = newItem.position;
                }
            })
            const newDataMap = Object.assign({}, currentDataset.dataMap);
            newDataMap[payload.dbId] = {
                id: payload.dbId,
                items,
            } as DbData;
        
            replaceDataSet({
                datasetId: payload.datasetId,
                dataMap: newDataMap,
                positionMap: newPositionMap,
            })

        }, [replaceDataSet])
    )

    const removeItem = useAtomCallback(
        useCallback((get, set, args: {
            datasetId: string;
            dbId: string;
            ids: string[]; // 削除アイテムのID一覧
        }) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                return;
            }
            const items = currentDataset.dataMap[args.dbId]?.items ? currentDataset.dataMap[args.dbId].items.concat() : [];
            args.ids.forEach(deleteId => {
                const index = items.findIndex(item => item.id === deleteId);
                if (index !== -1) {
                    items.splice(index, 1);
                }
            });
        
            const newDataMap = Object.assign({}, currentDataset.dataMap);
            newDataMap[args.dbId].items = items;
        
            replaceDataSet({
                datasetId: args.datasetId,
                dataMap: newDataMap
            })

        }, [replaceDataSet])
    )

    const addEdges = useAtomCallback(
        useCallback((get, set, payload: {
            datasetId: string;
            edges: Edge[];
        }) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                return;
            }

            const newEdges = currentDataset.edges.concat();
            payload.edges.forEach(edge => {
                const isSame = isSameProperty(edge.def.from, edge.def.to);
                const exist = newEdges.some(cur => {
                    if (cur.from === edge.from && cur.to === edge.to) {
                        return true;
                    }
                    // from,toの項目が同じ場合は、from, toが逆でも等しいものと見なす
                    if (isSame) {
                        if (cur.from === edge.to && cur.to === edge.from) {
                            return true;
                        }
                    }
                    return false;
                });
                if (!exist) {
                    newEdges.push(edge);
                }
            })
            replaceDataSet({
                datasetId: payload.datasetId,
                edges: newEdges,
            })
        
        }, [replaceDataSet])
    )

    const removeEdges = useAtomCallback(
        useCallback((get, set, payload: {
            datasetId: string;
            edges: Edge[];
        }) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                return;
            }

            const newEdges = currentDataset.edges.filter(edge => {
                const isDelTarget = payload.edges.some(delEdge => {
                    return Object.is(edge.def, delEdge.def)
                            && edge.from === delEdge.from
                            && edge.to === delEdge.to;
                });
                return !isDelTarget;
            });
            replaceDataSet({
                datasetId: payload.datasetId,
                edges: newEdges,
            })

        }, [replaceDataSet])
    )

    const updateLastEditedTime = useAtomCallback(
        useCallback((get, set, payload: {
            datasetId: string;
            dbId: string;
            lastEditedTime: string;
        }) => {
            const currentDataset= get(currentDatasetAtom);
            const newDataMap = Object.assign({}, currentDataset?.dataMap);
            newDataMap[payload.dbId].lastEditedTime = payload.lastEditedTime;
        
            replaceDataSet({
                datasetId: payload.datasetId,
                dataMap: newDataMap
            });
        
        }, [replaceDataSet])
    )

    const loadData = useAtomCallback(
        useCallback(async(get, set, dbDefine: DbDefineWithRelation) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                console.warn('選択中データセットなし');
                return;
            }
            
            console.log('★loadData★', dbDefine);
        
            const target = currentDataset.dataMap[dbDefine.id] as DbData | undefined;
        
            // フィルタ選択肢の更新
            const options = await api.getOptions({dbDefine});
            if (options.filterPropertyDefines.length > 0) {
                const properties = options.filterPropertyDefines.map(fpd => {
                    return {
                        id: fpd.propertyId,
                        name: fpd.propertyName,
                        type: 'multi_select',   // TODO: とりあえず
                        options: fpd.options,
                    } as Property;
                })
                updateFilterOptions({
                    datasetId: currentDataset.id,
                    dbId: dbDefine.id,
                    properties,
                })
                console.log('get new filter');
            }
        
            // 取得済みのID一覧
            const ids = !target ? [] : target.items.map(item => item.id);
        
            // 削除アイテムを取得
            if (ids.length > 0) {
                const data = await api.getDeleted({
                    dbDefine,
                    existIds: ids,
                    lastEditedTime: target?.lastEditedTime,
                });
                console.log('get_deleted', data);
                // アイテム削除
                if (data.length > 0) {
                    removeItem({
                        datasetId: currentDataset.id,
                        dbId: dbDefine.id,
                        ids: data,
                    })
                }
            }
        
            // 追加、更新アイテムを取得
            const items = [] as NodeItem[];
            let nextCursor = undefined as undefined | string;
            let lastEditedTime = undefined as undefined | string;
            do {
                const apiResult = await api.getData({
                        dbDefine,
                        nextCursor,
                        lastEditedTime: target?.lastEditedTime,
                    },
                );
                console.log('get_data', apiResult);
                // DBの最終更新日時を保持（小さい方を保持する）
                if (lastEditedTime === undefined || lastEditedTime.localeCompare(apiResult.lastEditedTime) > 0) {
                    lastEditedTime = apiResult.lastEditedTime;
                }
                const myItems = apiResult.items.map(item => {
                    return {
                        id: item.id,
                        name: item.name,
                        filterPropertyValue: item.filterPropertyValue,
                        urlPropertyValue: item.urlPropertyValue,
                        url: item.url,
                        lastEditedTime: item.lastEditedTime,
                        imageGotFlag: false,
                    } as NodeItem;
                });
                Array.prototype.push.apply(items, myItems);
        
                // エッジ
                const edges = [] as Edge[];
                const delEdges = [] as Edge[];
                apiResult.items.forEach(item => {
                    const from = item.id;
                    // 削除対象を抽出
                    // fromが属する現在のrelationを取得
                    const prevEdges = currentDataset.edges.filter(edge => edge.from === from);
                    const myDelEdges = prevEdges.filter(edge => {
                        // 新にも存在するか
                        const exist = item.relations.some(rel => {
                            if (rel.relColId !== edge.def.from.propertyId) {
                                return false;
                            }
                            return rel.ids.indexOf(edge.to) !== -1;
                        });
                        return !exist;
                    });
                    if (myDelEdges.length > 0) {
                        Array.prototype.push.apply(delEdges, myDelEdges);
                    }
        
                    item.relations.forEach(rel => {
                        const relDef = currentDataset.networkDefine.relationList.find(rl => {
                            return rl.from.dbId === dbDefine.id && rl.from.propertyId === rel.relColId;
                        });
                        if (!relDef) {
                            console.warn('relDef not found');
                            return;
                        }
                        rel.ids.forEach(toId => {
                            edges.push({
                                def: relDef,
                                from,
                                to: toId,
                            });
                        })
                    })
                });
        
                if (myItems.length > 0) {
                    addItems({
                        datasetId: currentDataset.id,
                        dbId: dbDefine.id,
                        items: myItems,
                    })
                }
                if (edges.length > 0) {
                    addEdges({
                        datasetId: currentDataset.id,
                        edges,
                    })
                }
                if (delEdges.length > 0) {
                    removeEdges({
                        datasetId: currentDataset.id,
                        edges: delEdges,
                    })
                }
        
                // 続きがあるなら、続きを取得
                nextCursor = apiResult.nextCursor === null ? undefined : apiResult.nextCursor;
            } while(nextCursor);
        
            // DB更新日時を保持
            if (lastEditedTime) {
                updateLastEditedTime({
                    datasetId: currentDataset.id,
                    dbId: dbDefine.id,
                    lastEditedTime,
                })
            }
        }, [api, updateFilterOptions, removeItem, addItems, addEdges, removeEdges, updateLastEditedTime])
    )
        

    /**
     * 最新のデータ取得
     * @returns 
     */
    const getData = useAtomCallback(
        useCallback(async(get, set) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                console.warn('選択中データセットなし');
                return;
            }
            for(const dbDefine of currentDataset.networkDefine.dbList) {
                try {
                    const def = createDbDefineWithRelation(dbDefine);
                    const status =  t('Loading', {name: dbDefine.name });
                    set(loadingInfoAtom, {
                        loading: true,
                        status,
                    })
                    await loadData(def);
                } catch(e) {
                    console.warn('データ取得エラー', JSON.parse(JSON.stringify(dbDefine)), e);
                    throw e;
                } finally {
                    set(loadingInfoAtom, {
                        loading: false,
                    })
                }
            }
    
        }, [createDbDefineWithRelation, loadData, t])
    )

    const updateItemImageBase64 = useAtomCallback(
        useCallback((get, set, payload: {
            datasetId: string;
            dbId: string;
            id: string;
            imageBase64: string;
        }) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                return;
            }
            const items = currentDataset.dataMap[payload.dbId]?.items ? currentDataset.dataMap[payload.dbId].items.concat() : [];
            const item = items.find(item => item.id === payload.id);
            if (!item) {
                return;
            }
            item.imageBase64 = payload.imageBase64;
            item.imageGotFlag = true;
            delete item.image;
        
            const newDataMap = Object.assign({}, currentDataset.dataMap);
            newDataMap[payload.dbId].items = items;
            replaceDataSet({
                datasetId: payload.datasetId,
                dataMap: newDataMap
            })
        
        }, [replaceDataSet])
    )

    /**
     * サムネイル画像Base64を取得
     * @param item 
     * @returns 
     */
    const getThumb = useAtomCallback(
        useCallback(async(get, set, nodeItem: NodeItem, dbDefine: DbDefine) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                console.warn('current dataset nothing');
                return;
            }
            if(nodeItem.imageGotFlag) {
                return;
            }
            const res = await api.getImage(nodeItem.id);
            updateItemImageBase64({
                datasetId: currentDataset.id,
                dbId: dbDefine.id,
                id: nodeItem.id,
                imageBase64: 'data:image;base64,' + res,
            })

        }, [api, updateItemImageBase64])
    )

    /**
     * リレーション作成
     */
    const createRelation = useAtomCallback(
        useCallback(async(get, set, edge: Edge) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                console.warn('current dataset nothing');
                return;
            }
            set(loadingInfoAtom, {
                loading: true,
            })
    
            try {
                console.log('create edge', edge);
                const result = await api.createRelation(edge);
                console.log('created', result);
                addEdges({
                    datasetId: currentDataset.id,
                    edges: [edge],
                })
    
            } finally {
                set(loadingInfoAtom, {
                    loading: false,
                })
                }
        }, [addEdges, api])
    
    ) 

    /**
     * リレーション削除
     */
    const removeRelation = useAtomCallback(
        useCallback(async(get, set, edge: Edge) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                console.warn('current dataset nothing');
                return;
            }
            set(loadingInfoAtom, {
                loading: true,
            })
    
            try {
                const result = await api.removeRelation(edge);
                console.log('removed', result);
                removeEdges({
                    datasetId: currentDataset.id,
                    edges: [edge],
                })
    
            } finally {
                set(loadingInfoAtom, {
                    loading: false,
                })
            }
        }, [api, removeEdges])
    ) 

    const createPage = useAtomCallback(
        useCallback(async(get, set, target: DbDefine, title: string, position:{x: number; y: number}) => {
            const currentDataset= get(currentDatasetAtom);
            if (!currentDataset) {
                console.warn('current dataset nothing');
                return;
            }
    
            set(loadingInfoAtom, {
                loading: true,
            })
    
            try {
                // ページ作成
                const result = await api.createPage({
                    dbDefine: target,
                    title,
                });
                console.log('created', result);
                const id = result.id;
    
                // 作成ページ情報取得
                const def = createDbDefineWithRelation(target);
                const page = await api.getSingleData({
                    dbDefine: def,
                    id,
                });
                const addItem = {
                    id: page.item.id,
                    name: page.item.name,
                    filterPropertyValue: page.item.filterPropertyValue,
                    url: page.item.url,
                    lastEditedTime: page.item.lastEditedTime,
                    imageGotFlag: false,
                    position,
                } as NodeItemWithPosition;
                addItems({
                    datasetId: currentDataset.id,
                    dbId: target.id,
                    items: [ addItem ],
                })
            } finally {
                set(loadingInfoAtom, {
                    loading: false,
                })
            }
    
        }, [api, createDbDefineWithRelation, addItems])
    )

    /**
     * 新規データセットを作成する
     * @return データセットid
     */
    const createDataset = useAtomCallback(
        useCallback((get, set, networkDefine: NetworkDefine) => {
            const dataSets = get(dataSetsAtom);
            const maxId = dataSets.reduce((acc, cur) => {
                return Math.max(acc, parseInt(cur.id));
            }, 0);
            const id = maxId + 1 + '';
            const name = networkDefine.dbList[0].name;
            console.log('create dataset', id);
            set(dataSetsAtom, currentDataSets => {
                return currentDataSets.concat({
                    id,
                    name,
                    networkDefine,
                    dataMap: {},
                    positionMap: {},
                    edges: [],
                })
            });
            return id;
        }, [])
    )

    const updateNetworkDefine = useAtomCallback(
        useCallback((get, set, payload: {
            datasetId: string;
            networkDefine: NetworkDefine;
            dataClear: boolean; // trueの場合、データクリアする
        }) => {
            const dataSets = get(dataSetsAtom);
            const dataset = dataSets.find(ds => ds.id === payload.datasetId);
            if (!dataset) {
                console.warn('Datasetなし');
                return;
            }
        
            const newDataset = Object.assign({}, dataset);
            newDataset.networkDefine = payload.networkDefine;
            if (payload.dataClear) {
                // 位置情報以外はクリア
                newDataset.dataMap = {};
                newDataset.edges = [];
            }
        
            const newDatasets = dataSets.map(ds => {
                if (ds.id === payload.datasetId) {
                    return newDataset;
                } else {
                    return ds;
                }
            });
        
            set(dataSetsAtom, newDatasets);
        
        }, [])
    )

    const removeNetworkDefine = useAtomCallback(
        useCallback((get, set, datasetId: string) => {
            set(dataSetsAtom, dataSets => {
                return dataSets.filter(ds => ds.id !== datasetId);
            })
        
        }, [])
    )

    const updateDatasetName = useAtomCallback(
        useCallback((get, set, payload: {
            datasetId: string;
            name: string;
        }) => {
            set(dataSetsAtom, dataSets => {
                return dataSets.map(ds => {
                    if (ds.id !== payload.datasetId) {
                        return ds;
                    }
                    const newDs = Object.assign({}, ds);
                    newDs.name = payload.name;
                    return newDs;
                });
            });
        }, [])
    )

    return {
        getData,
        getThumb,
        createRelation,
        removeRelation,
        createPage,
        createDataset,
        updateNetworkDefine,
        removeNetworkDefine,
        updateDatasetName,
    }

}

