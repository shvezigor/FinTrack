import { NextRequest } from "next/server";

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: "GET" | "POST" | "PATCH" | "DELETE",
) {
  const { path } = await params;
  const url = `${apiBaseUrl}/api/${path.join("/")}${request.nextUrl.search}`;
  const bodyBuffer = method === "GET" ? undefined : await request.arrayBuffer();
  const hasBody = Boolean(bodyBuffer?.byteLength);
  const contentType = request.headers.get("Content-Type");
  const response = await fetch(url, {
    body: hasBody ? bodyBuffer : undefined,
    headers: {
      Authorization: request.headers.get("Authorization") ?? "",
      Cookie: request.headers.get("cookie") ?? "",
      ...(contentType && hasBody ? { "Content-Type": contentType } : {}),
      "x-dashboard-password": request.headers.get("x-dashboard-password") ?? "",
    },
    cache: "no-store",
    method,
  });

  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      ...(response.headers.get("Content-Disposition")
        ? { "Content-Disposition": response.headers.get("Content-Disposition")! }
        : {}),
      ...(response.headers.get("set-cookie") ? { "Set-Cookie": response.headers.get("set-cookie")! } : {}),
    },
    status: response.status,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params, "GET");
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params, "POST");
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params, "PATCH");
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params, "DELETE");
}
