import { DbDefine } from "@/app/_types/types";

export type GetDeletedParam = {
    dbDefine: DbDefine;
    existIds: string[];
    lastEditedTime?: string;
}
export type GetDeletedResult = string[];
