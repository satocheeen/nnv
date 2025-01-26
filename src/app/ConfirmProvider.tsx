"use client"
import { Confirm } from './_components/Confirm';

// クライアントコンポーネントとして定義する必要があるので、
// layout.tsxの外に切り出している
export default function ConfirmProvider() {
    return (
        <Confirm.Root />
    );
}