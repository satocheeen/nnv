import axios from "axios";
import { NotionOauth } from "../_types/types"
import { useCallback } from "react";
import { atom } from "jotai";
import { currentDatasetAtom } from "../_jotai/operation";
import { DbInfo, WorkspaceInfo } from "../api/get_dblist/types";
import { GetOptionsParam, GetOptionsResult } from "../api/get_options/types";
import { GetDataParam, GetDataResult } from "../api/get_data/types";
import { GetSingleDataParam, GetSingleDataResult } from "../api/get_singledata/types";
import { GetDeletedParam, GetDeletedResult } from "../api/get_deleted/types";
import { CreatePageParam, CreatePageResult } from "../api/create_page/types";
import { CreateRelationParam, CreateRelationResult } from "../api/create_relation/types";
import { RemoveRelationParam } from "../api/remove_relation/types";
import { atomWithStorage, useAtomCallback } from "jotai/utils";
import { useTranslation } from "react-i18next";

type NotionOAuthInfo = {
    type: 'public';
    oAuths: NotionOauth[];
} | {
    type: 'internal';
}
export const oAuthInfosAtom = atomWithStorage<NotionOauth[]>('notionOAuths', [], undefined, { getOnInit: true });
const myOAuthInfosAtom = atom<NotionOAuthInfo>((get) => {
    if (process.env.NEXT_PUBLIC_NOTION_API_CLIENT_ID) {
        // publicの場合
        const oAuths = get(oAuthInfosAtom);
        return {
            type: 'public',
            oAuths,
        }
    } else {
        // internalの場合
        return {
            type: 'internal'
        }
    }
})

export const hasTokenAtom = atom((get) => {
    const oAuthInfos = get(myOAuthInfosAtom);
    if (oAuthInfos.type === 'internal') return true;
    return oAuthInfos.oAuths.length > 0;
})

export type OAuthRedirectState = {
    state: 'select-database';
    datasetId: string;
}
export const oAuthRedirectStateAtom = atom<OAuthRedirectState|undefined>();

const NotionOAuthRedirectUri = process.env.NEXT_PUBLIC_NOTION_OAUTH_REDIRECT_URL || (typeof document !== undefined ? `${document.location.protocol}://${document.location.host}/callback/` : '');

export default function useApi() {
    /**
     * Notion認証を行う
     */
    const executeOAuth = useAtomCallback(
        useCallback((get) => {
            const state = get(oAuthRedirectStateAtom);
            let url = 'https://api.notion.com/v1/oauth/authorize?';
            url += `client_id=${process.env.NEXT_PUBLIC_NOTION_API_CLIENT_ID}`;
            url += `&redirect_uri=${NotionOAuthRedirectUri}`;
            url += '&response_type=code';
            url += '&owner=user';
            if (state) {
                url += `&state=${JSON.stringify(state)}`;
            }
            document.location.href = url;
        }, [])
    )
    
    /**
     * 指定のワークスペース用のtokenを返す。
     * ワークスペース未指定の場合は、カレントデータセットのワークスペースのtokenを返す。
     */
    const getToken = useAtomCallback(
        useCallback((get, set, workspaceId?: string): string | undefined => {
            const currentDataset = get(currentDatasetAtom);
            const oAuthInfos = get(myOAuthInfosAtom);
            if (oAuthInfos.type === 'internal') return;
            const wpId = workspaceId ? workspaceId : currentDataset?.networkDefine.workspaceId;
            if (!wpId) {
                return undefined;
            }
            const token = oAuthInfos.oAuths.find(info => info.workspace_id === wpId)?.access_token;
            return token;
        }, [])
    )

    const { t } = useTranslation();
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
        if (token === undefined && process.env.NEXT_PUBLIC_NOTION_API_CLIENT_ID) {
            // TODO: トークン取得
            console.warn('not find token')
            throw new Error(t('Getting_Access_Token'));
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

    }, [getToken, t]);

    const getWorkspaceList = useAtomCallback(
        useCallback(async(get) => {
            const hasToken = get(hasTokenAtom);
            if (!hasToken) {
                // トークン取得
                executeOAuth();
                return [];
            }
            const resultList = [] as WorkspaceInfo[];
            // アクセス可能な全てのワークスペースのDB一覧を取得する
            const oAuthInfos = get(myOAuthInfosAtom);

            const workspaceInfos = (() => {
                if (oAuthInfos.type === 'internal') {
                    return [
                        {
                            workspace_id: undefined,
                            workspace_name: undefined,
                        }
                    ]
                } else {
                    return oAuthInfos.oAuths.map(item => {
                        return {
                            workspace_id: item.workspace_id,
                            workspace_name: item.workspace_name,
                        }
                    })
                }
            })();
            for (const wk of workspaceInfos) {
                const dbInfos = await apiAction<DbInfo[]>('get_dblist', undefined, wk.workspace_id);
                if (dbInfos.length === 0) {
                    continue;
                }
                // 加工
                const dbDefines = dbInfos.map(res => {
                    return {
                        id: res.id,
                        name: res.title,
                        icon: res.icon,
                        properties: Object.values(res.properties),
                    };
                });
    
                resultList.push({
                    workspaceId: wk.workspace_id ?? '',
                    workspaceName: wk.workspace_name ?? '',
                    dbDefines,
                });
            }
            return resultList;
        }, [apiAction, executeOAuth])
    
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
        if (token === undefined && process.env.NEXT_PUBLIC_NOTION_API_CLIENT_ID) {
            // TODO: トークン取得
            throw new Error('not found token');
        }

        const result = await axios.post('/api/get_image', {
            token,
            id,
        });
        return result.data;

    }, [getToken]);

    return {
        executeOAuth,
        getWorkspaceList,
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

