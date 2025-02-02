import { type DbDefine } from "@/app/_types/types";

export type CreatePageParam = {
    dbDefine: DbDefine;
    title: string;
}
export type CreatePageResult = {
    result: 'ok' | 'error';
    id: string; // 作成したページのID
    message?: string; // エラーメッセージ
}
