import { STORAGE_KEY, defaults, load, sanitize, save, clear } from './storage.js';
import { readSSE } from './sse.js';
const $ = id => document.getElementById(id);
const ui = Object.fromEntries(['welcome','chat','messages','typing','message','composer','send','send-icon','stop-icon','language','notice','error-panel','error-text','retry','dismiss-error','char-count','end-session','end-dialog','cancel-end','confirm-end','privacy-dialog','close-privacy','announcer','jump-bottom'].map(id => [id, $(id)]));
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let restored = load(storage), state = restored.state;
let busy = false, controller = null, generation = 0, saveTimer, framePending = false;
let assistant = null, currentNode = null, outputPending = '', timeout;
const nodes = new Map();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function announce(text) { ui.announcer.textContent = text; }
function notify(text) { ui.notice.textContent = text; ui.notice.hidden = !text; }
function persist(immediate = false) {
  clearTimeout(saveTimer);
  const commit = () => { if (!save(storage, state)) notify('Browser storage is unavailable or full. This chat may not survive a refresh.'); };
  if (immediate) commit(); else saveTimer = setTimeout(commit, 200);
}
function showError(text, retry = true) { ui['error-text'].textContent = text; ui['error-panel'].hidden = false; ui.retry.hidden = !retry; }
function hideError() { ui['error-panel'].hidden = true; }
function nearBottom() { return document.documentElement.scrollHeight - innerHeight - scrollY < 180; }
function bottom(force = false) {
  if (force || nearBottom()) requestAnimationFrame(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
}
function updateScreen() {
  const hasMessages = state.messages.length > 0;
  ui.welcome.hidden = hasMessages; ui.chat.hidden = !hasMessages;
  ui['end-session'].setAttribute('aria-label', hasMessages ? 'End session and clear conversation' : 'End session');
}
function updateControls() {
  ui['send-icon'].hidden = busy; ui['stop-icon'].hidden = !busy;
  ui.send.classList.toggle('generating', busy);
  ui.send.setAttribute('aria-label', busy ? 'Stop response' : 'Send message');
  // Keep the stop control operable even while the input is empty.
  ui.send.setAttribute('aria-disabled', String(!busy && !ui.message.value.trim()));
  ui.typing.hidden = !busy || Boolean(assistant?.content);
  ui.language.disabled = busy;
  document.querySelectorAll('[data-mode]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)); b.disabled = busy;
  });
}
function resizeInput() {
  ui.message.style.height = 'auto'; ui.message.style.height = Math.min(ui.message.scrollHeight, 160) + 'px';
  ui['char-count'].textContent = ui.message.value.length > 2500 ? `${ui.message.value.length} / 3000` : 'Your words, your pace.';
  updateControls();
}
function stamp(m) {
  const date = new Date(m.at);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function appendMessage(m) {
  const row = document.createElement('article'); row.className = `message-row ${m.role}`;
  row.dataset.messageId = m.id;
  if (m.role === 'assistant') {
    const avatar = document.createElement('img'); avatar.src = '/logo.svg'; avatar.alt = ''; avatar.className = 'message-avatar'; row.append(avatar);
  }
  const body = document.createElement('div'); body.className = 'message-body';
  const label = document.createElement('div'); label.className = 'message-label'; label.textContent = m.role === 'user' ? 'You' : 'Kwentuhan';
  const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = m.content;
  const meta = document.createElement('div'); meta.className = 'message-meta';
  const time = document.createElement('time'); time.dateTime = new Date(m.at).toISOString(); time.textContent = stamp(m); meta.append(time);
  if (m.role === 'assistant') {
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'copy-message'; copy.textContent = 'Copy'; copy.setAttribute('aria-label', 'Copy Kwentuhan response');
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(m.content); copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1500); }
      catch { notify('Copy is unavailable in this browser. You can select and copy the message text.'); }
    });
    meta.append(copy);
  }
  const status = document.createElement('span'); status.className = 'interrupted-label'; status.textContent = m.status === 'interrupted' ? 'Response interrupted' : ''; meta.append(status);
  body.append(label, bubble, meta); row.append(body); ui.messages.append(row);
  const node = { row, bubble, status }; nodes.set(m.id, node); return node;
}
function renderAll() {
  ui.messages.replaceChildren(); nodes.clear(); state.messages.forEach(appendMessage);
  ui.language.value = state.language; ui.message.value = state.draft;
  updateScreen(); resizeInput();
  if (state.messages.at(-1)?.role === 'user') showError('Your last message is saved, but has no reply yet. You can retry.');
  else if (state.messages.at(-1)?.status === 'interrupted') showError('The last response was interrupted. Retry to replace it, or keep talking.');
}
function flushOutput() {
  framePending = false;
  if (!assistant || !currentNode || !outputPending) return;
  const stick = nearBottom();
  assistant.content += outputPending; outputPending = '';
  currentNode.bubble.textContent = assistant.content;
  ui.typing.hidden = true;
  persist(); if (stick) bottom(true);
}
function addToken(text, token) {
  if (token !== generation || typeof text !== 'string') return;
  if (!assistant) {
    assistant = { id: crypto.randomUUID(), role: 'assistant', content: '', status: 'streaming', at: Date.now() };
    state.messages.push(assistant); currentNode = appendMessage(assistant);
  }
  // Cap reply length on the client as a second bound.
  const remaining = 12000 - assistant.content.length - outputPending.length;
  outputPending += text.slice(0, Math.max(0, remaining));
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(() => { if (token === generation) flushOutput(); });
  }
}
function stopGeneration() {
  if (!busy) return;
  flushOutput();
  generation++; controller?.abort(); clearTimeout(timeout);
  if (assistant?.content) {
    assistant.status = 'interrupted'; if (currentNode) currentNode.status.textContent = 'Response stopped';
  } else showError('Response stopped. Your message is saved; retry whenever you’re ready.');
  busy = false; assistant = null; currentNode = null; outputPending = ''; framePending = false;
  updateControls(); persist(true); announce('Response stopped.');
}
function historyForAPI() {
  // Limit transport to complete recent turns; storage retains up to 100 messages.
  let recent = state.messages.filter(m => m.content.trim()).slice(-25);
  while (recent.length && recent[0].role !== 'user') recent.shift();
  while (recent.length > 1 && recent.reduce((n, m) => n + m.content.length, 0) > 24000) recent.splice(0, 2);
  return recent.map(({ role, content }) => ({ role, content }));
}
async function generate() {
  if (busy || state.messages.at(-1)?.role !== 'user') return;
  hideError(); busy = true; assistant = null; currentNode = null; outputPending = '';
  const token = ++generation; controller = new AbortController();
  const signal = controller.signal;
  let timedOut = false;
  timeout = setTimeout(() => { timedOut = true; controller?.abort(); }, 100000);
  updateControls(); bottom(true); announce('Kwentuhan is thinking.');
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages: historyForAPI(), language: state.language, mode: state.mode }), signal
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || (response.status === 429 ? 'Too many requests. Please wait a moment and retry.' : 'Could not connect. Please try again.'));
    }
    if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('Unexpected server response. Check the Worker configuration.');
    let complete = false;
    for await (const frame of readSSE(response.body)) {
      if (token !== generation) break;
      let payload; try { payload = JSON.parse(frame.data); } catch { throw new Error('An invalid stream was received. Please retry.'); }
      if (frame.event === 'token') addToken(payload.text, token);
      if (frame.event === 'error') throw new Error(payload.message || 'The response was interrupted.');
      if (frame.event === 'done') { complete = true; break; }
    }
    if (token !== generation) return;
    flushOutput();
    if (!complete || !assistant?.content.trim()) throw new Error('The response ended early. Please retry.');
    assistant.status = 'complete'; announce('Kwentuhan replied. ' + assistant.content);
  } catch (error) {
    if (token !== generation) return;
    flushOutput();
    if (assistant?.content) { assistant.status = 'interrupted'; currentNode.status.textContent = 'Response interrupted'; }
    showError(timedOut ? 'The response took too long. Your message is saved; you can retry.' : error.name === 'AbortError' ? 'Response stopped.' : error.message || 'Could not connect. Please retry.');
  } finally {
    if (token === generation) {
      clearTimeout(timeout); busy = false; assistant = null; currentNode = null;
      updateControls(); persist(true);
    }
  }
}
function send(text) {
  if (busy) { stopGeneration(); return; }
  text = text.trim(); if (!text) { ui.message.focus(); return; }
  if (text.length > 3000) { showError('Please keep your message within 3,000 characters.', false); return; }
  const previous = state.messages.at(-1);
  if (previous?.role === 'user') {
    const combined = previous.content + '\n\n' + text;
    if (combined.length > 3000) { showError('Your unanswered message and this addition exceed 3,000 characters. Retry the saved message first.'); return; }
    previous.content = combined; nodes.get(previous.id).bubble.textContent = combined;
  } else {
    const m = { id: crypto.randomUUID(), role: 'user', content: text, at: Date.now(), status: 'complete' };
    state.messages.push(m); appendMessage(m);
  }
  // Trim by complete turns to preserve the alternating request schema.
  while (state.messages.length > 99) { const removed = state.messages.splice(0, 2); removed.forEach(m => { nodes.get(m.id)?.row.remove(); nodes.delete(m.id); }); }
  state.draft = ''; ui.message.value = ''; resizeInput(); updateScreen(); persist(true); void generate();
}
ui.composer.addEventListener('submit', event => { event.preventDefault(); send(ui.message.value); });
// A required empty textarea would otherwise prevent the submit event for Stop.
ui.send.addEventListener('click', event => { if (busy) { event.preventDefault(); stopGeneration(); } });
ui.message.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    // On touch devices keep native newlines; the visible Send button is unambiguous.
    if (matchMedia('(pointer: coarse)').matches) return;
    event.preventDefault(); if (!busy) send(ui.message.value);
  }
});
ui.message.addEventListener('input', () => { state.draft = ui.message.value; resizeInput(); persist(); });
ui.language.addEventListener('change', () => { state.language = ui.language.value; persist(true); });
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  if (busy) return; state.mode = button.dataset.mode; updateControls(); persist(true);
}));
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => { send(button.dataset.prompt); }));
ui.retry.addEventListener('click', () => {
  if (busy) return;
  const last = state.messages.at(-1);
  if (last?.role === 'assistant' && last.status === 'interrupted') {
    nodes.get(last.id)?.row.remove(); nodes.delete(last.id); state.messages.pop();
  }
  if (state.messages.at(-1)?.role === 'user') { persist(true); void generate(); }
  else hideError();
});
ui['dismiss-error'].addEventListener('click', hideError);
ui['end-session'].addEventListener('click', () => ui['end-dialog'].showModal());
ui['cancel-end'].addEventListener('click', () => ui['end-dialog'].close());
ui['confirm-end'].addEventListener('click', () => {
  // Never reset UI while a failed deletion could silently resurrect saved messages.
  if (!clear(storage)) {
    showError('Browser storage could not be cleared. Allow site storage or clear this site’s data in your browser before ending the session.', false);
    ui['end-dialog'].close(); return;
  }
  generation++; controller?.abort(); clearTimeout(timeout); clearTimeout(saveTimer);
  busy = false; assistant = null; currentNode = null; outputPending = ''; framePending = false;
  state = defaults(); hideError(); notify(''); renderAll(); updateControls();
  ui['end-dialog'].close(); window.scrollTo({ top: 0, behavior: 'instant' }); ui.message.focus(); announce('Session ended. Saved conversation cleared.');
});
document.querySelectorAll('.privacy-open').forEach(b => b.addEventListener('click', () => ui['privacy-dialog'].showModal()));
ui['close-privacy'].addEventListener('click', () => ui['privacy-dialog'].close());
// Native dialog Escape cancels; backdrop does not confirm a destructive action.
ui['jump-bottom'].addEventListener('click', () => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reducedMotion ? 'instant' : 'smooth' }); });
window.addEventListener('scroll', () => { ui['jump-bottom'].hidden = !state.messages.length || nearBottom(); }, { passive: true });
window.addEventListener('pagehide', () => { clearTimeout(saveTimer); if (state.messages.length || state.draft) persist(true); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (state.messages.length || state.draft)) { flushOutput(); persist(true); }
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  generation++; controller?.abort(); clearTimeout(timeout); clearTimeout(saveTimer);
  busy = false; assistant = null; currentNode = null; outputPending = ''; framePending = false;
  const loaded = load(storage); state = loaded.state; hideError(); renderAll(); updateControls();
  notify(event.newValue === null ? 'The session was cleared in another tab.' : 'Conversation updated from another tab.');
});
window.addEventListener('offline', () => notify('You’re offline. Your saved conversation is still here; reconnect to get a reply.'));
window.addEventListener('online', () => notify(''));
renderAll(); updateControls();
if (restored.warning) notify(restored.warning);
if (!storage) notify('Browser storage is unavailable. This chat will not be saved across refreshes.');
if (state.messages.length) bottom(true);
// Health check only confirms the Worker and dataset are loaded.
fetch('/api/health', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => {
  if (data && !data.configured) notify('Chat is not available right now. Please try again later.');
}).catch(() => {});
