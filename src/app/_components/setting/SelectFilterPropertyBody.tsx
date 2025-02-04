import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, ListGroup, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './SelectFilterPropertyBody.module.scss';
import { WorkData } from './SettingDialog';
import useSetting from './useSetting';

export type PropetyKey = {
    dbId: string;
    propertyId: string;
}
type SelectPropertyGroup = {
    dbId: string;
    dbName: string;
    properties: {
        id: string;
        name: string;
        checked: boolean;
    }[];
}
type Props = {
    workData: WorkData;
    onBack: () => void;
    onSave: (targets: PropetyKey[]) => void;
}
/**
 * フィルタに使用する項目を選択する画面
 */
export default function SelectFilterPropertyBody(props: Props) {
    const [ selectedProperties, setSelectedProperties ] = useState<PropetyKey[]>(props.workData.targetProperties);
    const { dbIdsInTargetRelations } = useSetting({
        workData: props.workData,
    })
    const selectPropertyGroups = useMemo((): SelectPropertyGroup[] => {
        return dbIdsInTargetRelations.map(dbId => {
            const db = props.workData.targetWorkspaceDbList.find(item => item.id === dbId);
            if (!db) return;
            return {
                dbId: db.id,
                dbName: db.name,
                properties: db.properties
                                .filter(prop => prop.type === 'select' || prop.type === 'multi_select' || prop.type === 'url')
                                .map(prop => {
                                    const checked = selectedProperties.some(item => item.dbId === db.id && item.propertyId === prop.id);
                                    return {
                                        id: prop.id,
                                        name: prop.name,
                                        checked,
                                    }
                                }),
            }
        }).filter(val => !!val);
    }, [dbIdsInTargetRelations, props.workData.targetWorkspaceDbList, selectedProperties]);

    const handleChangeProperty = useCallback((dbId: string, propertyId: string, value: boolean) => {
        const index = selectedProperties.findIndex(item => item.dbId === dbId && item.propertyId === propertyId);
        if (value && index === -1) {
            // 追加
            setSelectedProperties(cur => cur.concat({
                dbId,
                propertyId,
            }))
        } else if (!value && index !== -1) {
            // 削除
            setSelectedProperties(cur => {
                return cur.filter((_, i) => i !== index);
            })
        }
    }, [selectedProperties]);

    const onChange = useCallback((dbId: string, propertyId: string, evt: React.ChangeEvent<HTMLInputElement>) => {
        handleChangeProperty(dbId, propertyId, evt.target.checked);
    }, [handleChangeProperty]);

    const onClick = useCallback((dbId: string, propertyId: string, value: boolean) => {
        handleChangeProperty(dbId, propertyId, value);
    }, [handleChangeProperty]);


    const { t } = useTranslation();

    return (
        <>
            <Modal.Body>
                <p>{t('Msg_Select_UsingProperties')}</p>
                <ListGroup>
                    {selectPropertyGroups.map(group => {
                        return (
                            <ListGroup.Item key={group.dbId}>
                                {group.dbName}
                                <ListGroup>
                                    {group.properties.length === 0 &&
                                        <ListGroup.Item>
                                           ({t('No_Target')})
                                        </ListGroup.Item>
                                    }
                                    {group.properties.map(prop => {
                                        const key = group.dbId + '-' + prop.id;
                                        return (
                                            <ListGroup.Item key={key} onClick={()=>onClick(group.dbId, prop.id, !prop.checked)} className={styles.Item}>
                                                <Form.Check type="checkbox" label={prop.name} checked={prop.checked} onChange={(e)=>onChange(group.dbId, prop.id, e)} />
                                            </ListGroup.Item>
                                        )
                                    })}
                                </ListGroup>
                            </ListGroup.Item>
                        )
                    })}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={()=>props.onSave(selectedProperties)}>
                    {t('Save')}
                </Button>
                <Button variant="outline-secondary" onClick={props.onBack}>{t('Back')}</Button>
            </Modal.Footer>
        </>
    );
}