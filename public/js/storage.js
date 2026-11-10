export const STORAGE_KEY = 'kwentuhan.session.v1';
export const defaults = () => ({ version: 1, messages: [], language: 'auto', mode: 'auto', draft: '' });
export function sanitize(raw) {
  const state = defaults();
  if (!raw || raw.version !== 1 || !Array.isArray(raw.messages)) return state;
  state.language = ['auto', 'en', 'fil', 'tl-en'].includes(raw.language) ? raw.language : 'auto';
  state.mode = ['auto', 'listen', 'advice'].includes(raw.mode) ? raw.mode : 'auto';
  state.draft = typeof raw.draft === 'string' ? raw.draft.slice(0, 3000) : '';
  let messages = raw.messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim()).map(m => ({
    id: typeof m.id === 'string' ? m.id.slice(0, 80) : crypto.randomUUID(), role: m.role,
    content: m.content.slice(0, m.role === 'user' ? 3000 : 12000),
    at: typeof m.at === 'number' && Number.isFinite(m.at) && Math.abs(m.at) < 8.64e15 ? m.at : Date.now(),
    status: m.status === 'streaming' || m.status === 'interrupted' ? 'interrupted' : 'complete'
  }));
  // Keep a bounded recent session; never start the stored context with an assistant.
  messages = messages.slice(-100);
  while (messages.length && messages[0].role !== 'user') messages.shift();
  const alternating = [];
  for (const m of messages) {
    if (alternating.at(-1)?.role === m.role) continue;
    if (alternating.some(existing => existing.id === m.id)) m.id = crypto.randomUUID();
    alternating.push(m);
  }
  state.messages = alternating;
  return state;
}
export function load(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { state: defaults(), warning: null };
    return { state: sanitize(JSON.parse(raw)), warning: null };
  } catch { return { state: defaults(), warning: 'Saved chat could not be read. This chat can continue without saved history.' }; }
}
export function save(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(sanitize(state))); return true; }
  catch { return false; }
}
export function clear(storage) {
  if (!storage) return true; // No accessible persistent session; reset in-memory chat.
  try { storage.removeItem(STORAGE_KEY); return true; }
  catch { return false; }
}
