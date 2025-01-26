"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { BsFillCloudArrowDownFill, BsLayoutWtf, BsArrowLeft } from 'react-icons/bs';
import { FiMenu } from 'react-icons/fi';
import { MdOutlineDesignServices } from 'react-icons/md';
// import { useSelector } from 'react-redux';
// import useConfirm from '../hooks/useConfirm';
// import CategoryCheckList from './CategoryCheckList';
// import DatasetSelector from './DatasetSelector';
// import { DialogMode } from './common/AlertDialog';
import styles from './ControlPanel.module.scss';
import * as EventController from '../../_util/EventController';
// import { RootState } from '../store/reducers';
// import StyleSettingDialog from './setting/StyleSettingDialog';
// import { Link } from 'react-router-dom';
// import useOperation from '../store/operation/useOperation';
// import useData from '../store/data/useData';
import useMedia from 'use-media';
import { Confirm } from '../Confirm';
import { useAtom } from 'jotai';
import Link from 'next/link';
import useFilter, { filterAtom } from '@/app/_jotai/useFilter';
import DatasetSelector from './DatasetSelector';

export default function ControlPanel() {
    const { t } = useTranslation();
    const isSp = useMedia({
        orientation: 'portrait',
    });

    const onGetData = useCallback(async() => {
        try {
            // await dataHook.getData();
        } catch (e) {
            Confirm.call({
                message: t('Error_GetData') + '\n' + e,
            });
        }
    }, [t]);

    const onReLayout = useCallback(() => {
        EventController.fireEvent(EventController.Event.ChartReLayout);
    }, []);

    const [ filter ] = useAtom(filterAtom);
    const filterKeywords = useMemo(() => filter.keywords, [filter]);
    useEffect(() => {
        const newKeyword = filterKeywords.join(' ');
        setKeywordValue(newKeyword);
    }, [filterKeywords]);

    const { setKeywordFilter, clearFilter } = useFilter();
    const [keywordValue, setKeywordValue] = useState('');
    const onKeywordChanged = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        const text = evt.target.value;
        setKeywordValue(text);
        const keywords = text.length > 0 ? text.split(' ') : [];
        setKeywordFilter(keywords);
    }, [setKeywordFilter]);

    const onClear = useCallback(() => {
        clearFilter();
    }, [clearFilter]);

    const [showStyleSettingDialog, setShowStyleSettingDialog] = useState(false);

    const onShowStyleSettingDialog = useCallback(() => {
        setShowStyleSettingDialog(true);
    }, []);

    // const onHideStyleSettingDialog = useCallback(() => {
    //     setShowStyleSettingDialog(false);
    // }, []);

    const [isOpen, setOpen] = useState(false);
    const onToggleBtnClicked = useCallback(() => {
        setOpen(!isOpen);
    }, [isOpen]);

    return (
        <div className={`${styles.ControlArea} ${isSp ? styles.sp : styles.pc}`}>
            <div className={styles.Container + ' ' + (isOpen ? '' : styles.Close)}>
                <DatasetSelector />
                <Button onClick={onGetData} variant="outline-secondary" className={styles.Btn}>
                    <span>{t('Get_Data')}</span>
                    <BsFillCloudArrowDownFill />
                </Button>

                <Button onClick={onShowStyleSettingDialog} variant="outline-secondary" className={styles.Btn}>
                    <span>{t('Style_Setting')}</span>
                    <MdOutlineDesignServices />
                </Button>
                {/* <StyleSettingDialog show={showStyleSettingDialog} onHide={onHideStyleSettingDialog} /> */}

                <Button onClick={onReLayout} variant="outline-secondary" className={styles.Btn}>
                    <span>{t('ReLayout')}</span>
                    <BsLayoutWtf />
                </Button>
                <div className={styles.SubHeader}>
                    {t('Filter')}
                    <span className={styles.ClearArea}>
                        <Button size="sm" variant="outline-secondary" onClick={onClear}>Clear</Button>
                    </span>
                </div>
                <div className={styles.FilterArea}>
                    <Form.Group>
                        <Form.Label>{t('Keyword')}</Form.Label>
                        <Form.Control type="text"value={keywordValue} onChange={onKeywordChanged} />
                    </Form.Group>
                </div>
                <div className={styles.FilterArea}>
                    {/* <CategoryCheckList /> */}
                </div>
                <p className={styles.Footer}>
                    <Link href="/welcome">About</Link>
                </p>
            </div>
            {isSp &&
                <div className={styles.ToggleBtn}>
                    <Button variant="outline-primary" onClick={onToggleBtnClicked}>
                        {
                            isOpen ?
                                <BsArrowLeft />
                                :
                                <FiMenu />
                        }
                    </Button>
                </div>
            }
        </div>
    );
}