"use client"
import axios from 'axios';
import i18next from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import styles from './MarkdownViewer.module.scss';
import { useRouter } from 'next/navigation';

type Props = {
    mdfileName: string; // mdフォルダ配下に格納している、表示対象のmdファイル名
    showBack?: boolean;     // 末尾に「戻る」を表示する場合、true
}

export default function MarkdownViewer(props: Props) {
    const [markdownText, setMarkdownText] = useState('');
    
    useEffect(() => {
        // 言語によって読み込みファイル切り替え
        const load = (lang: string): Promise<void> => {
            return new Promise<void>((resolve, reject) => {
                axios.get('/md/' + lang + '/' + props.mdfileName)
                .then(result => {
                    console.log('result.status', result);
                    if (result.status !== 200) {
                        reject();
                        return;
                    }
                    const text = result.data as string;
                    if (text.toLowerCase().startsWith('<!doctype html>')) {
                        // 存在しないパスを渡した場合、Routerがhtmlを返すので、そのケースへの対応
                        reject('not markdown');
                        return;
                    }
                    setMarkdownText(text);
                    resolve();
                })
                .catch(e => {
                    reject(e);
                });
            });
        }
        load(i18next.language)
        .catch(e => {
            console.warn('language file not found', i18next.language, e);
            return load('en');
        })
        .catch(e => {
            console.warn('language file not found', 'en', e);
            load('ja');
        });

    }, [props.mdfileName]);

    const router = useRouter();

    const onBack = useCallback(() => {
        router.back();
        // navigate(-1);
    }, [router]);

    const { t } = useTranslation();

    return (
        <div className={styles.Container}>
            <div className={styles.Contents}>
                <ReactMarkdown>
                    {markdownText}
                </ReactMarkdown>
                {props.showBack &&
                <p className={styles.Back}>
                    <a href="#" onClick={onBack}>{t('Back')}</a>
                </p>
                }
            </div>
        </div>
    );
}