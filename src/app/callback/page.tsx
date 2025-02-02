import axios from "axios";
import { NotionOauth } from "../_types/types";
import { OAuth } from "../api/common";
import Redirector from "./Redirector";
import { OAuthRedirectState } from "../_util/useApi";
import { headers } from "next/headers";

/**
 * Notionからのアクセストークンのリダイレクトページ
 */
export default async function CallbackPage({
    searchParams,
} : {
    searchParams: Promise<{ 
        code?: string;
        state?: string;
     }>;
}) {
    const { code, state } = await searchParams;

    if (code === undefined) {
        return (
            <div>Error</div>
        )
    }

    const h = await headers();
    const protocol = h.get('x-forwarded-proto');
    const host = h.get('x-forwarded-host') || h.get('host');
    const NotionOAuthRedirectUri = process.env.NEXT_PUBLIC_NOTION_OAUTH_REDIRECT_URL || `${protocol}://${host}/callback/`;

    // トークン取得
    let oAuthInfo: NotionOauth | undefined;
    try {
        const encoded = Buffer.from(`${OAuth.clientID}:${OAuth.secret}`).toString("base64");
        const result = await axios.post('https://api.notion.com/v1/oauth/token', {
            grant_type: 'authorization_code',
            code,
            redirect_uri: NotionOAuthRedirectUri,
        }, {
            headers: {
                Authorization: `Basic ${encoded}`,
            }
        });
        oAuthInfo = result.data as NotionOauth;
    
    } catch(e) {
        console.warn('failed get token', e)
    }

    const stateValue = state ? JSON.parse(state) : undefined;

    return <Redirector oAuthInfo={oAuthInfo} state={stateValue as OAuthRedirectState} />
}
