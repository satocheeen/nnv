import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { removeRelation } from "./remove_relation";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();
    const token = body.token ?? NotionKey;
    const params = body.params;

    await removeRelation(token, params);

    return NextResponse.json({
        result: 'ok'
    });

}