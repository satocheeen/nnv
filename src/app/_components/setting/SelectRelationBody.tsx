import React, { useCallback, useMemo } from 'react';
import { Button, Form, Modal, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { DbDefine, NetworkDefine, Property, RelationDefine } from '@/app/_types/types';
import { isSamePair } from '@/app/_util/utility';
import styles from './SelectRelationBody.module.scss';
import useSettingStore from '@/app/_jotai/useSettingStore';
import SettingChart from './SettingChart';

type Props = {
    dbList: DbDefine[];
    onBack: () => void;
    onNext: () => void;
}

type RelPropertyInfo = {
    dbId: string;
    dbName: string;
    propertyId: string;
    propertyName: string;
    relDbId: string;
    relDbName: string;
    relDbPropertyName: string;
    relDbPropertyId: string;
}
type DbRelItem = RelationDefine & {
    from : {
        dbName: string;
        propertyName: string;
    };
    to : {
        dbName: string;
        propertyName: string;
    };
}

export default function SelectRelationBody(props: Props) {
    const { networkDefine, setNetworkDefine } = useSettingStore();

    /**
     * 指定のDBが保持するリレーション項目の情報を返す
     */
     const getRelationProperies = useCallback((dbId: string): RelPropertyInfo[] => {
        const target = props.dbList.find(db => db.id === dbId);
        if (!target) {
            console.warn('DBなし', dbId);
            return [];
        }
        return Object.values(target.properties)
            .filter(p => p.type === 'relation')
            .map(p => {
                const relDbId = p.relation?.dbId as string;
                const relDbPropertyId = p.relation?.propertyId as string;
                const relDb = props.dbList.find(db => db.id === relDbId);
                const relDbPropertyName = relDb?.properties.find(relProp => relProp.id === relDbPropertyId)?.name as string;
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
    }, [props.dbList]);

    const getRelationItems = useMemo((): DbRelItem[] => {
        const items = [] as DbRelItem[];
        networkDefine?.dbList.forEach(db => {
            const relPropertyInfos = getRelationProperies(db.id);

            const newItems = relPropertyInfos.map(relPropInfo => {
                return {
                    from: {
                        dbId: relPropInfo.dbId,
                        dbName: relPropInfo.dbName,
                        propertyId: relPropInfo.propertyId,
                        propertyName: relPropInfo.propertyName,
                    },
                    to: {
                        dbId: relPropInfo.relDbId,
                        dbName: relPropInfo.relDbName,
                        propertyId: relPropInfo.relDbPropertyId,
                        propertyName: relPropInfo.relDbPropertyName,
                    }
                } as DbRelItem;
            });

            newItems.forEach(newItem => {
                const exist = items.some(item => isSamePair(newItem, item));
                if (!exist) {
                    items.push(newItem);
                }
            });
        });
        return items;
    }, [networkDefine, getRelationProperies]);

    const getDbProperied = useCallback((dbId: string): Property[] => {
        const dbInfo = props.dbList.find(db => db.id === dbId);
        if (!dbInfo) {
            return [];
        }
        return Object.values(dbInfo.properties).map(prop => {
            return Object.assign({}, prop, {
                isUse: false,
            }) as Property;
        });
    }, [props.dbList]);

    const okable = useMemo(() => {
        return (networkDefine as NetworkDefine).relationList.length > 0;
    }, [networkDefine])

    const isChecked = useCallback((item: DbRelItem) => {
        return networkDefine?.relationList.some(rel => {
            return isSamePair(rel, item);
        });    
    }, [networkDefine]); 

    const onChangeRel = useCallback((relItem: DbRelItem, value: boolean) => {
        if (!networkDefine) {
            return;
        }
        if (value) {
            // 定義に追加
            const newDbList = networkDefine.dbList.concat();
            if (!newDbList.some(db => db.id === relItem.from.dbId)) {
                newDbList.push({
                    id: relItem.from.dbId,
                    name: relItem.from.dbName,
                    properties: getDbProperied(relItem.from.dbId),
                } as DbDefine);
            }
            if (!newDbList.some(db => db.id === relItem.to.dbId)) {
                newDbList.push({
                    id: relItem.to.dbId,
                    name: relItem.to.dbName,
                    properties: getDbProperied(relItem.to.dbId),
                } as DbDefine);
            }

            const newRelationList = networkDefine.relationList.concat();
            const newRel = {
                from: {
                    dbId: relItem.from.dbId,
                    propertyId: relItem.from.propertyId,
                },
                to: {
                    dbId: relItem.to.dbId,
                    propertyId: relItem.to.propertyId,
                },
            } as RelationDefine;
            if(!newRelationList.some(rel => isSamePair(rel, newRel))) {
                newRelationList.push(newRel);
            }
            setNetworkDefine({
                workspaceId: networkDefine.workspaceId,
                dbList: newDbList,
                relationList: newRelationList,
            });

        } else {
            // 定義から除去
            const delRel = {
                from: {
                    dbId: relItem.from.dbId,
                    propertyId: relItem.from.propertyId,
                },
                to: {
                    dbId: relItem.to.dbId,
                    propertyId: relItem.to.propertyId,
                },
            } as RelationDefine;
            const newRelationList = networkDefine.relationList.concat();
            const index = newRelationList.findIndex(rel => isSamePair(rel, delRel));
            newRelationList.splice(index, 1);

            // 関係に使われているDB定義のみを残す
            const newDbList = networkDefine.dbList.filter((db, index) => {
                if (index === 0) {
                    return true;
                }
                return newRelationList.some(rel => rel.from.dbId === db.id || rel.to.dbId === db.id);
            });
            setNetworkDefine({
                workspaceId: networkDefine.workspaceId,
                dbList: newDbList,
                relationList: newRelationList,
            });
        }
    }, [getDbProperied, networkDefine, setNetworkDefine]);

    const onChange = useCallback((relItem: DbRelItem, evt: React.ChangeEvent<HTMLInputElement>) => {
        onChangeRel(relItem, evt.target.checked);
    }, [onChangeRel]);

    const { t } = useTranslation();

    return (
        <>
            <Modal.Body>
                <p>{t('Msg_Select_Relation')}</p>
                <Table className={styles.Table}>
                    <thead>
                        <tr>
                            <th></th>
                            <th>DB1</th>
                            <th>DB1 {t('Property')}</th>
                            <th>DB2</th>
                            <th>DB2 {t('Property')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getRelationItems.map(item => {
                            const key = item.from.dbId + '-' + item.from.propertyId;
                            const checked = isChecked(item);
                            return (
                                <tr key={key} onClick={()=>onChangeRel(item, !checked)}>
                                    <td>
                                        <Form.Check type="checkbox" checked={checked} onChange={(e => onChange(item, e))} />
                                    </td>
                                    <td>{item.from.dbName}</td>
                                    <td>{item.from.propertyName}</td>
                                    <td>{item.to.dbName}</td>
                                    <td>{item.to.propertyName}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
                <SettingChart define={networkDefine as NetworkDefine} />
            </Modal.Body>
            <Modal.Footer>
                <Button disabled={!okable} onClick={props.onNext}>
                    {t('Next')}
                </Button>
                <Button variant="outline-secondary" onClick={props.onBack}>{t('Back')}</Button>
            </Modal.Footer>
        </>
    );
}