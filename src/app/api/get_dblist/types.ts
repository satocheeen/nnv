import { DbDefine, Icon, NotionProperty } from "@/app/_types/types";

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
