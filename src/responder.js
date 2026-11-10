// Dataset-only reply engine: no AI model, no network calls. Replies are assembled from the
// original dataset (follow-up questions, insights, example conversations) plus the short
// connective phrases in phrases.js. It is deterministic: the same chat gives the same reply.
import { retrieve, tokens, knowledge, scenarios, conversations } from './knowledge.js';
import { ACK, CRISIS, DANGER, SOFT, FALLBACK, GENERIC_ACK, INTENTS, LIMIT_NOTE, RESOURCES, VIEW, VIEW_LEADIN } from './phrases.js';

const FIL = new Set(`ako ko mo ka ikaw niya siya sila kami kayo namin natin ninyo nila ang ng mga sa na naman lang kasi pala talaga parang hindi di wala meron yung yun nung noong iyong ito ayaw gusto pwede puwede paano bakit sino saan kailan ano po opo pa ba din rin nga pero kung dahil para kaya muna sana ngayon kahapon bukas lagi minsan sobra sobrang hirap mahirap masakit pagod lungkot malungkot nakakapagod nakakainis galit mahal miss kita akin amin kumusta kamusta musta uy oy sige oo salamat tulong kwento ikwento magkwento kwentuhan chika ay mag pag dito diyan doon`.split(/\s+/));
const EN = new Set(`the and is are was were i i'm im i've i'd i'll my me you your it its it's that this to of in on for with but have has had not dont don't just so be been what when why how can could would should about really feel feeling like they them he she we our he's she's there here do did does am if or because want need know think too very much more only also again`.split(/\s+/));
const words = text => text.toLowerCase().replace(/[’‘]/g, "'").match(/[\p{L}']+/gu) || [];
export function detectLanguage(text) {
  let f = 0, e = 0;
  for (const w of words(text)) { if (FIL.has(w)) f++; if (EN.has(w)) e++; }
  if (!f && !e) return null;
  if (!f) return 'en';
  if (!e) return 'fil';
  if (f >= 3 * e) return 'fil';
  if (e >= 3 * f) return 'en';
  return 'tl-en';
}
function resolveLanguage(messages, language) {
  if (language !== 'auto') return language;
  for (const m of messages.filter(m => m.role === 'user').reverse().slice(0, 3)) {
    const found = detectLanguage(m.content);
    if (found) return found;
  }
  return 'en';
}
const normalize = s => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const CRISIS_RE = /(kill(ing)? myself|end(ing)? (my (own )?life|it all)|take my own life|suicid|want(ed)? to die|wanna die|don'?t want to (live|be alive|exist)|better off (dead|without me)|no reason to live|hurt(ing)? myself|harm(ing)? myself|self[- ]?harm|cut(ting)? myself|magpakamatay|magpapakamatay|gusto (ko )?(na )?(kong |ko nang |nang )?mamatay|mamatay na (lang|ako)|ayoko (na )?(nang )?mabuhay|ayaw ko (na )?(nang )?mabuhay|wakasan( ko)?( na)?( ang)? buhay|tapusin( ko)?( na)?( ang)? buhay|saktan( ko)?( na)? ang sarili|sasaktan ko ang sarili|mas okay pa (kung|na) wala (na )?lang ako|wala na lang ako|wala (na)?ng saysay ang buhay|pagod na (akong|ako) mabuhay)/;
const SOFT_RE = /^(ayoko na|ayaw ko na|suko na (ako|ko)|sumusuko na (ako|ko)|i give up|i can'?t do this anymore|(di|hindi) ko na kaya|(di|hindi) na ako okay|i'?m done with everything)[.!… ]*$/;
const DANGER_RE = /(pinalo ako|binubugbog|binugbog ako|sinasaktan ako|sinaktan ako (ng|ni)|(he|she|they|my (dad|mom|father|mother|partner|boyfriend|girlfriend|husband|wife)) (hits|hit|beats|beat|hurts|abuses) me|being abused|abusing me|(afraid|scared) to go home|natatakot (na )?(akong |ako )?umuwi|(di|hindi) ako safe|not safe at home|i(?: am|'m) not safe)/;
const IDENTITY_RE = /(are you (a |an )?(human|real|person|bot|robot|ai|machine)|is this (a )?(bot|human|real person|ai)|tao ka ba|totoo ka ba|bot ka ba|robot ka ba|ai ka ba|real person ba)/;
const DEPEND_RE = /(you('re| are) (the )?only (one|friend|person)|only you (understand|get|listen)|ikaw (lang|na lang) (ang |yung |nga )?(nakakaintindi|kaibigan|nakikinig|kausap)|ikaw lang talaga|mas gusto ko (na )?lang makipag-chat sa'?yo|(prefer|like) talking to you (more )?than (people|anyone)|wala akong ibang (kaibigan|kausap))/;
const HEAVY_RE = /(may mabigat (akong |sa )|something (feels|is) heavy)/;
const PERSPECTIVE_RE = /(fresh perspective|think it through|figure it out|pag-isipan natin)/;
const CHIKA_RE = /(ka-chika|keep it light|chika lang)/;
const STORY_RE = /(gusto ko lang magkwento|magkwento ako|can i (just )?vent|let me (just )?vent)/;
const THANKS_RE = /^(thanks?( you| po)?|thank you( so much)?|thx|ty|salamat( po)?|maraming salamat( po)?)[.!]*$/;
const BYE_RE = /^(bye|goodbye|good night|goodnight|paalam|sige na( po)?|una na (ako|ko)|g?night)[.!]*$/;
const GREET = new Set('hi hii hiii hello hey yo uy oy kumusta kamusta musta ka na po ba kayo good morning afternoon evening magandang umaga hapon gabi there how are you u ikaw'.split(' '));
const LISTEN_RE = /(makinig (ka )?(lang|muna)|just (listen|vent)|only (want|need) to (vent|be heard)|\bvent(ing)?\b|gusto ko lang (maglabas|marinig)|no advice|don'?t (need|want) (any )?advice|hindi ko kailangan ng advice|wag (ka )?muna mag-?advice)/;
const ADVICE_RE = /(what should i|should i|what do i do|any advice|\badvice\b|paano ko|ano (ang |bang )?gagawin|dapat ba|ano sa tingin mo|what do you think|help me (decide|think|figure))/;

const pick = (list, seed) => list[seed % list.length];
const compatible = (language, other) => other === language || (language !== 'en' && other !== 'en');
const classOrder = language => language === 'en' ? ['en'] : language === 'fil' ? ['fil', 'tl-en'] : ['tl-en', 'fil'];

// Question pools per category, classified by the language each question is actually written in.
const questionPool = new Map();
function addQuestions(category, scenarioId, list) {
  for (const text of list) {
    const cls = detectLanguage(text) ?? 'en';
    const pool = questionPool.get(category) ?? [];
    if (!pool.some(q => q.text === text)) pool.push({ text, cls, scenarioId });
    questionPool.set(category, pool);
  }
}
for (const s of scenarios) addQuestions(s.category, s.id, s.follow_up_questions);
for (const k of knowledge) addQuestions(k.category, k.id, k.good_questions);
// Scenario questions are situation-specific, so they are preferred only when the scenario is a
// strong match. Otherwise broader knowledge questions for the category come first. Questions
// in the user's language always outrank questions in another language.
function pickQuestion(category, preferredId, language, prior) {
  const pool = questionPool.get(category) ?? [];
  const order = [...classOrder(language), 'en', 'fil', 'tl-en'];
  const candidates = pool
    .filter(q => !prior.some(p => p.includes(q.text)))
    .map((q, index) => ({ q, rank: order.indexOf(q.cls) * 1000 + (q.scenarioId === preferredId ? 0 : 200) + (q.scenarioId.startsWith('K_') ? 0 : 100) + index / 1000 }))
    .sort((a, b) => a.rank - b.rank);
  return candidates[0]?.q.text ?? null;
}
function pickInsight(category, matchedId, prior, seed) {
  if (category === 'everyday' || category === 'serious_support') return null;
  const entries = knowledge.filter(k => k.category === category).sort((a, b) => (b.id === matchedId) - (a.id === matchedId));
  const insights = entries.flatMap(k => k.insights).filter(t => !/\buser\b|^(ask|do not|avoid|keep|stay|offer)\b/i.test(t) && !prior.some(p => p.includes(t)));
  return insights.length ? `${pick(VIEW_LEADIN.en, seed)} ${insights[0]}` : null;
}
const examples = conversations.flatMap(c => c.messages.map((m, i) => ({ c, m, i })).filter(({ m, i }) => m.role === 'user' && c.messages[i + 1]?.role === 'assistant')
  .map(({ c, m, i }) => ({ language: c.language, terms: new Set(tokens(m.content)), reply: c.messages[i + 1].content })));
function matchExample(text, language, prior) {
  const a = new Set(tokens(text));
  if (a.size < 3) return null;
  let best = null;
  for (const e of examples) {
    if (!compatible(language, e.language) || prior.includes(e.reply)) continue;
    let inter = 0; for (const t of a) if (e.terms.has(t)) inter++;
    const dice = 2 * inter / (a.size + e.terms.size);
    if (inter >= 3 && dice >= 0.6 && (!best || dice > best.dice)) best = { dice, reply: e.reply };
  }
  return best?.reply ?? null;
}
function intentReply(kind, language, seed) { return pick(INTENTS[kind][language], seed); }
function effectiveMode(mode, text, userTurns) {
  if (LISTEN_RE.test(text)) return 'listen';
  if (mode === 'listen' || mode === 'advice') return mode;
  if (ADVICE_RE.test(text)) return 'advice';
  return userTurns >= 3 ? 'advice' : 'listen';
}

export function respond(messages, language = 'auto', mode = 'auto') {
  const lastUser = messages.filter(m => m.role === 'user').at(-1)?.content ?? '';
  const text = normalize(lastUser);
  const L = resolveLanguage(messages, language);
  const userTurns = messages.filter(m => m.role === 'user').length;
  const prior = messages.filter(m => m.role === 'assistant').map(m => m.content);
  const seed = userTurns;
  const wordCount = words(lastUser).length;
  // Safety and honesty come first, independent of retrieval quality.
  if (CRISIS_RE.test(text)) return CRISIS[L];
  if (SOFT_RE.test(text.replace(/[,]/g, ''))) return SOFT[L];
  if (DANGER_RE.test(text)) return DANGER[L];
  if (IDENTITY_RE.test(text)) return intentReply('identity', L, seed);
  if (DEPEND_RE.test(text)) return intentReply('dependency', L, seed);
  if (wordCount <= 14) {
    if (HEAVY_RE.test(text)) return intentReply('heavy', L, seed);
    if (PERSPECTIVE_RE.test(text)) return intentReply('perspective', L, seed);
    if (CHIKA_RE.test(text)) return intentReply('chika', L, seed);
    if (STORY_RE.test(text)) return intentReply('story', L, seed);
  }
  const bare = text.replace(/[^\p{L}\p{N}'\s-]/gu, '').trim();
  if (wordCount <= 3 && bare.split(' ').every(w => GREET.has(w))) return intentReply('greeting', L, seed + prior.length);
  if (THANKS_RE.test(bare)) return intentReply('thanks', L, seed);
  if (BYE_RE.test(bare)) return intentReply('bye', L, seed);
  const example = matchExample(lastUser, L, prior);
  if (example) return example;
  const hits = retrieve(messages, L);
  const scenario = hits.find(h => h.type === 'scenario' && h.score >= 5);
  const entry = hits.find(h => h.type === 'knowledge' && h.score >= 5);
  const category = scenario?.data.category ?? entry?.data.category ?? null;
  if (!category) {
    const repeated = prior.length > 0 && Object.values(FALLBACK[L]).some(f => prior.at(-1).startsWith(f));
    const base = pick(FALLBACK[L], seed);
    return repeated ? `${base}\n\n${LIMIT_NOTE[L]}` : base;
  }
  const chosenMode = effectiveMode(mode, text, userTurns);
  const acks = [ACK[L][category], ...GENERIC_ACK[L]].filter(a => !prior.some(p => p.includes(a)));
  const ack = acks.length ? (userTurns <= 1 ? acks[0] : pick(acks, seed)) : '';
  let view = null;
  if (chosenMode === 'advice') {
    if (L === 'en') view = pickInsight(category, entry?.data.id, prior, seed);
    else { const v = VIEW[L][category]; if (v && !prior.some(p => p.includes(v))) view = v; }
  }
  const resources = category === 'serious_support' ? RESOURCES[L] : null;
  const strong = scenario && scenario.score >= 9 && scenario.data.category === category;
  const question = pickQuestion(category, strong ? scenario.data.id : entry?.data.id, L, prior);
  const lead = [ack, view, resources].filter(Boolean).join(' ');
  return [lead, question].filter(Boolean).join('\n\n');
}
