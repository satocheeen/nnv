import { Client } from '@notionhq/client';
import { RemoveRelationParam } from './types';
import { type UpdatePageParameters } from '@notionhq/client/build/src/api-endpoints';

export const removeRelation = async(token: string, param: RemoveRelationParam) => {
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

        // 削除対象のリレーションを外す
        const updateProp = {
            [targetProp.name]: {
                relation: targetProp.relation.filter(rel => rel.id !== param.to),
            }
        } as UpdatePageParameters['properties'];

        await notion.pages.update({
            page_id: param.from,
            properties: updateProp,
            archived: false,
        });
    
    } catch(e) {
        throw e;
    }
}