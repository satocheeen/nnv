import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, Modal, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './SelectRelationBody.module.scss';
import SettingChart from './SettingChart';
import { WorkData } from './SettingDialog';
import useSetting, { DbRelItem, WorkSettingInfo } from './useSetting';

export type RelationKey = {
    dbId: string;
    propertyId: string;
}

type Props = {
    data: WorkSettingInfo;
    onBack: () => void;
    onNext: (rels: RelationKey[]) => void;
}

type DbRelItemWithSelected = DbRelItem & {
    selected: boolean;
}

export default function SelectRelationBody(props: Props) {
    const [ selectedRelations, setSelectedRelations ] = useState<RelationKey[]>(props.data.workData.targetRelations);

    const workSettingInfo = useMemo((): WorkSettingInfo => {
        const workData: WorkData = {
            // baseDb: props.workData.baseDb,
            targetWorkspaceDbList: props.data.workData.targetWorkspaceDbList,
            targetRelations: selectedRelations,
            targetProperties: props.data.workData.targetProperties,
        };
        return Object.assign({}, props.data, { workData })
    }, [props.data, selectedRelations])

    const { relationItems, networkDefine } = useSetting({
        data: workSettingInfo,
    })

    const relationItemsWithSelected = useMemo(() => {
        return relationItems.map((item): DbRelItemWithSelected => {
            const selected = selectedRelations.some(rel => item.from.dbId === rel.dbId && item.from.propertyId === rel.propertyId);
            return Object.assign({}, item, { selected })
        })
    }, [relationItems, selectedRelations])

    const okable = useMemo(() => {
        return selectedRelations.length > 0;
    }, [selectedRelations.length])

    const handleChangeSelect = useCallback((item: DbRelItemWithSelected, val: boolean) => {
        const key: RelationKey = {
            dbId: item.from.dbId,
            propertyId: item.from.propertyId,
        }
        setSelectedRelations(cur => {
            const index = cur.findIndex(rel => rel.dbId === key.dbId && rel.propertyId === key.propertyId);
            if (index !== -1 && !val) {
                return cur.filter((_, i) => i !== index);
            } else if (val) {
                return cur.concat(key);
            } else {
                return cur;
            }
        })

    }, [])

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
                        {relationItemsWithSelected.map(item => {
                            const key = item.from.dbId + '-' + item.from.propertyId;
                            return (
                                <tr key={key} onClick={()=>handleChangeSelect(item, !item.selected)}>
                                    <td>
                                        <Form.Check type="checkbox" checked={item.selected} onChange={((e) => handleChangeSelect(item, e.target.checked))} />
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
                {networkDefine &&
                    <SettingChart define={networkDefine} />
                }
            </Modal.Body>
            <Modal.Footer>
                <Button disabled={!okable} onClick={()=>props.onNext(selectedRelations)}>
                    {t('Next')}
                </Button>
                <Button variant="outline-secondary" onClick={props.onBack}>{t('Back')}</Button>
            </Modal.Footer>
        </>
    );
}