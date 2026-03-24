import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 将当前请求路径注入到 request header 中（x-pathname）
 * Header 服务端组件通过 next/headers 读取该值，用于活跃链接高亮
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // 排除静态文件、_next 内部路由、API 路由
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
