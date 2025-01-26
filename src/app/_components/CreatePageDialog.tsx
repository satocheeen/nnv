import React, { useCallback, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { DbDefine } from '../_types/types';
// import useData from '../store/data/useData';
import { Confirm } from './Confirm';

type Props = {
    show: boolean;
    target: {
        dbDefine: DbDefine;
        position: {x: number; y: number};
    };
    onHide: () => void;
}

export default function CreatePageDialog(props: Props) {
    const { t } = useTranslation();
    // const dataHook = useData();

    const onHide = useCallback(() => {
        props.onHide();
    }, [props]);

    const [title, setTitle] = useState('');
    const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
    }, []);

    const onCreate = useCallback(async() => {
        try {
            // await dataHook.createPage(props.target.dbDefine, title, props.target.position);
        } catch(e) {
            Confirm.call({
                message: t('Error_CreatePage') + '\n' + e,
            });
        }
        props.onHide();
    }, [props, title, t]);

    return (
        <Modal show={props.show} onHide={onHide}>
            <Modal.Header closeButton>{props.target.dbDefine.name}ページ作成</Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>タイトル</Form.Label>
                        <Form.Control type='text' value={title} onChange={onChange}></Form.Control>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onCreate}>作成</Button>
                <Button variant='secondary' onClick={onHide}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}