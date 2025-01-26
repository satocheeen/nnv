import React, { useCallback, useMemo } from 'react';
import styles from './PushToggle.module.scss';
import { Colors } from '@/app/_define/const';

type Props = React.PropsWithChildren & {
    color: keyof (typeof Colors);
    value: boolean;
    onChange?: (val: boolean) => void;
}

export default function PushToggle(props: Props) {

    const onClick = useCallback(() => {
        if (props.onChange) {
            props.onChange(!props.value);
        }
    }, [props]);

    const myStyle = useMemo(() => {
        let color = '#aaa';
        if (props.color && Colors[props.color] !== undefined) {
            color = Colors[props.color];
        }
        return {
            borderColor: color,
            backgroundColor: props.value ? color : '#fff',
        } as React.CSSProperties;
    }, [props.color, props.value]);
    
    return (
        <div onClick={onClick} className={styles.Button} style={myStyle}>
            {props.children}
        </div>
    );
}