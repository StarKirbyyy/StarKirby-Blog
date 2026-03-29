import { getGlobalSakurairoPatch } from "@/lib/sakurairo-global-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getGlobalSakurairoPatch().catch(() => null);
  return Response.json({
    settings: settings ?? null,
  });
}
