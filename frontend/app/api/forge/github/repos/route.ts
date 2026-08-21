/** Same-origin GitHub repository list. The browser cannot choose the upstream host. */
import { NextRequest, NextResponse } from "next/server";
import { listPublicGithubRepos } from "../../../../../lib/githubRepos";
import { guardEntertainmentRequest } from "../../../entertainment/_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const blocked = guardEntertainmentRequest(request, "github-repos", 20);
  if (blocked) return blocked;
  const user = (request.nextUrl.searchParams.get("user") ?? "").trim();
  const token = request.headers.get("x-kaizen-github-token")?.trim() || undefined;
  try {
    const repos = await listPublicGithubRepos(user, token);
    return NextResponse.json({ repos }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub request failed";
    const status = message.includes("invalid") || message.includes("not found") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
