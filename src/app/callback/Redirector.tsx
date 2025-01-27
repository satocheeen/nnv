"use client"
import React, { useEffect } from 'react';
import { NotionOauth } from '../_types/types';
import { useAtom } from 'jotai';
import { oAuthInfosAtom } from '../_util/useApi';
import { useRouter } from 'next/navigation';
import { t } from 'i18next';
import { Confirm } from '../_components/Confirm';

type Props = {
    oAuthInfo?: NotionOauth;
}

/**
 * tokenをlocal storageに格納して、元のページに戻るためのコンポーネント
 */
export default function Redirector({ oAuthInfo }: Props) {
    const [ , setOAuthInfos ] = useAtom(oAuthInfosAtom);
    const router = useRouter();

    useEffect(() => {
        if (oAuthInfo) {
            // 認証情報を格納
            setOAuthInfos(cur => {
                const currentIndex = cur.findIndex(info => info.workspace_id === oAuthInfo.workspace_id);
                if (currentIndex === -1) {
                    return cur.concat(oAuthInfo)
                } else {
                    return cur.map((info, index) => {
                        if (index === currentIndex) {
                            return oAuthInfo;
                        } else {
                            return info;
                        }
                    })
                }
            });
        } else {
            Confirm.call({
                message: t('Getting_Access_Token_Error')
            })
        }
        router.push('/')
    }, [oAuthInfo, router, setOAuthInfos])

    return (
        <div>
            {t('Getting_Access_Token')}
        </div>
    );
}