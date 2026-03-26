This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Online Publishing (Optional)

This project supports publishing posts from a web page at `/admin/publish`.
It uploads your markdown file and optional cover image to the GitHub repo.

Required environment variables:

```bash
PUBLISH_API_KEY=your-strong-random-key
GITHUB_TOKEN=github_pat_xxx
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=starkirby-blog
GITHUB_BRANCH=main
```

Notes:

- `GITHUB_TOKEN` needs `contents:write` permission for the target repo.
- Markdown files are committed to `content/posts/`.
- Cover images are committed to `public/images/covers/`.
- Frontmatter auto-fill for incomplete files: `title` uses form value or Markdown H1 (`# ...`).
- Frontmatter auto-fill for incomplete files: `description` uses form value or first paragraph excerpt.
- Frontmatter auto-fill for incomplete files: `date` uses form value or current system date (`YYYY-MM-DD`).
- Frontmatter auto-fill for incomplete files: `tags` uses form value (comma-separated) when missing in file.

## Optional Features (Stage 8)

- Comments use Giscus on post detail pages.
- Math formulas are supported in MDX via KaTeX (`$...$` and `$$...$$`).
- Images in MDX support click-to-zoom lightbox preview.
- Local comments API is available (database-backed):
  - `GET/POST /api/comments`
  - `PATCH/DELETE /api/comments/:id` (owner/admin)
  - `GET /api/admin/comments` (admin list)
  - `PATCH/DELETE /api/admin/comments/:id` (admin moderation)
- Admin moderation UI is available at `/admin/comments`.

If you want to enable Giscus comments, configure:

```bash
NEXT_PUBLIC_GISCUS_REPO=owner/repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxx
```

Switch comment provider:

```bash
NEXT_PUBLIC_COMMENT_PROVIDER=giscus # or local
```

Optional local-comment rate limit:

```bash
COMMENT_POST_LIMIT_PER_MINUTE=5
```

## User System M1 (Auth + Prisma)

Required env vars for GitHub OAuth login:

```bash
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-random-secret
GITHUB_ID=your-github-oauth-app-client-id
GITHUB_SECRET=your-github-oauth-app-client-secret
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Compatibility aliases (also supported):

```bash
AUTH_SECRET=your-random-secret
AUTH_GITHUB_ID=your-github-oauth-app-client-id
AUTH_GITHUB_SECRET=your-github-oauth-app-client-secret
AUTH_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Prisma migration on Neon needs both:

```bash
DATABASE_URL=... # pooler url
DATABASE_URL_UNPOOLED=... # direct url for migrate
```

Prisma CLI reads `.env` by default. If you only keep variables in `.env.local`, export them when running migrate/generate.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
