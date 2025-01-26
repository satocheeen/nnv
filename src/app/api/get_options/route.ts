import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { getOptions } from "./get_options";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();
    const token = body.token ?? NotionKey;
    const params = body.params;

    const data = await getOptions(token, params);

    return NextResponse.json(data);

}