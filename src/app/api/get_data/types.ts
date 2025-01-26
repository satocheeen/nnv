import { DbDefineWithRelation, Relation } from "@/app/_types/types";

/**
 * get_data
 * 指定のデータベースの最新データを取得する
 */
export type GetDataParam = {
    dbDefine: DbDefineWithRelation;
    nextCursor?: string;
    lastEditedTime?: string;
}
export type GetDataResult = {
    items: GetDataItem[];
    hasMore: boolean;
    nextCursor: string | null;
    lastEditedTime: string; // DBの最終更新日時
}
export type GetDataItem = {
    id: string;
    name: string;
    filterPropertyValue: {[propertyId: string]: string[]};
    urlPropertyValue: {[propertyId: string]: string};
    // image?: string;
    // imageBase64?: string;
    url: string;
    lastEditedTime: string;
    relations: Relation[];
}
