import { Colors } from "../_define/const";
import { NotionProperty } from "../api/get_dblist/types";

export type NotionOauth = {
    access_token: string;
    bot_it: string;
    owner: {
        type: string;
        user: {
            id: string;
            object: string;
        },
    },
    token_type: string;
    workspace_icon: null | string;
    workspace_id: string;
    workspace_name:string;
}

export type DbData = {
    id: string;
    items: NodeItem[];
    lastEditedTime?: string;
}
export type NodeItem = {
    id: string;
    name: string;
    filterPropertyValue: {[propertyId: string]: string[]};
    urlPropertyValue: {[propertyId: string]: string};
    imageGotFlag: boolean; // falseの場合、イメージ未取得
    image?: string;
    imageBase64?: string;
    url: string;
    lastEditedTime: string;
}
export type Edge = {
    def: RelationDefineKey;
    from: string;
    to: string;
}
export type PositionData = {[id: string]: {x: number, y: number}};

export type DataSet = {
    id: string;
    name: string;
    networkDefine: NetworkDefine;
    dataMap: {[id: string]: DbData}; // key=DBのID
    positionMap: {[id: string]: PositionData}; // key=DBのID
    edges: Edge[];
}

export type OptionItem = {
    id: string;
    name: string;
    color: keyof (typeof Colors);
}

// ネットワーク定義
export type NetworkDefine = {
    workspaceId: string;
    dbList: DbDefine[];
    relationList: RelationDefine[];
}

export type DbDefine = {
    id: string; // DBのID
    name: string; // DB名
    icon: Icon | null;
    nodeStyle?: string;  // ノードスタイル
    properties: NotionProperty[]; //Property[];
}
export type DbDefineWithRelation = DbDefine & {
    relationColIds: string[]; // from-DBの場合、リレーション項目IDを設定する
};

export type Property = {
    id: string;
    name: string;
    type: 'select' | 'multi_select' | 'relation' | 'title' | 'url';
    isUse: boolean; // フィルタに使用する属性の場合、true
    options?: OptionItem[];
    relation?: PropertyKey;
}

export type RelationDefineKey = {
    from: PropertyKey;
    to: PropertyKey;
}
export type RelationDefine = RelationDefineKey & {
    arrowStyle?: {
        from: string,
        to: string,
    };
}

// プロパティ項目を一意に定めるための情報
export type PropertyKey = {
    dbId: string;
    propertyId: string;
}

export type Relation = {
    relColId: string;
    ids: string[];
}

export type Icon = {
    type: 'emoji' | 'file';
    emoji?: string;
    file?: {
        url?: string;
    }
}

export type DialogParam = {
    mode?: DialogMode;
    title?: string;
    message?: string;
}
export enum DialogResult {
    OK,
    Cancel,
    Yes,
    No,
}

export enum DialogMode {
    OkOnly,
    OkCancel,
    YesNo,
}

export enum TempGuideKind {
    CreateRelation = 'CreateRelation',
}

export type TempGuide = {
    kind: TempGuideKind;
    onCancel?: () => void;
}
