/** Bounded GitHub REST client used only by the Forge BFF. Host is fixed. */
export interface PublicGithubRepo {
  fullName: string;
  htmlUrl: string;
  description: string;
  stars: number;
  pushedAt: string;
  language: string;
}

const USER = /^[A-Za-z0-9-]{1,39}$/;
const MAX_BODY = 400_000;

export function assertGithubUsername(value: string): string {
  const username = value.trim();
  if (!USER.test(username) || username.startsWith("-") || username.endsWith("-")) {
    throw new Error("GitHub username is invalid");
  }
  return username;
}

/** Fetch public repositories for one allowlisted username. */
export async function listPublicGithubRepos(username: string, token?: string): Promise<PublicGithubRepo[]> {
  const user = assertGithubUsername(username);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Kaizen-Productivity-App",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token && token.startsWith("gh") && token.length>=20 && token.length<=255 && /^[A-Za-z0-9_]+$/.test(token)) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=30&sort=updated`, {
      headers,
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) throw new Error(response.status === 404 ? "GitHub user was not found" : "GitHub request failed");
    const text = await response.text();
    if (text.length > MAX_BODY) throw new Error("GitHub response is too large");
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) throw new Error("GitHub response is invalid");
    return parsed.slice(0, 30).map((row) => {
      const item = row as Record<string, unknown>;
      const htmlUrl = typeof item.html_url === "string" ? item.html_url : "";
      if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(htmlUrl)) {
        throw new Error("GitHub returned an unexpected repository URL");
      }
      return {
        fullName: String(item.full_name ?? "").slice(0, 120),
        htmlUrl,
        description: typeof item.description === "string" ? item.description.slice(0, 240) : "",
        stars: Number.isFinite(item.stargazers_count) ? Number(item.stargazers_count) : 0,
        pushedAt: typeof item.pushed_at === "string" ? item.pushed_at.slice(0, 40) : "",
        language: typeof item.language === "string" ? item.language.slice(0, 40) : "",
      };
    });
  } finally {
    clearTimeout(timer);
  }
}
