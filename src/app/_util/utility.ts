import { Edge, NetworkDefine, PropertyKey, RelationDefine, RelationDefineKey } from "../_types/types";

/**
 * 2つのRelationDefineが同一のものかをチェックして返す
 * （from, toが逆なだけのものは、同じRelationDefineとみなす）
 * @param item1 
 * @param item2 
 * @returns 同一の場合、true
 */
export const isSamePair = (item1: RelationDefine, item2: RelationDefine): boolean => {
    if (isSameProperty(item1.from, item2.from) && isSameProperty(item1.to, item2.to)) {
        return true;
    }
    if (isSameProperty(item1.from, item2.to) && isSameProperty(item1.to, item2.from)) {
        return true;
    }
    return false;
}
export const isSameProperty = (info1: PropertyKey, info2: PropertyKey): boolean => {
    if (info1.dbId !== info2.dbId) {
        return false;
    }
    if (info1.propertyId !== info2.propertyId){
        return false;
    }
    return true;
}

export const getRelationKey = (rel: RelationDefineKey): string => {
    return rel.from.dbId.replaceAll('-', '') + '+' + rel.from.propertyId + '+' + rel.to.dbId.replaceAll('-', '') + '+' + rel.to.propertyId;
}

export const getEdgeKey = (edge: Edge): string => {
    return getRelationKey(edge.def) + '+' + edge.from.replaceAll('-', '') + '+' + edge.to.replaceAll('-', '');
}

export const getPropertyName = (propKey: PropertyKey, networkDefine: NetworkDefine): string => {
    const targetDb = networkDefine.dbList.find(db => db.id === propKey.dbId);
    if (!targetDb) {
        return '';
    }
    const targetProp = targetDb.properties.find(prop => prop.id === propKey.propertyId);
    if (!targetProp) {
        return '';
    }
    return targetProp.name;
}
