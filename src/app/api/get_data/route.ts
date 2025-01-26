import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { getData } from "./get_data";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();
    const token = body.token ?? NotionKey;
    const params = body.params;

    const data = await getData(token, params);

    return NextResponse.json(data);

}