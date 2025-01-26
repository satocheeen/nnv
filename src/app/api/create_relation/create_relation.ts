import { Client } from '@notionhq/client';
import { CreateRelationParam } from './types';
import { UpdatePageParameters } from '@notionhq/client/build/src/api-endpoints';

export const createRelation = async(token: string, param: CreateRelationParam) => {
    try {
        const notion = new Client({
            auth: token,
        });
        
        const fromPage = await notion.pages.retrieve({
            page_id: param.from,
        });
        if (!('properties' in fromPage)) {
            throw new Error('想定外')
        }
        const targetProp = Object.entries(fromPage.properties).map(([key, value]) => {
            return Object.assign({}, value, {
                name: key,
            });
        }).find(prop => prop.id === param.def.from.propertyId);
        if (!targetProp) {
            // TODO: 異常系処理
            return;
        }
        if (targetProp.type !== 'relation'){
            // TODO: 異常系処理
            return;
        }

        // リレーションを追加する
        const updateProp = {
            [targetProp.name]: {
                relation: targetProp.relation.concat({
                    id: param.to,
                }),
            }
        } as UpdatePageParameters['properties'];

        const result = await notion.pages.update({
            page_id: param.from,
            properties: updateProp,
            archived: false,
        });
    
        return {
            result: 'ok',
            id: result.id,
        };

    } catch(e) {
        throw e;
    }
}