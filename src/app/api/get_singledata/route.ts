import { NextRequest, NextResponse } from "next/server";
import { NotionKey } from "../common";
import { getSingleData } from "./get_singledata";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();
    const token = body.token ?? NotionKey;
    const params = body.params;

    const data = await getSingleData(token, params);

    return NextResponse.json(data);

}