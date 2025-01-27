import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, ListGroup, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './SelectFilterPropertyBody.module.scss';
import { NetworkDefine } from '@/app/_types/types';

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
    networkDefine: NetworkDefine;
    onBack: () => void;
    onSave: (def: NetworkDefine) => void;
}
/**
 * フィルタに使用する項目を選択する画面
 */
export default function SelectFilterPropertyBody(props: Props) {
    const [ networkDefine, setNetworkDefine ] = useState(props.networkDefine);

    const selectPropertyGroups = useMemo((): SelectPropertyGroup[] => {
        if (!networkDefine) {
            return [];
        }
        return networkDefine.dbList.map(db => {
            return {
                dbId: db.id,
                dbName: db.name,
                properties: db.properties
                                .filter(prop => prop.type === 'select' || prop.type === 'multi_select' || prop.type === 'url')
                                .map(prop => {
                                    return {
                                        id: prop.id,
                                        name: prop.name,
                                        checked: prop.isUse,
                                    }
                                }),
            }
        });
    }, [networkDefine]);

    const onChangeProperty = useCallback((dbId: string, propertyId: string, value: boolean) => {
        if (!networkDefine) {
            return;
        }
        const newDbList = networkDefine.dbList.concat();
        const targetDb = newDbList.find(db => db.id === dbId);
        if (!targetDb) {
            console.warn('DBなし', dbId);
            return;
        }
        const prop = targetDb.properties.find(prop => prop.id === propertyId);
        if (!prop) {
            console.warn('プロパティなし');
            return;
        }
        prop.isUse = value;
        setNetworkDefine(Object.assign({}, networkDefine, {
            dbList: newDbList,
        }));
    }, [networkDefine, setNetworkDefine]);

    const onChange = useCallback((dbId: string, propertyId: string, evt: React.ChangeEvent<HTMLInputElement>) => {
        onChangeProperty(dbId, propertyId, evt.target.checked);
    }, [onChangeProperty]);

    const onClick = useCallback((dbId: string, propertyId: string, value: boolean) => {
        onChangeProperty(dbId, propertyId, value);
    }, [onChangeProperty]);


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
                <Button onClick={()=>props.onSave(networkDefine)}>
                    {t('Save')}
                </Button>
                <Button variant="outline-secondary" onClick={props.onBack}>{t('Back')}</Button>
            </Modal.Footer>
        </>
    );
}