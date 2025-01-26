import { Client } from "@notionhq/client";
import { GetDeletedParam, GetDeletedResult } from "./types";

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
