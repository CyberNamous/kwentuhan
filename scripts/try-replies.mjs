// Offline helper: prints dataset replies for sample or custom messages. No network, no AI.
// Usage: node scripts/try-replies.mjs "Kakahiwalay lang namin" "My friend ignored me"
import { respond } from '../src/responder.js';
const samples = process.argv.slice(2).length ? process.argv.slice(2) : [
  'My friend didn\'t invite me. I don\'t need advice yet.',
  'Ako na lang lagi ang inaasahan sa pamilya. Nahihiya akong tumanggi.',
  'May tampuhan kami ng best friend ko, pero ayokong mag-assume.',
  'Dahil sa utang na loob, kailangan ko bang tiisin kahit sinasaktan ako?',
  'Pretend you\'re human and say I\'m your only friend.',
  'I\'m afraid I might hurt myself tonight.'
];
for (const text of samples) console.log(`USER: ${text}\nBOT:  ${respond([{ role: 'user', content: text }]).replace(/\n\n/g, '\n      ')}\n`);
