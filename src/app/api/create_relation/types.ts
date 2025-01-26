import { Edge } from "@/app/_types/types";

export type CreateRelationParam = Edge;
export type CreateRelationResult = {
    result: 'ok' | 'error';
    id: string;
}
