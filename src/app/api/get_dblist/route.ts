import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { getDbList } from "./get_dblist";

export async function POST(
    request: NextRequest,
) {
    const param = await request.json();
    const token = param.token ?? NotionKey;

    const data = await getDbList(token);

    return NextResponse.json(data);

}