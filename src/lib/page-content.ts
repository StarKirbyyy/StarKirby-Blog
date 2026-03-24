import { promises as fs } from "node:fs";
import path from "node:path";

const PAGES_DIRECTORY = path.join(process.cwd(), "content", "pages");
const SUPPORTED_EXTENSIONS = [".mdx", ".md"];

export async function getPageContentBySlug(slug: string) {
  for (const extension of SUPPORTED_EXTENSIONS) {
    const filePath = path.join(PAGES_DIRECTORY, `${slug}${extension}`);
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }
  }

  return null;
}
