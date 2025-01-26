import { Client } from "@notionhq/client";
import { GetSingleDataParam, GetSingleDataResult } from "./types";
import { OptionItem } from "@/app/_types/types";
import { createItem } from "../get_data/get_data";

export const getSingleData = async(token: string, param: GetSingleDataParam): Promise<GetSingleDataResult> => {
    const notion = new Client({
        auth: token,
    });
    const page = await notion.pages.retrieve({
        page_id: param.id,
    });
    if (!('properties' in page)) {
        throw new Error('想定外')
    }

    const categoryList = [] as OptionItem[];
    const item = await createItem(param.dbDefine, page);

    return {
        categories: categoryList,
        item,
    } as GetSingleDataResult;
}
