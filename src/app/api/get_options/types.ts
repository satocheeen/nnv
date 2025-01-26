import { DbDefineWithRelation, OptionItem } from "@/app/_types/types";

/**
 * get_options
 * 指定のデータベースのフィルタ項目の選択肢一覧を返す
 */
export type GetOptionsParam = {
    dbDefine: DbDefineWithRelation;
}
export type GetOptionsResult = {
    filterPropertyDefines: FilterPropertyDefine[];
}
export type FilterPropertyDefine = {
    propertyId: string;
    propertyName: string;
    options: OptionItem[];
}
