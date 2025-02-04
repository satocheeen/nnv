import { useCallback, useMemo } from "react";
import { DbKey, WorkData } from "./SettingDialog";
import { DbDefine, NetworkDefine, PropertyKey } from "@/app/_types/types";

export type RelPropertyInfo = {
    dbId: string;
    dbName: string;
    propertyId: string;
    propertyName: string;
    relDbId: string;
    relDbName: string;
    relDbPropertyName: string;
    relDbPropertyId: string;
}
export type DbRelItem = {
    from : {
        dbId: string;
        dbName: string;
        propertyId: string;
        propertyName: string;
    };
    to : {
        dbId: string;
        dbName: string;
        propertyId: string;
        propertyName: string;
    };
}

/**
 * WorkDataを元に各種情報を返すフック
 */
export type WorkSettingInfo = {
    type: 'edit';
    baseNetworkDefine: NetworkDefine;   // 定義編集の場合、編集前の定義情報
    workData: WorkData;                 // 編集中の情報
} | {
    type: 'new';
    baseDb: DbKey;
    workData: WorkData;                 // 登録中の情報
}

type Props = {
    data?: WorkSettingInfo;
}
export default function useSetting(props: Props) {
    const baseDb = useMemo(() => {
        if (!props.data) return;
        if (props.data.type === 'new') {
            return props.data.baseDb;
        } else {
            const networkDefine = props.data.baseNetworkDefine;
            return {
                workspaceId: networkDefine.workspaceId,
                dbId: networkDefine.dbList[0].id,
            }
        }
    }, [props.data])

    const targetWorkspaceDbList = useMemo(() => {
        if (props.data?.type === 'new') {
            return props.data?.workData.targetWorkspaceDbList ?? [];
        } else if (props.data?.type === 'edit') {
            const baseNetworkDefine = props.data.baseNetworkDefine;
            // スタイル情報マージ
            if (!props.data.workData.targetWorkspaceDbList) {
                return props.data.baseNetworkDefine.dbList;
            } else {
                return props.data.workData.targetWorkspaceDbList.map((target): DbDefine => {
                    const hit = baseNetworkDefine.dbList.find(item => item.id === target.id);
                    return Object.assign({}, target, { nodeStyle: hit?.nodeStyle })
                })
            }
        } else {
            return [];
        }
    }, [props.data])

    const targetRelations = useMemo(() => {
        if (!props.data) return [];
        if (props.data.type === 'new') {
            return props.data.workData.targetRelations ?? [];
        }
        if (props.data.workData.targetRelations) {
            return props.data.workData.targetRelations;
        } else {
            return props.data.baseNetworkDefine.relationList.map(item => {
                return {
                    dbId: item.from.dbId,
                    propertyId: item.from.propertyId,
                }
            })
        }
    }, [props.data])

    const targetProperties = useMemo(() => {
        if (!props.data) return [];
        if (props.data.type === 'new') {
            return props.data.workData.targetProperties ?? [];
        }
        if (props.data.workData.targetProperties) {
            return props.data.workData.targetProperties;
        } else {
            return props.data.baseNetworkDefine.dbList.reduce((acc, cur) => {
                const propList = cur.properties.map((prop): PropertyKey => {
                    return {
                        dbId: cur.id,
                        propertyId: prop.id,
                    }
                })
                console.log('propList', propList)
                return [...acc, ...propList];
            }, [] as PropertyKey[])
        }

    }, [props.data])

    /**
     * 指定のDBが保持するリレーション項目の情報を返す
     */
    const getRelationProperies = useCallback((dbId: string): RelPropertyInfo[] => {
        if (!props.data) return [];
        const target = targetWorkspaceDbList.find(db => db.id === dbId);
        console.log('getRelationProperies target', target)
        if (!target) {
            return [];
        }
        return Object.values(target.properties)
            .filter(p => p.type === 'relation')
            .map(p => {
                if (!p.relation) {
                    console.warn('想定外')
                    return null;
                };
                const relDbId = p.relation.database_id;
                const relDbPropertyName = p.relation.type === 'dual_property' ? p.relation.dual_property.synced_property_name : p.name;
                const relDbPropertyId = p.relation.type === 'dual_property' ? p.relation.dual_property.synced_property_id : p.id;
                const relDb = targetWorkspaceDbList.find(db => db.id === relDbId);
                if (!relDb) {
                    console.warn('DBなし', relDbId);
                    return null;
                }

                return {
                    dbId,
                    dbName: target.name,
                    propertyId: p.id,
                    propertyName: p.name,
                    relDbId,
                    relDbName: relDb.name,
                    relDbPropertyName,
                    relDbPropertyId,
                };
            })
            .filter(item => item !== null) as RelPropertyInfo[];
    }, [props.data, targetWorkspaceDbList])

    /**
     * targetRelationsで使用されているDB一覧
     */
    const dbIdsInTargetRelations = useMemo(() => {
        if (!baseDb) return [];
        if (!props.data) return [];

        // selectedされた先のDB
        const relDbIds = targetRelations.map(key => {
            const target = targetWorkspaceDbList.find(item => item.id === key.dbId);
            if (!target) return;
            const targetProp = target.properties.find(prop => prop.id === key.propertyId);
            if (targetProp?.type !== 'relation') return;
            return targetProp.relation.database_id;
        }).reduce((acc, cur) => {
            if (!cur) return acc;
            if (acc.includes(cur)) return acc;
            if (baseDb.dbId === cur) return acc;
            return [...acc, cur];
        }, [] as string[])
        // 基点DB + selectedされた先のDB
        return [ baseDb.dbId, ...relDbIds ];
    }, [baseDb, props.data, targetRelations, targetWorkspaceDbList])

    // 関連するDBたちが持つRelation項目
    const relationItems = useMemo((): DbRelItem[] => {
        console.log('dbIdsInTargetRelations', dbIdsInTargetRelations)
        return dbIdsInTargetRelations.reduce((acc, cur) => {
             // 指定のDBが保持するリレーション項目の情報を取得
            const rels = getRelationProperies(cur);
            console.log('rels', rels)
            // 既にあるものと対のものは追加しない
            const targets = rels.filter(rel => {
                const exist = acc.some(item => {
                    if (item.dbId === rel.relDbId && item.propertyId === rel.relDbPropertyId
                         && item.relDbId === rel.dbId && item.relDbPropertyId === rel.propertyId) {
                            return true;
                    } else {
                        return false;
                    }
                })
                return !exist;
            });
            return acc.concat(targets);
        }, [] as RelPropertyInfo[])
        .map((item): DbRelItem  => {
            return {
                from: {
                    dbId: item.dbId,
                    dbName: item.dbName,
                    propertyId: item.propertyId,
                    propertyName: item.propertyName,
                },
                to: {
                    dbId: item.relDbId,
                    dbName: item.relDbName,
                    propertyId: item.relDbPropertyId,
                    propertyName: item.relDbPropertyName,
                },
            }
        })

    }, [dbIdsInTargetRelations, getRelationProperies])

    const networkDefine = useMemo((): NetworkDefine | undefined => {
        if (!baseDb) return;
        if (!props.data) return;
        return {
            dbList: dbIdsInTargetRelations.map(id => {
                return targetWorkspaceDbList.find(item => item.id === id);
            }).filter(item => !!item),
            workspaceId: baseDb.workspaceId,
            relationList: relationItems
            .filter(item => {
                const isTarget = targetRelations.some(target => {
                    return target.dbId === item.from.dbId && target.propertyId === item.from.propertyId;
                })
                return isTarget;
            })
            .map(item => {
                return {
                    from: {
                        dbId: item.from.dbId,
                        propertyId: item.from.propertyId,
                    },
                    to: {
                        dbId: item.to.dbId,
                        propertyId: item.to.propertyId,
                    }
                }
            }).filter(item => {
                return dbIdsInTargetRelations.includes(item.from.dbId) && dbIdsInTargetRelations.includes(item.to.dbId);
            })
        }
    }, [baseDb, dbIdsInTargetRelations, props.data, relationItems, targetRelations, targetWorkspaceDbList])

    return {
        dbIdsInTargetRelations,
        relationItems,
        networkDefine,
        targetWorkspaceDbList,
        targetProperties,
        targetRelations,
    }

}