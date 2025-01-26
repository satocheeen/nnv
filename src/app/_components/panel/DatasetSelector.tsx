import React, { useCallback } from 'react';
import { Button, Form } from 'react-bootstrap';
import { BsFillGearFill } from 'react-icons/bs';
import styles from './DatasetSelector.module.scss';
import { useAtom } from 'jotai';
import { dataSetsAtom } from '@/app/_jotai/useData';
import { currentDatasetIdAtom } from '@/app/_jotai/operation';
import { useAtomCallback } from 'jotai/utils';
import { SettingDialog } from '../setting/SettingDialog';

export default function DatasetSelector() {
    const [ datasets ] = useAtom(dataSetsAtom);
    const [ currentDatasetId ] = useAtom(currentDatasetIdAtom);
    
    const onSettingDlgShow = useCallback(() => {
        SettingDialog.call();
    }, []);

    const onChange = useAtomCallback(
        useCallback((get, set, evt: React.ChangeEvent<HTMLSelectElement>) => {
            set(currentDatasetIdAtom, evt.target.value);
        }, [])
    );

    return (
        <>
            <Form.Select onChange={onChange} value={currentDatasetId} className={styles.Selector}>
                <option value={undefined}>(未選択)</option>
                {datasets.map(dataset => {
                    return (
                        <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                    )
                })}
            </Form.Select>
            <Button variant="secondary" onClick={onSettingDlgShow} className={styles.SettingBtn}>
                <BsFillGearFill />
            </Button>
        </>
    );
}