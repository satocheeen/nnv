"use client"
import { createCallable } from 'react-call'
import { Button, Modal } from 'react-bootstrap';
import styles from './Confirm.module.scss'
import { DialogMode, DialogResult } from '../_types/types';

interface Props { message: string; title?: string; mode?: DialogMode }
type Response = DialogResult;

export const Confirm = createCallable<Props, Response>(({ call, message, title, mode = DialogMode.OkOnly }) => (
    <Modal show>
        <Modal.Header>{title ?? '確認'}</Modal.Header>
        <Modal.Body>
            <p className={styles.Context}>
                {message}
            </p>
        </Modal.Body>
        <Modal.Footer>
            {(mode === DialogMode.OkCancel || mode === DialogMode.OkOnly) &&
                <Button onClick={()=>call.end(DialogResult.OK)}>OK</Button>
            }
            {mode === DialogMode.OkCancel &&
                <Button variant="secondary" onClick={()=>call.end(DialogResult.Cancel)}>Cancel</Button>
            }
            {mode === DialogMode.YesNo &&
                <>
                    <Button variant="secondary" onClick={()=>call.end(DialogResult.Yes)}>Yes</Button>
                    <Button variant="secondary" onClick={()=>call.end(DialogResult.No)}>No</Button>
                </>
            }
        </Modal.Footer>
    </Modal>
))
