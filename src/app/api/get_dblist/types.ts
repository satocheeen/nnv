import { DbDefine, Icon } from "@/app/_types/types";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type DbInfo = {
    id: string;
    icon: Icon | null;
    title: string;
    properties: {[name: string]: NotionProperty};
}
export type WorkspaceInfo = {
    workspaceId: string;
    workspaceName: string;
    dbDefines: DbDefine[];
}

export type NotionProperty = Extract<DatabaseObjectResponse['properties'][0],
    { type: 'relation'}
    | { type: 'multi_select' }
    | { type: 'select' }
    | { type: 'title' }
    | { type: 'url' }
>