import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
// import SettingDialog from './setting/SettingDialog';
import { BsFillGearFill } from 'react-icons/bs';
import styles from './DatasetSelector.module.scss';
import useSettingStore from '@/app/_jotai/useSettingStore';
import { useAtom } from 'jotai';
import { dataSetsAtom } from '@/app/_jotai/useData';
import { currentDatasetIdAtom } from '@/app/_jotai/operation';
import { useAtomCallback } from 'jotai/utils';
import SettingDialog from '../setting/SettingDialog';

export default function DatasetSelector() {
    const [ datasets ] = useAtom(dataSetsAtom);
    const [ currentDatasetId ] = useAtom(currentDatasetIdAtom);
    
    const [settingDlgShow, setSettingDlgShow] = useState(false);
    const onSettingDlgShow = useCallback(() => {
        setSettingDlgShow(true);
    }, [setSettingDlgShow]);

    const onChange = useAtomCallback(
        useCallback((get, set, evt: React.ChangeEvent<HTMLSelectElement>) => {
            set(currentDatasetIdAtom, evt.target.value);
        }, [])
    );

    const hasSettingData = useSettingStore().hasData;

    // 起動時
    useEffect(() => {
        // 設定画面の情報があるなら、設定画面を開く
        if (hasSettingData) {
            setSettingDlgShow(true);
        }
        if (datasets.length === 0) {
            // データセットが存在しない場合も、設定画面を開く
            setSettingDlgShow(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            <SettingDialog show={settingDlgShow} onHide={()=>setSettingDlgShow(false)}/>
        </>
    );
}