/* eslint-disable @next/next/no-img-element */
"use client"
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './page.module.scss';
import { Button } from 'react-bootstrap';
import MarkdownViewer from '../_components/common/MarkdownViewer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAtomCallback } from 'jotai/utils';
import { visitedAtom } from '../_jotai/operation';

export default function Welcome() {
    const router = useRouter();
    const onStart = useAtomCallback(
        useCallback((get, set) => {
            router.push('/');
            set(visitedAtom, true);
        }, [router])
    );

    const { t } = useTranslation();

    return (
        <div className={styles.Container}>
            <div className={styles.Header}>
                <h1>Welcome to Notion Network Viewer!</h1>
                <div className={styles.ImageArea}>
                    <img src='/nnv-img.png' alt="title" />
                </div>
                <Button size="lg" onClick={onStart}>{t('Start')}</Button>
            </div>
            <MarkdownViewer mdfileName='welcome.md' />
            <div className={styles.BottomStartBtn}>
                <Button size="lg" onClick={onStart}>{t('Start')}</Button>
            </div>
            <div className={styles.Footer}>
                <Link href="/privacy-policy">{t('Privacy_Policy')}</Link>
                <Link href="/terms-of-use">{t('Terms_of_Use')}</Link>
            </div>
        </div>
    );
}