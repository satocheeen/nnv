import React, { useCallback, useMemo, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import SelectNodeStyleBody from './SelectNodeStyleBody';
import SettingChart from '../setting/SettingChart';
import SelectRelationStyleBody from './SelectRelationStyleBody';
import { getRelationKey, isSamePair } from '@/app/_util/utility';
import { useAtom } from 'jotai';
import { currentDatasetAtom } from '@/app/_jotai/operation';
import { DbDefine, NetworkDefine, RelationDefine } from '@/app/_types/types';
import useData from '@/app/_jotai/useData';
import { useWatch } from '@/app/_util/useWatch';

type Props = {
    show: boolean;
    onHide: () => void;
}

export default function StyleSettingDialog(props: Props) {
    const onHide = useCallback(() => {
        props.onHide();
    }, [props]);

    const { t } = useTranslation();
    
    const [ currentDataset ] = useAtom(currentDatasetAtom);

    const [networkDefine, setNetworkDefine] = useState({
        workspaceId: '',
        dbList: [],
        relationList: [],
    } as NetworkDefine);

    const [editTarget, setEditTargetId] = useState(undefined as undefined | {id: string; type: 'db' | 'relation'});

    useWatch(currentDataset, val => {
        if (!val) {
            return;
        }
        setNetworkDefine(val.networkDefine);
        setEditTargetId(undefined);
    })

    const { updateNetworkDefine } = useData();
    const onOk = useCallback(() => {
        if (!currentDataset) {
            return;
        }
        
        // 定義保存
        updateNetworkDefine({
            datasetId: currentDataset.id,
            networkDefine,
            dataClear: false,
        })
        props.onHide();

    }, [currentDataset, updateNetworkDefine, networkDefine, props]);

    const onSelect = useCallback((target: {type: 'db' | 'relation'; id: string} | undefined) => {
        if (target === undefined) {
            setEditTargetId(undefined);
        } else  {
            setEditTargetId({
                type: target.type,
                id: target.id,
            });
        }
    }, []);

    const onDefineChange = useCallback((define: DbDefine) => {
        const newNetworkDefine = Object.assign({}, networkDefine);
        newNetworkDefine.dbList = newNetworkDefine.dbList.map((db) => {
            if (db.id === define.id) {
                return define;
            } else {
                return db;
            }
        });
        setNetworkDefine(newNetworkDefine);
    }, [networkDefine]);

    const onRelationDefineChange = useCallback((define: RelationDefine) => {
        const newNetworkDefine = Object.assign({}, networkDefine);
        newNetworkDefine.relationList = newNetworkDefine.relationList.map(rel => {
            if (isSamePair(rel, define)) {
                return define;
            } else {
                return rel;
            }
        });
        setNetworkDefine(newNetworkDefine);
    }, [networkDefine])

    const body = useMemo(() => {
        if (editTarget === undefined) {
            return (
                <p>{t('Msg_Select_StyleTarget')}</p>
            )
        }
        if (editTarget.type === 'db') {
            const target = networkDefine.dbList.find(db => db.id === editTarget?.id) as DbDefine;
            return (
                <SelectNodeStyleBody target={target} onDefineChange={onDefineChange} />
            );
        } else {
            const target = networkDefine.relationList.find(rel => {
                const key = getRelationKey(rel);
                return key === editTarget?.id;
            }) as RelationDefine;
            return (
                <SelectRelationStyleBody target={target} networkDefine={networkDefine} onDefineChange={onRelationDefineChange} />
            )
        }
    
    }, [editTarget, onDefineChange, networkDefine, onRelationDefineChange, t]);

    return (
        <Modal show={props.show} onHide={onHide} backdrop="static">
            <Modal.Header closeButton>{t('Style_Setting')}</Modal.Header>
            <Modal.Body>
                <SettingChart define={networkDefine} onSelect={onSelect} />
                {body}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onOk}>
                    {t('Save')}
                </Button>
                <Button variant="outline-secondary" onClick={onHide}>{t('Close')}</Button>
            </Modal.Footer>
        </Modal>
    );
}