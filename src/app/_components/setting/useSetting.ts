import { useCallback, useMemo } from "react";
import { WorkData } from "./SettingDialog";
import { NetworkDefine } from "@/app/_types/types";

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
type Props = {
    workData: WorkData;
}
export default function useSetting(props: Props) {
    /**
     * 指定のDBが保持するリレーション項目の情報を返す
     */
    const getRelationProperies = useCallback((dbId: string): RelPropertyInfo[] => {
        const target = props.workData.targetWorkspaceDbList.find(db => db.id === dbId);
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
                const relDb = props.workData.targetWorkspaceDbList.find(db => db.id === relDbId);
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
    }, [props.workData.targetWorkspaceDbList])

    /**
     * targetRelationsで使用されているDB一覧
     */
    const dbIdsInTargetRelations = useMemo(() => {
        // selectedされた先のDB
        const relDbIds = props.workData.targetRelations.map(key => {
            const target = props.workData.targetWorkspaceDbList.find(item => item.id === key.dbId);
            if (!target) return;
            const targetProp = target.properties.find(prop => prop.id === key.propertyId);
            if (targetProp?.type !== 'relation') return;
            return targetProp.relation.database_id;
        }).reduce((acc, cur) => {
            if (!cur) return acc;
            if (acc.includes(cur)) return acc;
            if (props.workData.baseDb.dbId === cur) return acc;
            return [...acc, cur];
        }, [] as string[])
        // 基点DB + selectedされた先のDB
        return [ props.workData.baseDb.dbId, ...relDbIds ];
    }, [props.workData.baseDb.dbId, props.workData.targetRelations, props.workData.targetWorkspaceDbList])

    // 関連するDBたちが持つRelation項目
    const relationItems = useMemo((): DbRelItem[] => {
        return dbIdsInTargetRelations.reduce((acc, cur) => {
             // 指定のDBが保持するリレーション項目の情報を取得
            const rels = getRelationProperies(cur);
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

    const networkDefine = useMemo((): NetworkDefine => {
        return {
            dbList: dbIdsInTargetRelations.map(id => {
                return props.workData.targetWorkspaceDbList.find(item => item.id === id);
            }).filter(item => !!item),
            workspaceId: props.workData.baseDb.workspaceId,
            relationList: relationItems
            .filter(item => {
                const isTarget = props.workData.targetRelations.some(target => {
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
    }, [dbIdsInTargetRelations, props.workData.baseDb.workspaceId, props.workData.targetRelations, props.workData.targetWorkspaceDbList, relationItems])

    return {
        dbIdsInTargetRelations,
        relationItems,
        networkDefine,
    }

}