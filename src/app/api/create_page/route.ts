import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { createPage } from "./create_page";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();
    const token = body.token ?? NotionKey;
    const params = body.params;

    const data = await createPage(token, params);

    return NextResponse.json(data);

}