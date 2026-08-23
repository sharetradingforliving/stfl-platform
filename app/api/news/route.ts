import { NextResponse } from "next/server";

import { runNewsEngine } from "@/lib/news/newsEngine";

export async function GET() {
  try {

    const result = await runNewsEngine();

    return NextResponse.json(result);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to load news.",
      },
      {
        status: 500,
      }
    );

  }
}