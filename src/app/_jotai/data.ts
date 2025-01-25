import { atom } from "jotai";
import { DataSet, NotionOauth } from "../_types/types";

export const dataSetsAtom = atom<DataSet[]>([]);
export const oAuthInfosAtom = atom<NotionOauth[]>([]);
