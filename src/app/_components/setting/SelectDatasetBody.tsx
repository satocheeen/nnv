import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, ListGroup, Modal } from 'react-bootstrap';
import { BsTrashFill, BsPencilFill, BsStarFill } from "react-icons/bs";
import styles from './SelectDatasetBody.module.scss';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { dataSetsAtom } from '@/app/_jotai/useData';
import { currentDatasetIdAtom } from '@/app/_jotai/operation';
import { DataSet, DialogMode, DialogResult } from '@/app/_types/types';
import useData from '@/app/_jotai/useData';
import { Confirm } from '../Confirm';
import { DatasetInfo } from './SettingDialog';

type Props = {
    onNext: (dataset?: DatasetInfo) => void;
    onClose: () => void;
}

export default function SelectDatasetBody(props: Props) {
    const [ datasets ] = useAtom(dataSetsAtom);
    const [ currentDatasetId ] = useAtom(currentDatasetIdAtom);
    const [tempSelectDatasetId, setTempSelectDatasetId] = useState(undefined as string | undefined);

    // 名称変更
    const [editingTarget, setEditingTarget] = useState(undefined as undefined | string);
    const [inputValue, setInputValue] = useState('');
    const onEdit = useCallback((dataset: DataSet) => {
        setInputValue(dataset.name);
        setEditingTarget(dataset.id);
    }, []);

    const onEditCancel = useCallback(() => {
        setEditingTarget(undefined);
    }, []);

    const onInputChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(evt.target.value);
    }, []);

    const { updateDatasetName, removeNetworkDefine } = useData();
    const onEditOk = useCallback(() => {
        if (editingTarget) {
            // データセット名変更
            updateDatasetName({
                datasetId: editingTarget,
                name: inputValue,
            })
        }
        setEditingTarget(undefined);
    }, [editingTarget, inputValue, updateDatasetName]);

    const onDelete = useCallback(async(datasetId: string) => {
        const result = await Confirm.call({
            mode: DialogMode.YesNo,
            message: '削除してよろしいですか',
        });
        if (result !== DialogResult.Yes) {
            return;
        }
        removeNetworkDefine(datasetId);

    }, [removeNetworkDefine]);

    const okable = useMemo(() => {
        return tempSelectDatasetId !== undefined;
    }, [tempSelectDatasetId])

    const onOk = useCallback(() => {
        if (!tempSelectDatasetId) {
            return;
        }
        const networkDefine = (() => {
            if (tempSelectDatasetId === 'new') {
                return;
            } else {
                const dataset = datasets.find(dataset => dataset.id === tempSelectDatasetId);
                if (!dataset) {
                    console.warn('Datasetなし');
                    return;
                }
                return Object.assign({}, dataset.networkDefine);
            }
        })();
        if (networkDefine) {
            props.onNext({
                id: tempSelectDatasetId,
                networkDefine,
            });
        } else {
            props.onNext();
        }

    }, [props, datasets, tempSelectDatasetId]);


    const { t } = useTranslation();

    return (
        <>
            <Modal.Body>
                <ListGroup>
                    {datasets.map(dataset => {
                        if (dataset.id === editingTarget) {
                            // 編集中の場合
                            return (
                                <ListGroup.Item as="li" action key={dataset.id} className={styles.Item}>
                                    <Form.Group>
                                        <Form.Control value={inputValue} onChange={onInputChange} />
                                    </Form.Group>
                                    <span>
                                        <Button variant="primary" onClick={onEditOk}>OK</Button>
                                        <Button variant="secondary" onClick={onEditCancel}>Cancel</Button>
                                    </span>
                                </ListGroup.Item>
                            )
                        }
                        return (
                            <ListGroup.Item as="li" action key={dataset.id} className={styles.Item}
                            active={tempSelectDatasetId === dataset.id}
                            onClick={()=>setTempSelectDatasetId(dataset.id)}>
                                <span className={styles.DatasetName}>
                                    {currentDatasetId === dataset.id &&
                                        <BsStarFill />
                                    }
                                    {dataset.name}
                                </span>
                                <span>
                                    <Button variant="outline-primary" onClick={()=>onEdit(dataset)}>
                                        <BsPencilFill />
                                    </Button>
                                    <Button variant="outline-primary" onClick={()=>onDelete(dataset.id)}>
                                        <BsTrashFill />
                                    </Button>
                                </span>
                            </ListGroup.Item>
                        )
                    })}
                    <ListGroup.Item action 
                        active={tempSelectDatasetId === 'new'}
                        onClick={()=>setTempSelectDatasetId('new')}>
                        ({t('New')})
                    </ListGroup.Item>
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button disabled={!okable} onClick={onOk}>
                    {t('Next')}
                </Button>
                <Button variant="outline-secondary" onClick={props.onClose}>
                    {t('Close')}
                </Button>
            </Modal.Footer>
        </>
    );
}