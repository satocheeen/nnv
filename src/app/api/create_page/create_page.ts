import { Client } from '@notionhq/client';
import { type CreatePageParam } from './types';
import { type CreatePageParameters } from '@notionhq/client/build/src/api-endpoints';

export const createPage = async(token: string, param: CreatePageParam) => {
        try {
        const notion = new Client({
            auth: token,
        });
        
        const dbinfo = await notion.databases.retrieve({
            database_id: param.dbDefine.id,
        });
        const titleColName = Object.values(dbinfo.properties).find(prop => prop.type === 'title')?.name as string;
        const properties = {} as CreatePageParameters['properties'];
        properties[titleColName] = {
            title: [
                {
                    type: 'text',
                    text: {
                        content: param.title,
                    }
                }
            ]
        };
    
        const result = await notion.pages.create({
            parent: {
                database_id: param.dbDefine.id,
            },
            properties,
        });

        return {
            result: 'ok',
            id: result.id,
        };

    } catch(e) {
        throw e;
    }
}