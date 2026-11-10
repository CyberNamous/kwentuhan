import { datasetStats } from './knowledge.js';
import { respond as datasetRespond } from './responder.js';
import { encodeSSE } from '../public/js/sse.js';
const HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'"
};
const json = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...HEADERS, ...extra } });
export class ClientError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export async function readBody(request, limit = 120000) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ClientError('Send application/json.', 415);
  if (Number(request.headers.get('content-length')) > limit) throw new ClientError('Conversation is too large.', 413);
  if (!request.body) throw new ClientError('A message is required.');
  const reader = request.body.getReader();
  let size = 0, chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new ClientError('Conversation is too large.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ClientError('Invalid JSON.'); }
}
export function validate(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 100) throw new ClientError('Send between 1 and 100 messages.');
  const language = body.language ?? 'auto', mode = body.mode ?? 'auto';
  if (!['auto', 'en', 'fil', 'tl-en'].includes(language)) throw new ClientError('Unsupported language.');
  if (!['auto', 'listen', 'advice'].includes(mode)) throw new ClientError('Unsupported conversation mode.');
  let previous = null, total = 0;
  const clean = body.messages.map(message => {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') throw new ClientError('Invalid message.');
    const content = message.content.trim();
    if (!content || content.length > (message.role === 'user' ? 3000 : 12000)) throw new ClientError('A message is empty or too long.');
    if (previous === message.role || (!previous && message.role !== 'user')) throw new ClientError('Messages must alternate, beginning with the user.');
    previous = message.role; total += content.length;
    return { role: message.role, content };
  });
  if (previous !== 'user') throw new ClientError('The last message must be from the user.');
  if (total > 90000) throw new ClientError('Conversation is too large.', 413);
  // Bound the context while retaining complete recent turns. The UI still keeps the session.
  let start = Math.max(0, clean.length - 25);
  if (clean[start].role === 'assistant') start++;
  while (start < clean.length - 1 && clean.slice(start).reduce((n, m) => n + m.content.length, 0) > 24000) start += 2;
  return { messages: clean.slice(start), language, mode };
}
// A reply may be a string, or an (async) iterable of string chunks. Strings are streamed one
// sentence at a time so the browser renders them progressively over the same SSE protocol.
async function* chunksOf(result) {
  const value = await result;
  if (typeof value === 'string') {
    for (const part of value.match(/[^.!?…\n]+[.!?…]*\s*|\n+/gu) || [value]) yield part;
  } else if (value && typeof value[Symbol.asyncIterator] === 'function') yield* value;
  else if (value && typeof value[Symbol.iterator] === 'function') yield* value;
  else throw new Error('Unsupported reply');
}
function makeStream(result, request) {
  let iterator, cancelled = false, abort;
  return new ReadableStream({
    start(controller) {
      const send = (event, data) => { if (!cancelled) controller.enqueue(encodeSSE(event, data)); };
      const close = () => {
        if (cancelled) return;
        cancelled = true;
        request.signal.removeEventListener('abort', abort);
        controller.close();
      };
      abort = () => { close(); void iterator?.return?.().catch(() => {}); };
      request.signal.addEventListener('abort', abort, { once: true });
      if (request.signal.aborted) { close(); return; }
      void (async () => {
        try {
          send('meta', { provider: 'dataset', ...datasetStats });
          let produced = false;
          iterator = chunksOf(result)[Symbol.asyncIterator]();
          while (!cancelled) {
            const { value, done } = await iterator.next();
            if (done) break;
            if (typeof value === 'string' && value) { produced = true; send('token', { text: value }); }
          }
          if (!cancelled) {
            if (!produced) throw new Error('Empty reply');
            send('done', {});
          }
        } catch {
          send('error', { message: 'Kwentuhan could not finish that reply. Please try again.' });
        } finally {
          close();
          try { await iterator?.return?.(); } catch { /* already finished */ }
        }
      })();
    },
    cancel() {
      cancelled = true;
      request.signal.removeEventListener('abort', abort);
      void iterator?.return?.().catch(() => {});
    }
  });
}
// The production worker uses the dataset responder. Tests may inject another responder.
export function createWorker(respond) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
      if (url.pathname === '/api/health') {
        if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET' });
        return json({ ok: true, configured: true, engine: 'dataset', dataset: datasetStats });
      }
      if (url.pathname !== '/api/chat') return json({ error: 'Not found.' }, 404);
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
      const origin = request.headers.get('Origin');
      if ((origin && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'Cross-origin requests are not allowed.' }, 403);
      try {
        const { messages, language, mode } = validate(await readBody(request));
        if (request.signal.aborted) return json({ error: 'Request cancelled.' }, 499);
        const result = await respond(messages, language, mode);
        return new Response(makeStream(result, request), { headers: { ...HEADERS, 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no' } });
      } catch (error) {
        if (error instanceof ClientError) return json({ error: error.message }, error.status);
        // Do not echo internal errors or user messages in responses or logs.
        return json({ error: 'Kwentuhan is temporarily unavailable. Please retry.' }, 503);
      }
    }
  };
}
export default createWorker(datasetRespond);
