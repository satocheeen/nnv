import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { GetDataItem, GetDataParam, GetDataResult } from './types';
import { GetSingleDataParam, GetSingleDataResult } from '../get_single_data/types';
import { DbDefineWithRelation, OptionItem } from '@/app/_types/types';
import { GetDeletedParam, GetDeletedResult } from '../get_deleted/types';

export const getData = async(token: string, param: GetDataParam): Promise<GetDataResult> => {
    const notion = new Client({
        auth: token,
    });
    
    const dbDef = await notion.databases.retrieve({
        database_id: param.dbDefine.id,
    });
    const myPage = await notion.databases.query({
        database_id: param.dbDefine.id,
        page_size: 30,
        start_cursor: param.nextCursor,
        sorts: [
            {
                timestamp: 'last_edited_time',
                direction: 'descending',
            }
        ]
    });
    
    const items = [] as GetDataItem[];
    let nextCursor = myPage.next_cursor;
    for (const page of myPage.results) {
        if (page.object !== 'page') continue;
        if (!('properties' in page)) continue;
        if (param.lastEditedTime) {
            const isBreak = page.last_edited_time.localeCompare(param.lastEditedTime) <= 0;
            if (isBreak) {
                nextCursor = null;
                break;
            }
        }

        // logger.debug(page.properties);

        const item = await createItem(param.dbDefine, page);
        items.push(item);
    }
    
    return {
        items,
        hasMore: myPage.has_more,
        nextCursor,
        lastEditedTime: 'last_edited_time' in dbDef ? dbDef.last_edited_time : '',
    }
}

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

const createItem = async(define: DbDefineWithRelation, page: PageObjectResponse) => {
    // const image = await getImageUrl(page.id);

    const titleCol = Object.values(page.properties).find(prop => prop.type === 'title');
    const title = titleCol?.title.map(t=>t.plain_text).join() ?? '';

    // フィルタに使用する項目情報
    const filterPropertyValue = {} as {[propertyId: string]: string[]};
    const urlPropertyValue = {} as {[propertyId: string]: string};

    define.properties.forEach(defProp => {
        if(!defProp.isUse) {
            return;
        }
        const targetProperty = Object.values(page.properties).find(prop => prop.id === defProp.id);
        if (targetProperty?.type === 'select') {
            const category = targetProperty.select;
            if (category) {
                filterPropertyValue[defProp.id] = [category?.id as string];
            }
        } else if(targetProperty?.type === 'multi_select') {
            const categories = targetProperty.multi_select;
            filterPropertyValue[defProp.id] = categories.map(category => category.id as string);
        } else if(targetProperty?.type === 'url') {
            if (targetProperty.url) {
                urlPropertyValue[defProp.id] = targetProperty.url;
            }
        }
        console.log('urlPropertyValue', urlPropertyValue);
    })

    const result = {
        id: page.id,
        name: title,
        filterPropertyValue,
        urlPropertyValue,
        // image: image === null ? undefined : image,
        url: page.url,
        lastEditedTime: page.last_edited_time,
    } as GetDataItem;

    result['relations'] = define.relationColIds?.map(colId => {
        const relationCol = Object.values(page.properties).find(prop => prop.id === colId);
        if (relationCol?.type !== 'relation') {
            throw new Error('想定外')
        } 
        return {
            relColId: colId,
            ids: relationCol ? relationCol.relation.map(r => r.id) : [],
        };
    })

    return result;
}

/**
 * 削除されたアイテム情報を返す
 * @param ids クライアントが持っているID一覧
 */
export const getDeleted = async(token: string, param: GetDeletedParam): Promise<GetDeletedResult> => {
    const notion = new Client({
        auth: token,
    });
    // DBの更新日時チェック -> データ削除してもDB更新日時変わらないのでコメントアウト
    // if (param.lastEditedTime) {
    //     const dbDef = await notion.databases.retrieve({
    //         database_id: param.dbDefine.id,
    //     });
    //     if (dbDef.last_edited_time.localeCompare(param.lastEditedTime) <= 0) {
    //         // 更新されてないなら、すぐに復帰
    //         logger.debug('更新なし', dbDef.last_edited_time);
    //         return [];
    //     }
    // }
    const noExistIdList = param.existIds.concat();
    let nextCursor = undefined as string | undefined;
    do {
        const myPage = await notion.databases.query({
            database_id: param.dbDefine.id,
            start_cursor: nextCursor,
        });
        for (const page of myPage.results) {
            const index = noExistIdList.indexOf(page.id);
            if (index !== -1) {
                // 存在するものは一覧から除外する
                noExistIdList.splice(index, 1);
            }
        }
        nextCursor = myPage.has_more && myPage.next_cursor ? myPage.next_cursor : undefined;
    } while(nextCursor !== undefined);

    return noExistIdList;
}