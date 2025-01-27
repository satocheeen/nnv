import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { getDbList } from "./get_dblist";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();
    const token = body.token ?? NotionKey;
    if (!token) {
        return NextResponse.json({
            err: 'no token'
        }, { status: 400 })
    }

    const data = await getDbList(token);

    return NextResponse.json(data);

}