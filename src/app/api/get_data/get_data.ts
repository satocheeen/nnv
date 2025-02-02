import { Client } from '@notionhq/client';
import { type PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { GetDataItem, GetDataParam, GetDataResult } from './types';
import { DbDefineWithRelation } from '@/app/_types/types';

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

export const createItem = async(define: DbDefineWithRelation, page: PageObjectResponse) => {
    // const image = await getImageUrl(page.id);

    const titleCol = Object.values(page.properties).find(prop => prop.type === 'title');
    const title = titleCol?.title.map(t=>t.plain_text).join() ?? '';

    // フィルタに使用する項目情報
    const filterPropertyValue = {} as {[propertyId: string]: string[]};
    const urlPropertyValue = {} as {[propertyId: string]: string};

    define.properties.forEach(defProp => {
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
