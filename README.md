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
