// Incremental UTF-8 + SSE parser shared by the browser and Worker.
// Handles split codepoints, CRLF, multi-line data, comments and trailing frames.
export async function* readSSE(stream, { signal } = {}) {
  const reader = stream.getReader();
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const decoder = new TextDecoder();
  let buffer = '', data = [], event = 'message';
  function line(value) {
    if (value === '') {
      const frame = data.length ? { event, data: data.join('\n') } : null;
      data = []; event = 'message'; return frame;
    }
    if (value.startsWith(':')) return null;
    const i = value.indexOf(':');
    const field = i < 0 ? value : value.slice(0, i);
    const payload = i < 0 ? '' : value.slice(i + 1).replace(/^ /, '');
    if (field === 'data') data.push(payload);
    if (field === 'event') event = payload;
    return null;
  }
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      // Hold a final CR until we know whether the next chunk begins with LF.
      let match;
      while ((match = /\r\n|\r|\n/.exec(buffer))) {
        if (!done && match[0] === '\r' && match.index === buffer.length - 1) break;
        const frame = line(buffer.slice(0, match.index));
        buffer = buffer.slice(match.index + match[0].length);
        if (frame) yield frame;
      }
      if (done) {
        if (buffer) { const frame = line(buffer); if (frame) yield frame; }
        const frame = line(''); if (frame) yield frame;
        return;
      }
    }
  } finally {
    try { await reader.cancel(); } catch { /* already closed */ }
    signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}
export const encodeSSE = (event, data) => new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
