import React from 'react';
import styles from './NotionIcon.module.scss';
import { Icon } from '@/app/_types/types';

type Props = {
    icon: Icon;
}

export default function NotionIcon(props: Props) {
    switch(props.icon.type) {
        case 'emoji':
            return (
                <span>
                    {props.icon.emoji}
                </span>
            );
        case 'file':
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.Icon} src={props.icon.file?.url} alt="icon" />
            )
        default:
            return null;
    }
}