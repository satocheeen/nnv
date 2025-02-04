import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DbDefine } from '@/app/_types/types';
import { Button, ListGroup, ListGroupItem, Modal, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './SelectDatabaseBody.module.scss';
import { WorkspaceInfo } from '@/app/api/get_dblist/types';
import useApi from '@/app/_util/useApi';
import NotionIcon from '../common/NotionIcon';
import Image from 'next/image';
import { Confirm } from '../Confirm';
import { DbKey } from './SettingDialog';

type Props = {
    datasetId: string;
    onBack: () => void;
    onNext: (targetWorkspaceDbList: DbDefine[], baseDbKey: DbKey) => void;
}

/**
 * 基点データベース選択ページ
 * @param props 
 * @returns 
 */
export default function SelectDatabaseBody(props: Props) {
    const [workspaceList, setWorkspaceList] = useState([] as WorkspaceInfo[]);
    const { t } = useTranslation();
    const [selectedDb, setSelectedDb] = useState<DbKey | undefined>();
    
    console.log('selectedDb', selectedDb)
    // DB一覧読み込み
    const { getWorkspaceList, executeOAuth } = useApi();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const loadDbList = async() => {
            setLoading(true);
            try {
                const workspaceInfo = await getWorkspaceList();
                setWorkspaceList(workspaceInfo);
            } catch(e) {
                Confirm.call({
                    message: t('Error_GetDbList') + '\n' + e,
                })
            } finally {
                setLoading(false);
            }
        }
        loadDbList();
    }, [getWorkspaceList, props.datasetId, t]);


    // DB選択
    const onDbSelect = useCallback((workspaceId: string, dbInfo: DbDefine) => {
        setSelectedDb({
            workspaceId,
            dbId: dbInfo.id
        });
    }, []);

    const okable = useMemo(() => {
        return selectedDb !== undefined;
    }, [selectedDb]);

    const onOk = useCallback(() => {
        if (selectedDb === undefined) {
            return;
        }
        const targetWorkspaceDbList = workspaceList.find(item => item.workspaceId === selectedDb.workspaceId)?.dbDefines ?? [];
        props.onNext(targetWorkspaceDbList, selectedDb);
    }, [props, selectedDb, workspaceList]);

    const oAuthLink = useMemo(() => {
        if (!process.env.NEXT_PUBLIC_NOTION_API_CLIENT_ID) return null;

        return (
            <p className={styles.AuthMessage}>
                <a href="#" onClick={executeOAuth}>
                    {t('Msg_Auth_Database')}
                    <Image src='/notion-logo.png' alt="Notion Logo" width='36' height='36' />
                </a>
            </p>
        )
    }, [executeOAuth, t])

    return (
        <>
            <Modal.Body>
                <div className={styles.MessageArea}>
                    <p>
                        {t('Msg_Select_Database')}<br/>
                        {t('Msg_Select_Database_Sup')}
                    </p>
                    {oAuthLink}
                </div>
                {loading &&
                    <div className={styles.SpinnerArea}>
                        <Spinner animation='border' variant='info'/>
                    </div>
                }
                <ListGroup>
                    {workspaceList.map(workspace => {
                        return (
                            <ListGroupItem key={workspace.workspaceId}>
                                {workspace.workspaceName}
                                <ListGroup>
                                    {workspace.dbDefines.map(db => {
                                        return (
                                            <ListGroupItem action key={db.id} onClick={()=>onDbSelect(workspace.workspaceId, db)} active={selectedDb?.workspaceId === workspace.workspaceId && selectedDb?.dbId===db.id}>
                                                {db.icon &&
                                                    <NotionIcon icon={db.icon} />
                                                }
                                                {db.name}
                                            </ListGroupItem>
                                        )
                                    })}
                                </ListGroup>
                            </ListGroupItem>
                        )
                    })}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button disabled={!okable} onClick={onOk}>
                    {t('Next')}
                </Button>
                <Button variant="outline-secondary" onClick={props.onBack}>{t('Back')}</Button>
            </Modal.Footer>
        </>
    );
}