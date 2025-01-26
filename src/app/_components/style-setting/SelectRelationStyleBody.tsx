import React, { useCallback, useMemo } from 'react';
import { Form } from 'react-bootstrap';
import styles from './SelectRelationStyleBody.module.scss';
import { NetworkDefine, RelationDefine } from '@/app/_types/types';

type Props = {
    /** 親からもらうprops定義 */
    target: RelationDefine;
    networkDefine: NetworkDefine;
    onDefineChange: (def: RelationDefine) => void;
}

export default function SelectRelationStyleBody(props: Props) {
    const fromDbName = useMemo(() => {
        const fromDb = props.networkDefine.dbList.find(db => db.id === props.target.from.dbId);
        return fromDb?.name;
    }, [props.networkDefine, props.target]);

    const toDbName = useMemo(() => {
        const toDb = props.networkDefine.dbList.find(db => db.id === props.target.to.dbId);
        return toDb?.name;
    }, [props.networkDefine, props.target]);

    const fromValue = useMemo(() => {
        if (!props.target.arrowStyle) {
            return 'none';
        }
        return props.target.arrowStyle.from;
    }, [props.target]);

    const toValue = useMemo(() => {
        if (!props.target.arrowStyle) {
            return 'none';
        }
        return props.target.arrowStyle.to;
    }, [props.target]);

    const onChange = useCallback((evt: React.ChangeEvent<HTMLSelectElement>, target: 'from' | 'to') => {
        const arrowStyle = props.target.arrowStyle ? 
                            Object.assign({}, props.target.arrowStyle) 
                            : {
                                from: 'none',
                                to: 'none',
                            };
        if (target === 'from') {
            arrowStyle.from = evt.target.value;
        } else {
            arrowStyle.to = evt.target.value;
        }
        const newDefine = Object.assign({}, props.target, {
            arrowStyle,
        });
        props.onDefineChange(newDefine);
    }, [props]);

    return (
        <table className={styles.Table}>
            <thead>
                <tr>
                    <th>DB1</th>
                    <th></th>
                    <th></th>
                    <th>DB2</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{fromDbName}</td>
                    <td>
                        <Form.Select value={fromValue} onChange={(e) => onChange(e, 'from')}>
                            <option value="none">―</option>
                            <option value="triangle">←</option>
                        </Form.Select>
                    </td>
                    <td>
                    <Form.Select value={toValue} onChange={(e) => onChange(e, 'to')}>
                            <option value="none">―</option>
                            <option value="triangle">→</option>
                        </Form.Select>
                    </td>
                    <td>{toDbName}</td>
                </tr>
            </tbody>
        </table>
    );
}