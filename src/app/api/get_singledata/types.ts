import { DbDefineWithRelation } from "@/app/_types/types";
import { GetDataItem } from "../get_data/types";

export type GetSingleDataParam = {
    dbDefine: DbDefineWithRelation;
    id: string; // ページID
}
export type GetSingleDataResult = {
    item: GetDataItem;
}
