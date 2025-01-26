import { Client } from '@notionhq/client';
import { DbInfo } from './types';

/**
 * DB一覧を返す.
 * Relationプロパティを持っているDB限定。
 * @returns 
 */
export const getDbList = async(token: string) => {
    try {
        const dblist = [] as DbInfo[];
        let start_cursor = undefined as undefined | string;

        const notion = new Client({
            auth: token,
        });
        
        do {
            const result = await notion.search({
                filter: {
                    property: 'object',
                    value: 'database',
                },
                start_cursor,
            });
            const list = result.results.filter(res => {
                // Relation項目を持つものに絞る
                if (res.object !== 'database') return false;
                const db = res;
                return Object.values(db.properties).some(prop => {
                    return prop.type === 'relation';
                });
            }).map((res) => {
                if (res.object !== 'database') throw new Error('想定外');
                const db = res;
                if (!('icon' in db)) throw new Error('想定外')
                return {
                    id: db.id,
                    icon: db.icon,
                    title: db.title.reduce((acc, cur) => {
                        return acc + cur.plain_text;
                    }, ''),
                    properties: db.properties,
                };
            });

            start_cursor = result.has_more ? result.next_cursor as string : undefined;

            Array.prototype.push.apply(dblist, list);
    
        } while(start_cursor !== undefined);

        return dblist;

    } catch(e) {
        throw e;
    }
}