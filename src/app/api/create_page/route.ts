import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { createPage } from "./create_page";

export const runtime = 'edge';

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
    const params = body.params;

    const data = await createPage(token, params);

    return NextResponse.json(data);

}