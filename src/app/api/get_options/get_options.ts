import { Client } from '@notionhq/client';
import { type FilterPropertyDefine, type GetOptionsParam, type GetOptionsResult } from './types';

/**
 * 選択項目の選択肢一覧を返す
 */
export const getOptions = async(token: string, param: GetOptionsParam): Promise<GetOptionsResult> => {
    const notion = new Client({
        auth: token,
    });
    
    const dbDef = await notion.databases.retrieve({
        database_id: param.dbDefine.id,
    });
    // フィルタに使用する項目の選択肢を取得
    const filterPropOptions = Object.values(dbDef.properties)
    .filter(prop => {
        const isFilterProp = param.dbDefine.properties.some(paramProp => {
            return paramProp.id === prop.id;
        });
        return isFilterProp;
    })
    .map(prop => {
        if (prop.type === 'select') {
            return {
                propertyId: prop.id,
                propertyName: prop.name,
                options: prop.select.options.map(op => {
                    return {
                        id: op.id as string,
                        name: op.name as string,
                        color: op.color as string,
                    };
                }),
            };
        } else if (prop.type === 'multi_select') {
            return {
                propertyId: prop.id,
                propertyName: prop.name,
                options: prop.multi_select.options.map(op => {
                    return {
                        id: op.id as string,
                        name: op.name as string,
                        color: op.color as string,
                    };
                }),
            };
        } else {
            return {
                propertyId: prop.id,
                propertyName: prop.name,
                options: [],
            }
        }
    }) as FilterPropertyDefine[];

    return {
        filterPropertyDefines: filterPropOptions,
    }
}