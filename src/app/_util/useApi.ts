import axios from "axios";
import { NotionOauth, Property } from "../_types/types"
import { useCallback } from "react";
import { atom, useAtom } from "jotai";
import { currentDatasetAtom } from "../_jotai/operation";
import { DbInfo, WorkspaceInfo } from "../api/get_dblist/types";
import { GetOptionsParam, GetOptionsResult } from "../api/get_options/types";
import { GetDataParam, GetDataResult } from "../api/get_data/types";
import { GetSingleDataParam, GetSingleDataResult } from "../api/get_single_data/types";
import { GetDeletedParam, GetDeletedResult } from "../api/get_deleted/types";
import { CreatePageParam, CreatePageResult } from "../api/create_page/types";
import { CreateRelationParam, CreateRelationResult } from "../api/create_relation/types";
import { RemoveRelationParam } from "../api/remove_relation/types";
import { useAtomCallback } from "jotai/utils";

const oAuthInfosAtom = atom<NotionOauth[]>([]);
const myOAuthInfosAtom = atom((get) => {
    if (process.env.NEXT_PUBLIC_DEVELOPER_MODE==='true') {
        return [{
            access_token: '',
            workspace_id: '',
        } as NotionOauth];
    }
    const originalOAuthInfos = get(oAuthInfosAtom);
    return originalOAuthInfos;
})
const hasTokenAtom = atom((get) => {
    const oAuthInfos = get(myOAuthInfosAtom);
    return oAuthInfos.length > 0;
})

type ApiResult<RESULT> = {
    result: 'ok' | 'error';
    data?: RESULT;
    message?: string;
}

console.log('process.env.NEXT_PUBLIC_DEVELOPER_MODE', process.env.NEXT_PUBLIC_DEVELOPER_MODE)
export default function useApi() {
    const [ hasToken ] = useAtom(hasTokenAtom);

    /**
     * Notion認証を行う
     */
    const oAuth = useCallback(() => {
        let url = 'https://api.notion.com/v1/oauth/authorize?';
        url += 'client_id=ef9ba1e2-4acb-4740-a99b-7e015c1b6cf8';
        url += '&redirect_uri=https://nnv.satocheeen.com/callback/';
        url += '&response_type=code';
        url += '&owner=user';
        if (process.env.NEXT_PUBLIC_DEVELOPER_MODE === 'true') {
            url += '&state=dev';
        }
        document.location.href = url;

    }, []);
    
    /**
     * 指定のワークスペース用のtokenを返す。
     * ワークスペース未指定の場合は、カレントデータセットのワークスペースのtokenを返す。
     */
    const getToken = useAtomCallback(
        useCallback((get, set, workspaceId?: string): string | undefined => {
            const currentDataset = get(currentDatasetAtom);
            const oAuthInfos = get(myOAuthInfosAtom);
            const wpId = workspaceId ? workspaceId : currentDataset?.networkDefine.workspaceId;
            if (!wpId) {
                return undefined;
            }
            const token = oAuthInfos.find(info => info.workspace_id === wpId)?.access_token;
            return token;
        }, [])
    )

    /**
     * 
     * @param action 
     * @param params 
     * @param workspaceId ワークスペース。未指定の場合は、カレントデータセットのワークスペース。
     * @returns 
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiAction = useCallback(async<RESULT>(action: string, params: any, workspaceId?: string): Promise<RESULT> => {
        // アクセストークン用意
        const token = getToken(workspaceId);
        if (token === undefined && !process.env.NEXT_PUBLIC_DEVELOPER_MODE) {
            throw new Error('not found token');
        }

        const result = await axios.post(`/api/${action}`, {
            token,
            params,
        });
        if (result.status !== 200) {
            console.warn(result.data);
            throw `failed ${action}`;
        }
        const apiRes = result.data as RESULT;
        return apiRes;

    }, [getToken]);

    const getDbList = useAtomCallback(
        useCallback(async(get) => {
            const resultList = [] as WorkspaceInfo[];
            // アクセス可能な全てのワークスペースのDB一覧を取得する
            const oAuthInfos = get(myOAuthInfosAtom);
            for (const oAuthInfo of oAuthInfos) {
                console.log('getDbList', oAuthInfo);
                const dbInfos = await apiAction<DbInfo[]>('get_dblist', undefined, oAuthInfo.workspace_id);
                if (dbInfos.length === 0) {
                    continue;
                }
                // 加工
                const dbDefines = dbInfos.map(res => {
                    return {
                        id: res.id,
                        name: res.title,
                        icon: res.icon,
                        properties: Object.values(res.properties).map(prop => {
                            let relation;
                            if (prop.type === 'relation') {
                                const relDb = dbInfos.find(r => r.id === prop.relation?.database_id);
                                const relProp = relDb?.properties[prop.relation?.synced_property_name as string];
                                relation = {
                                    dbId: relDb?.id as string,
                                    propertyId: relProp?.id as string,
                                }
                            }
                            return {
                                id: prop.id,
                                name: prop.name,
                                type: prop.type,
                                isUse: false,
                                relation,
                            } as Property;
                        }),
                    };
                });
    
                resultList.push({
                    workspaceId: oAuthInfo.workspace_id,
                    workspaceName: oAuthInfo.workspace_name,
                    dbDefines,
                });
            }
            return resultList;
        }, [apiAction])
    
    )
    
     /**
     * get_options
     * 指定のデータベースのフィルタ項目の選択肢一覧を返す
     */
    const getOptions = (param: GetOptionsParam) => apiAction<GetOptionsResult>('get_options', param);

    /**
     * get_data
     * 指定のデータベースの最新データを取得する
     */
    const getData = (param: GetDataParam) => apiAction<GetDataResult>('get_data', param);

    /**
     * get_singledata
     */
    const getSingleData = (param: GetSingleDataParam) => apiAction<GetSingleDataResult>('get_singledata', param);

    /**
     * get_deleted
     */
    const getDeleted = (param: GetDeletedParam) => apiAction<GetDeletedResult>('get_deleted', param);

    /**
     * create_page
     */
    const createPage = (param: CreatePageParam) => apiAction<CreatePageResult>('create_page', param);

    /**
     * create_relation
     */
    const createRelation = (param: CreateRelationParam) => apiAction<CreateRelationResult>('create_relation', param);

     /**
     * remove_relation
     */
    const removeRelation = (param: RemoveRelationParam) => apiAction<void>('remove_relation', param);

    const getImage = useCallback(async(id: string) => {
        // アクセストークン用意
        const token = getToken();
        if (token === undefined && !process.env.NEXT_PUBLIC_DEVELOPER_MODE) {
            throw new Error('not found token');
        }

        const result = await axios.post('/api/get_image', {
            token,
            id,
        });
        return result.data;

    }, [getToken]);

    return {
        hasToken,
        oAuth,
        getDbList,
        getOptions,
        getData,
        getSingleData,
        getDeleted,
        createPage,
        createRelation,
        removeRelation,
        getImage,
    } 
}

export async function apiOAuth(code: string): Promise<NotionOauth> {
    const result = await axios.post('/api/oauth', {
        code,
    });
    const apiRes = result.data as ApiResult<NotionOauth>;
    if (apiRes.result === "error") {
        console.warn(apiRes.message);
        throw apiRes.message;
    }
    return apiRes.data as NotionOauth;
}
