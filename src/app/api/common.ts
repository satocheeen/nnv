export const NotionKey = process.env.NOTION_INTERNAL_KEY;
export const OAuth = {
    clientID: process.env.NEXT_PUBLIC_NOTION_API_CLIENT_ID || '',
    secret: process.env.NOTION_SECRET_KEY || ''
}