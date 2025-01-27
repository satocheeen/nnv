import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Button, Toast } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './Guide.module.scss';
import useMedia from 'use-media';
import { useAtom } from 'jotai';
import useGuide, { operatedGuidesAtom, tempGuideAtom } from './useGuide';
import { GuideKind } from '@/app/_types/types';

/**
 * 操作説明パネル
 */
export default function Guide() {
    const isSp = useMedia({
        orientation: 'portrait',
    });
    // ユーザ操作に対する一時的な操作説明。操作中のみ表示。
    const [ tempGuide ] = useAtom(tempGuideAtom);

    // 初めて触る人向けの操作説明
    const [ operatedGuides ] = useAtom(operatedGuidesAtom);
    
    const { t } = useTranslation();

    const [tempGuideShow, setTempGuideShow] = useState(false);

    useEffect(() => {
        setTempGuideShow(tempGuide !== undefined);
    }, [tempGuide]);

    const currentGuide = useMemo(() => {
        const allGuides = Object.keys(GuideKind) as GuideKind[];
        return allGuides.find(guide => !operatedGuides.includes(guide));
    }, [operatedGuides]);

    const currentMessage = useMemo(() => {
        if (tempGuide) {
            return t('Guide_' + tempGuide.kind);
        } else if (currentGuide){
            return t('Guide_' + currentGuide);
        } else {
            return null;
        }
    }, [t, currentGuide, tempGuide]);

    const showCancelBtn = useMemo(() => {
        return tempGuide?.onCancel !== undefined;
    }, [tempGuide]);

    const onCancel = useCallback(() => {
        if (tempGuide?.onCancel){
            tempGuide.onCancel();
        }
    }, [tempGuide]);

    const { operatedGuide } = useGuide();
    const onClose = useCallback(() => {
        if (tempGuide) {
            setTempGuideShow(false);
        } else if (currentGuide) {
            operatedGuide(currentGuide);
        }
    }, [tempGuide, currentGuide, operatedGuide]);

    if ((tempGuide && !tempGuideShow) || currentMessage=== null) {
        return null;
    }
    return (
        <div className={`${styles.GuideArea} ${isSp ? styles.sp : styles.pc}`}>
            <Toast onClose={onClose}>
                <Toast.Header closeButton={!showCancelBtn}>
                    <strong className="me-auto">{t('Guide')}</strong>
                </Toast.Header>
                <Toast.Body>
                    {currentMessage}
                    {showCancelBtn &&
                        <div className={styles.CancelBtnArea}>
                            <Button size="sm" variant="outline-primary" onClick={onCancel}>Cancel</Button>
                        </div>
                    }
                </Toast.Body>
            </Toast>
        </div>
    );
}