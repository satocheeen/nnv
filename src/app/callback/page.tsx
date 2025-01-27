import axios from "axios";
import { NotionOauth } from "../_types/types";
import { NotionOAuthRedirectUri, OAuth } from "../api/common";
import Redirector from "./Redirector";

/**
 * Notionからのアクセストークンのリダイレクトページ
 */
export default async function CallbackPage({
    searchParams,
} : {
    searchParams: { 
        code?: string;
        state?: string;
     };
}) {
    const { code, state } = await searchParams;
    console.log('code', code)
    console.log('state', state)

    if (code === undefined) {
        return (
            <div>Error</div>
        )
    }

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
        console.log('token', oAuthInfo)
    
    } catch(e) {
        console.warn('failed get token', e)
    }

    return <Redirector oAuthInfo={oAuthInfo} />
}
