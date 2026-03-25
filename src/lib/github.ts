interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

interface UpsertRepoFileInput {
  path: string;
  content: Buffer;
  message: string;
}

function getEnv(name: string) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function getGitHubConfig(): GitHubConfig {
  return {
    token: getEnv("GITHUB_TOKEN"),
    owner: getEnv("GITHUB_OWNER"),
    repo: getEnv("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH?.trim() || "main",
  };
}

function encodeRepoPath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function githubRequest<T>(
  config: GitHubConfig,
  apiPath: string,
  init?: RequestInit,
) {
  const response = await fetch(`https://api.github.com${apiPath}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

async function getFileSha(config: GitHubConfig, repoPath: string) {
  const encodedPath = encodeRepoPath(repoPath);
  const url = `/repos/${config.owner}/${config.repo}/contents/${encodedPath}?ref=${encodeURIComponent(config.branch)}`;

  const response = await fetch(`https://api.github.com${url}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  const json = (await response.json()) as { sha?: string };
  return json.sha ?? null;
}

export async function upsertRepoFile(input: UpsertRepoFileInput) {
  const config = getGitHubConfig();
  const sha = await getFileSha(config, input.path);
  const encodedPath = encodeRepoPath(input.path);

  await githubRequest(config, `/repos/${config.owner}/${config.repo}/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: input.message,
      content: input.content.toString("base64"),
      branch: config.branch,
      sha: sha ?? undefined,
    }),
  });
}
