import { atom } from "jotai";
import { DataSet, NotionOauth } from "../_types/types";

export const dataSetsAtom = atom<DataSet[]>([]);
export const oAuthInfosAtom = atom<NotionOauth[]>([]);

export function setPosition(param: {
    datasetId: string;
    dbId: string;
    id: string;
    position: {
        x: number;
        y: number;
    }
}) {
    const currentDataset = state.dataSets.find(ds => ds.id === payload.datasetId);
    if (!currentDataset) {
        return state;
    }
    const index = currentDataset.dataMap[payload.dbId]?.items.findIndex(item => item.id === payload.id);
    if (index === -1) {
        return state;
    }
    const newPositionMap = Object.assign({}, currentDataset.positionMap);
    if (newPositionMap[payload.dbId] === undefined) {
        newPositionMap[payload.dbId] = {};
    }
    newPositionMap[payload.dbId][payload.id] = payload.position;

    return createStateReplacedDataMap(state, {
        datasetId: payload.datasetId,
        positionMap: newPositionMap,
    });

}