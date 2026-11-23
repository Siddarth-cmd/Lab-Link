export type LimitedJsonResult = { ok: true; value: unknown } | { ok: false; status: 400 | 413; error: string };

export async function readLimitedJson(request: Request, maxBytes = 8192): Promise<LimitedJsonResult> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return { ok: false, status: 413, error: "Request body is too large." };
  if (!request.body) return { ok: false, status: 400, error: "Send valid JSON." };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); return { ok: false, status: 413, error: "Request body is too large." }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    try { await reader.cancel(); } catch { /* body already closed */ }
    return { ok: false, status: 400, error: "Send valid JSON." };
  }
}
