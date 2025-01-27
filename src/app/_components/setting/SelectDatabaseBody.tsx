import React, { useCallback, useMemo, useState } from 'react';
import { DbDefine, NetworkDefine } from '@/app/_types/types';
import { Button, ListGroup, ListGroupItem, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './SelectDatabaseBody.module.scss';
import { WorkspaceInfo } from '@/app/api/get_dblist/types';
import useApi from '@/app/_util/useApi';
import NotionIcon from '../common/NotionIcon';
import Image from 'next/image';

type Props = {
    workspaceList: WorkspaceInfo[];
    networkDefine: NetworkDefine;
    onBack: () => void;
    onNext: (networkDefine: NetworkDefine) => void;
}

/**
 * データベース選択ページ
 * @param props 
 * @returns 
 */
export default function SelectDatabaseBody(props: Props) {
    const initialSelectedDb = useMemo(() => {
        if (props.networkDefine.dbList.length === 0) {
            return undefined;
        } else {
            return{
                workspaceId: props.networkDefine.workspaceId,
                dbId: props.networkDefine.dbList[0].id,
            };
        }

    }, [props.networkDefine]);
    const [selectedDb, setSelectedDb] = useState<{workspaceId: string; dbId: string} | undefined>(initialSelectedDb);
    
    // DB選択
    const onDbSelect = useCallback((workspaceId: string, dbInfo: DbDefine) => {
        setSelectedDb({
            workspaceId,
            dbId: dbInfo.id
        });
    }, []);
    
    const { t } = useTranslation();

    const okable = useMemo(() => {
        return selectedDb !== undefined;
    }, [selectedDb]);

    const onOk = useCallback(() => {
        if (selectedDb === undefined) {
            return;
        }
        const currentDb = props.networkDefine.dbList[0];
        const targetWorkspace = props.workspaceList.find(workspace => workspace.workspaceId === selectedDb.workspaceId);
        const targetDb = targetWorkspace?.dbDefines.find(db => db.id === selectedDb.dbId);
        if (!targetDb) {
            console.warn('DBなし');
            return;
        }
        if (selectedDb.workspaceId === props.networkDefine.workspaceId && selectedDb.dbId === currentDb?.id) {
            // DB変更ないなら、DB定義を最新に置き換えて次に行く
            const newDbList = props.networkDefine.dbList.map((db, index) => {
                if (index !== 0) {
                    return db;
                }
                const newDb = Object.assign({}, targetDb);
                newDb.nodeStyle = db.nodeStyle;
                newDb.properties.forEach(prop => {
                    const hit = db.properties.find(currentProp => currentProp.id === prop.id);
                    if (!hit) {
                        return;
                    }
                    prop.isUse = hit.isUse;
                });
                return newDb;
            });
            const newNetworkDefine = Object.assign({}, props.networkDefine, {
                dbList: newDbList,
            });
            props.onNext(newNetworkDefine);
            return;
        }
        const newNetworkDefine = {
            workspaceId: selectedDb?.workspaceId,
            dbList: [targetDb],
            relationList: [],
        } as NetworkDefine;
        props.onNext(newNetworkDefine);
    }, [props, selectedDb]);

    const api = useApi();
    const oAuthLink = useMemo(() => {
        if (!process.env.NEXT_PUBLIC_NOTION_API_CLIENT_ID) return null;

        return (
            <p className={styles.AuthMessage}>
                <a href="#" onClick={api.oAuth}>
                    {t('Msg_Auth_Database')}
                    <Image src='/notion-logo.png' alt="Notion Logo" width='36' height='36' />
                </a>
            </p>
        )
    }, [t, api.oAuth])

    if (props.workspaceList.length === 0) {
        return oAuthLink;
    }

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
                <ListGroup>
                    {props.workspaceList.map(workspace => {
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