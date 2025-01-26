import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SelectNodeStyleBody.module.scss';
import { DbDefine } from '@/app/_types/types';

type Props = {
    target: DbDefine;
    onDefineChange: (define: DbDefine) => void;
}

const nodeStyles = [
    {
        value: 'ellipse',
        text: '●',
    }, {
        value: 'rectangle',
        text: '■',
    }, {
        value: 'diamond',
        text: '◆',
    }
]
export default function SelectNodeStyleBody(props: Props) {
    const onChange = useCallback((value: string) => {
        const newDb = Object.assign({}, props.target, {
            nodeStyle: value,
        });

        props.onDefineChange(newDb);
    }, [props]);

    const gallery = useMemo(() => {
        return nodeStyles.map((ns, index) => {
            const isSelect = (!props.target.nodeStyle && index===0) ||  props.target.nodeStyle === ns.value;
            return (
                <div className={`${styles.Item} ${isSelect ? styles.selected : ''}`} key={ns.value} onClick={()=>onChange(ns.value)}>
                    {ns.text}
                </div>
            );
        });
    }, [props.target, onChange])
    
    const { t } = useTranslation();

    return (
        <>
            <p>{t('Msg_Select_Style')}</p>
            <div className={styles.DbName}>{props.target.name}</div>
            {gallery}
        </>
    );
}