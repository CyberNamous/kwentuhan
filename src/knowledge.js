import { config, knowledge, conversations, scenarios, sources } from '../.generated/dataset.mjs';
export const datasetStats = { knowledge: knowledge.length, conversations: conversations.length, scenarios: scenarios.length, version: config.dataset.version };
export { sources, knowledge, conversations, scenarios };
const STOP = new Set('the and that this with from have just like what when about really feel feeling ang mga ng sa na ko ako mo ka ay at to a i is it my me for of do so you your was be been but im its dont naman lang kasi parang hindi din rin ba'.split(' '));
// Keywords (English, Filipino, Taglish) that point to a dataset category. Crisis wording is
// handled separately in responder.js, not here.
export const GROUPS = [
  ['family', 'pamilya', 'magulang', 'mama', 'papa', 'nanay', 'tatay', 'parents', 'parent', 'breadwinner', 'provider', 'utang', 'panganay', 'kuya', 'ate', 'lola', 'lolo', 'tita', 'tito', 'kapatid', 'sibling', 'siblings', 'brother', 'sister', 'mother', 'father', 'mom', 'dad', 'cousin', 'pinsan', 'family'],
  ['friendship', 'friend', 'friends', 'kaibigan', 'barkada', 'tropa', 'bestie', 'bff', 'best', 'friendship', 'pinagtatawanan', 'inviting', 'invite', 'sinama', 'nasama'],
  ['breakup', 'hiwalay', 'hiwalayan', 'naghiwalay', 'hiniwalayan', 'iniwan', 'ex', 'closure', 'heartbroken', 'breakup', 'break-up', 'nag-break', 'broke'],
  ['dating', 'date', 'dates', 'dating', 'ghosting', 'ghosted', 'situationship', 'crush', 'mu', 'landian', 'ligaw', 'nanliligaw', 'manliligaw', 'tinder', 'bumble'],
  ['romance', 'relationship', 'partner', 'boyfriend', 'girlfriend', 'jowa', 'selos', 'selosa', 'seloso', 'nobyo', 'nobya', 'asawa', 'mahal', 'long-distance', 'ldr', 'jealous'],
  ['boundaries', 'boundary', 'boundaries', 'guilt', 'guilty', 'tumanggi', 'tanggi', 'singilin', 'inuutusan', 'favors', 'favor', 'pilit', 'pumayag'],
  ['emotions', 'burnout', 'burned', 'pagod', 'overwhelmed', 'anxiety', 'anxious', 'kabado', 'kinakabahan', 'overthink', 'overthinking', 'lungkot', 'malungkot', 'nalulungkot', 'lonely', 'alone', 'stress', 'stressed', 'sad', 'tired', 'umiiyak', 'iyak', 'namatay', 'died', 'grief', 'grieving', 'pumanaw', 'nagluluksa', 'luksa', 'homesick', 'nag-iisa'],
  ['serious_support', 'suicidal', 'saktan', 'unsafe', 'abuse', 'abused', 'sinaktan', 'hopeless', 'walang-pag-asa'],
  ['trust', 'cheating', 'cheated', 'betrayal', 'lie', 'lied', 'lying', 'tiwala', 'niloko', 'nagsinungaling', 'sinungaling', 'secret', 'tinago', 'trust'],
  ['misunderstanding', 'seen', 'seenzone', 'seen-zone', 'sineen', 'naka-seen', 'nagreply', 'reply', 'replying', 'replied', 'nireplyan', 'misunderstanding', 'misunderstood', 'tampuhan', 'nagtampo', 'tampo'],
  ['personal_growth', 'comparison', 'behind', 'failing', 'failure', 'growth', 'self-worth', 'social', 'nahuhuli', 'compare', 'comparing'],
  ['everyday', 'bored', 'boring', 'chika', 'kwento', 'small', 'talk', 'weekend', 'entertain', 'monday']
];
function tokens(text) { return (text.toLowerCase().match(/[\p{L}\p{N}_-]+/gu) || []).filter(t => t.length > 1 && !STOP.has(t)); }
export { tokens };
const records = [
  ...knowledge.map(data => ({ type: 'knowledge', data })),
  ...scenarios.map(data => ({ type: 'scenario', data })),
  ...conversations.map(data => ({ type: 'example', data }))
].map(r => ({ ...r, terms: new Set(tokens(JSON.stringify(r.data))) }));
export function retrieve(messages, language = 'auto') {
  const recentUsers = messages.filter(m => m.role === 'user').slice(-3);
  const query = tokens(recentUsers.map(m => m.content).join(' '));
  const last = new Set(tokens(recentUsers.at(-1)?.content || ''));
  const catsOf = text => { const set = new Set(tokens(text)); return GROUPS.filter(g => g.some(t => set.has(t))).map(g => g[0]); };
  // The topic carries over: if the latest message names none, use the most recent earlier one.
  let categories = new Set(catsOf(recentUsers.at(-1)?.content || ''));
  if (!categories.size) for (const m of recentUsers.slice(0, -1).reverse()) { const c = catsOf(m.content); if (c.length) { categories = new Set(c); break; } }
  const ranked = records.map(r => {
    let score = 0;
    for (const t of new Set(query)) if (r.terms.has(t)) score += last.has(t) ? 2 : 0.5;
    if (categories.has(r.data.category)) score += 5;
    if (language !== 'auto' && r.data.language === language) score += 0.5;
    return { ...r, score };
  }).filter(r => r.score > 0.5).sort((a, b) => b.score - a.score);
  const result = [];
  for (const [type, limit] of [['knowledge', 3], ['scenario', 2], ['example', 1]]) result.push(...ranked.filter(r => r.type === type).slice(0, limit));
  return result.map(({ type, data, score }) => ({ type, data, score }));
}
