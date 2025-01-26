import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { createRelation } from "./create_relation";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();
    const token = body.token ?? NotionKey;
    const params = body.params;

    const data = await createRelation(token, params);

    return NextResponse.json(data);

}