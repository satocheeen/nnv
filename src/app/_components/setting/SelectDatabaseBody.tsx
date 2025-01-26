import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DbDefine, NetworkDefine } from '@/app/_types/types';
import { Button, ListGroup, ListGroupItem, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './SelectDatabaseBody.module.scss';
import { WorkspaceInfo } from '@/app/api/get_dblist/types';
import useSettingStore from '@/app/_jotai/useSettingStore';
import useApi from '@/app/_util/useApi';
import NotionIcon from '../common/NotionIcon';
import Image from 'next/image';

type Props = {
    workspaceList: WorkspaceInfo[];
    onBack: () => void;
    onNext: () => void;
}

/**
 * データベース選択ページ
 * @param props 
 * @returns 
 */
export default function SelectDatabaseBody(props: Props) {
    const { networkDefine, setNetworkDefine } = useSettingStore();
    const [selectedDb, setSelectedDb] = useState(undefined as {workspaceId: string; dbId: string} | undefined);
    
    useEffect(() => {
        if (!networkDefine || networkDefine.dbList.length === 0) {
            setSelectedDb(undefined);
        } else {
            setSelectedDb({
                workspaceId: networkDefine.workspaceId,
                dbId: networkDefine.dbList[0].id,
            });
        }
    }, [networkDefine]);

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
        const currentDb = networkDefine?.dbList[0];
        const targetWorkspace = props.workspaceList.find(workspace => workspace.workspaceId === selectedDb.workspaceId);
        const targetDb = targetWorkspace?.dbDefines.find(db => db.id === selectedDb.dbId);
        if (!targetDb) {
            console.warn('DBなし');
            return;
        }
        if (selectedDb.workspaceId === networkDefine?.workspaceId && selectedDb.dbId === currentDb?.id) {
            // DB変更ないなら、DB定義を最新に置き換えて次に行く
            const newDbList = networkDefine.dbList.map((db, index) => {
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
            const newNetworkDefine = Object.assign({}, networkDefine, {
                dbList: newDbList,
            });
            setNetworkDefine(newNetworkDefine);
            props.onNext();
            return;
        }
        const newNetworkDefine = {
            workspaceId: selectedDb?.workspaceId,
            dbList: [targetDb],
            relationList: [],
        } as NetworkDefine;
         setNetworkDefine(newNetworkDefine);
        props.onNext();
    }, [networkDefine, props, setNetworkDefine, selectedDb]);

    const api = useApi();
    const oAuthLink = useMemo(() => {
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