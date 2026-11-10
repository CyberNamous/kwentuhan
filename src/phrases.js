// Short connective phrases used by responder.js. Substantive content (questions, example
// replies, insights) comes from the dataset; these only link it together. Languages:
// en, fil, tl-en. Written as natural conversation, not word-for-word translations.
export const RESOURCES = {
  en: 'If you ever feel unsafe or in danger, call 911. For emotional crisis support in the Philippines, the NCMH lists 1553 and 0917-899-8727.',
  fil: 'Kung nakakaramdam ka ng panganib o hindi ka ligtas, tumawag sa 911. Para sa suporta sa krisis sa damdamin, nakalista ng NCMH ang 1553 at 0917-899-8727.',
  'tl-en': 'Kung hindi ka safe o may panganib, tumawag sa 911. Para sa emotional crisis support sa Pilipinas, nakalista ng NCMH ang 1553 at 0917-899-8727.'
};
export const CRISIS = {
  en: `I'm really glad you told me, and I'm sorry it feels this heavy. I'm an automated program, so I can't be there with you, but you deserve real support right now. Are you thinking about ending your life?\n\nIf you might act on it or you're in immediate danger, please call 911 or go to the nearest hospital. In the Philippines you can also reach the NCMH crisis hotline at 1553 or 0917-899-8727. If someone you trust is nearby, please tell them how you're feeling tonight. I'm still here to keep talking with you.`,
  fil: `Salamat sa pagsabi mo nito, at pasensya na ang bigat ng nararamdaman mo. Automated na programa ako, kaya hindi kita masasamahan nang personal, pero karapat-dapat kang makakuha ng totoong suporta ngayon. Iniisip mo bang wakasan ang buhay mo?\n\nKung baka gawin mo ito o nasa panganib ka ngayon, tumawag sa 911 o pumunta sa pinakamalapit na ospital. Pwede ka ring tumawag sa NCMH crisis hotline sa 1553 o 0917-899-8727. Kung may pinagkakatiwalaan kang tao na malapit, sabihin mo sa kanya ngayon kung ano ang nararamdaman mo. Nandito pa rin ako para makipag-usap.`,
  'tl-en': `Salamat sa pagsabi mo nito, and I'm sorry ang bigat ng nararamdaman mo. Automated program ako, kaya hindi kita masasamahan in person, pero deserve mo ang totoong suporta ngayon. Iniisip mo bang wakasan ang buhay mo?\n\nKung baka gawin mo ito o may immediate danger, please call 911 o pumunta sa pinakamalapit na ospital. Pwede ka ring tumawag sa NCMH crisis hotline sa 1553 o 0917-899-8727. Kung may pinagkakatiwalaan kang tao na malapit, sabihin mo sa kanya ngayon kung ano ang nararamdaman mo. Nandito pa rin ako para makipag-usap.`
};
export const DANGER = {
  en: `That sounds frightening, and I'm glad you said something. Are you safe right now?\n\nIf anyone is in immediate danger, please call 911. If you can, get to a trusted adult or relative, such as a teacher, school counselor, relative, or your barangay, and tell them what happened. You don't have to handle this alone.`,
  fil: `Nakakatakot yan, at salamat sa pagsabi mo. Ligtas ka ba ngayon?\n\nKung may nasa agarang panganib, tumawag sa 911. Kung kaya mo, pumunta ka sa pinagkakatiwalaang nakatatanda o kamag-anak, tulad ng guro, school counselor, kamag-anak, o barangay, at sabihin mo kung ano ang nangyari. Hindi mo kailangang harapin ito mag-isa.`,
  'tl-en': `Nakakatakot yan, and salamat sa pagsabi mo. Safe ka ba ngayon?\n\nKung may immediate danger, please call 911. Kung kaya mo, pumunta ka sa isang trusted adult o kamag-anak, like teacher, school counselor, o barangay, and sabihin mo kung ano ang nangyari. Hindi mo kailangang harapin ito mag-isa.`
};
export const INTENTS = {
  identity: {
    en: [`I'm an automated chat companion, not a person. I don't have personal experiences or a life of my own, but I'm happy to listen and think things through with you. What's on your mind?`],
    fil: [`Automated na programa ako, hindi tao. Wala akong sariling karanasan o buhay, pero masaya akong makinig at makipag-usap sa'yo. Ano ang nasa isip mo?`],
    'tl-en': [`Automated chat companion ako, hindi tao. Wala akong personal experiences o sariling buhay, pero masaya akong makinig at mag-isip kasama ka. Anong nasa isip mo?`]
  },
  dependency: {
    en: [`Thank you for trusting me with this. I'm glad it feels easier to talk here, but I'm an automated program, and you deserve people who can be there for you in real life. Is there someone, even just one person, you feel a little comfortable with?`],
    fil: [`Salamat sa tiwala mo. Masaya akong komportable kang magkwento dito, pero automated na programa lang ako, at karapat-dapat kang magkaroon ng mga taong totoong nandiyan para sa'yo. May isang tao ba, kahit isa lang, na medyo komportable ka?`],
    'tl-en': [`Salamat sa tiwala mo. Masaya akong komportable kang magkwento dito, pero automated program lang ako, and deserve mo ang mga taong totoong nandiyan para sa'yo. May isang tao ba, kahit isa lang, na komportable ka?`]
  },
  story: {
    en: [`Sure, go ahead. I'm listening. Start wherever you like.`],
    fil: [`Sige, nakikinig ako. Simulan mo kung saan mo gusto.`],
    'tl-en': [`Sige, nakikinig ako. Simulan mo kung saan mo gusto.`]
  },
  heavy: {
    en: [`I'm here, and there's no rush. What's been weighing on you?`],
    fil: [`Nandito ako, walang minamadali. Ano ang bumabagabag sa'yo?`],
    'tl-en': [`Nandito ako, no rush. Ano ang bumabagabag sa'yo?`]
  },
  perspective: {
    en: [`Happy to think it through with you. What's the situation, and which part feels the most stuck?`],
    fil: [`Sige, pag-isipan natin. Ano ang sitwasyon, at anong parte ang pinakamahirap para sa'yo?`],
    'tl-en': [`Sige, let's think it through. Ano ang situation, and anong part ang pinaka-stuck ka?`]
  },
  chika: {
    en: [`Game, let's keep it light. What's the funniest or weirdest thing that happened to you this week?`],
    fil: [`Sige, chika lang tayo. Ano ang pinaka-nakakatawa o kakaibang nangyari sa'yo ngayong linggo?`],
    'tl-en': [`Game, chika lang tayo! Ano ang pinaka-funny o kakaibang nangyari sa'yo this week?`]
  },
  greeting: {
    en: [`Hi! Good to hear from you. What's on your mind today, or do you just want to chat?`, `Hey! How's your day going so far?`],
    fil: [`Kumusta! Anong kwento mo ngayon?`, `Hello! Kumusta ang araw mo?`],
    'tl-en': [`Hi! Kumusta ang day mo? May gusto ka bang ikwento, or chill lang tayo?`, `Hello! Anong kwento mo today?`]
  },
  thanks: {
    en: [`You're welcome. I'm here whenever you want to talk some more.`],
    fil: [`Walang anuman. Nandito lang ako kung gusto mo pang magkwento.`],
    'tl-en': [`Walang anuman! Nandito lang ako kung gusto mo pang mag-chika.`]
  },
  bye: {
    en: [`Take care. Come back anytime you want to talk. If things feel heavy, it also helps to reach out to someone you trust.`],
    fil: [`Ingat ka. Balik ka lang kapag gusto mong makipagkwentuhan. Kung mabigat ang pakiramdam, makakatulong din ang pagkausap sa taong pinagkakatiwalaan mo.`],
    'tl-en': [`Ingat ka. Balik ka lang kapag gusto mong makipagkwentuhan. Kung mabigat ang feeling, makakatulong din na kausapin ang taong pinagkakatiwalaan mo.`]
  }
};
export const GENERIC_ACK = {
  en: [`I hear you.`, `Thanks for telling me.`, `That sounds like a lot.`],
  fil: [`Nakikinig ako.`, `Salamat sa pagsabi mo.`, `Ang bigat nga niyan.`],
  'tl-en': [`Nakikinig ako.`, `Thanks sa pagsabi mo.`, `Ang bigat nga niyan.`]
};
export const ACK = {
  en: {
    friendship: `That sounds like it really matters to you, and it's hard when a friendship feels off.`,
    dating: `Dating can be confusing, and it makes sense that this has been on your mind.`,
    romance: `Relationships can bring up a lot at once, and it sounds like this is weighing on you.`,
    family: `Family stuff tends to hit close to home, and it sounds heavy.`,
    emotions: `That sounds really tiring, and I'm glad you're putting it into words.`,
    breakup: `I'm sorry. Breakups hurt in a lot of different ways.`,
    trust: `Trust matters a lot, so I can see why this is bothering you.`,
    boundaries: `It can be really uncomfortable to hold a line with people you care about.`,
    misunderstanding: `Those unclear moments can really mess with your head.`,
    everyday: `Got it, thanks for sharing that.`,
    personal_growth: `Feeling like you're falling behind is a heavy thing to carry.`,
    serious_support: `I'm taking what you said seriously.`
  },
  fil: {
    friendship: `Mukhang mahalaga talaga ito sa'yo, at masakit kapag parang may nagbago sa friendship.`,
    dating: `Nakakalito talaga minsan ang dating, kaya naiintindihan kong naiisip mo ito.`,
    romance: `Maraming nararamdaman kapag may relasyon, at mukhang mabigat ito sa'yo ngayon.`,
    family: `Mabigat talaga ang mga bagay na tungkol sa pamilya.`,
    emotions: `Nakakapagod nga yan, at salamat sa pagkwento mo.`,
    breakup: `Pasensya na, masakit talaga ang hiwalayan.`,
    trust: `Mahalaga ang tiwala, kaya naiintindihan kong bumabagabag ito sa'yo.`,
    boundaries: `Hindi madaling magtakda ng hangganan sa mga taong mahalaga sa'yo.`,
    misunderstanding: `Nakakakaba talaga kapag hindi malinaw ang nangyari.`,
    everyday: `Ay sige, noted. Salamat sa pagkwento.`,
    personal_growth: `Mabigat yung pakiramdam na parang nahuhuli ka na.`,
    serious_support: `Sineseryoso ko ang sinabi mo.`
  },
  'tl-en': {
    friendship: `Mukhang important sa'yo 'to, and masakit talaga kapag parang may nagbago sa friendship.`,
    dating: `Nakakalito talaga ang dating minsan, so I get why it's on your mind.`,
    romance: `Maraming feelings pag may relasyon, and mukhang mabigat ito sa'yo ngayon.`,
    family: `Mabigat talaga pag family ang pinag-uusapan.`,
    emotions: `Ang pagod nga niyan, and thanks for putting it into words.`,
    breakup: `Sorry, ang sakit talaga ng hiwalayan.`,
    trust: `Importante ang trust, kaya naiintindihan kong bothered ka.`,
    boundaries: `Hindi madaling mag-set ng boundaries sa mga taong mahalaga sa'yo.`,
    misunderstanding: `Nakakakaba talaga pag hindi clear kung ano ang nangyari.`,
    everyday: `Ay sige, noted! Thanks sa pagkwento.`,
    personal_growth: `Ang bigat nung feeling na parang nahuhuli ka na.`,
    serious_support: `Sineseryoso ko yung sinabi mo.`
  }
};
// English perspectives come from the dataset's knowledge insights. Filipino and Taglish
// perspectives are written here to mirror those same insights by category.
export const VIEW = {
  fil: {
    friendship: `Minsan abala lang talaga ang tao, hindi ibig sabihing wala na silang pakialam. Mas nakakatulong kadalasan ang mahinahong kumustahan kaysa sa paghaharap na may bigat.`,
    dating: `Kapag hindi malinaw ang kilos ng isang tao, mas maayos na direktang magtanong kaysa manghula ng nararamdaman niya.`,
    romance: `Mas nakakatulong sabihin kung ano ang nararamdaman mo, tulad ng 'nao-insecure ako kapag...', kaysa mag-akusa o magbantay.`,
    family: `Madalas takot at pag-aalala ang nasa likod ng pagiging mahigpit ng pamilya. Kapag naiintindihan mo yun, mas madaling pumili kung paano ka magsasalita.`,
    emotions: `Hindi mo kailangang solusyunan lahat ngayong gabi. Isang maliit na hakbang lang, at magpahinga ka kung kailangan.`,
    breakup: `Walang tamang bilis ng paghilom. Ayos lang ang malungkot, at hindi mo kailangang magmadaling mag-move on.`,
    trust: `Naibabalik ang tiwala sa pamamagitan ng tapat na kilos sa paglipas ng panahon, at ikaw ang magdedesisyon kung gaano kabilis kang handang magtiwala ulit.`,
    boundaries: `Sapat na ang maikli at magalang na hindi, tulad ng 'Pasensya na, hindi ko kaya ngayon.' Hindi mo kailangang magpaliwanag nang mahaba.`,
    misunderstanding: `Madalas simpleng dahilan lang ang nasa likod ng seen o maikling reply. Bago isipin ang pinakamasama, tingnan muna kung ano ang talagang alam mo.`,
    personal_growth: `Highlights lang ang nakikita natin sa social media. Mas makatotohanan kung ikukumpara mo ang sarili mo sa dati mong sarili.`
  },
  'tl-en': {
    friendship: `Minsan abala lang talaga ang tao, hindi ibig sabihing wala na silang care. A low-pressure check-in usually works better kaysa sa confrontation.`,
    dating: `Kapag unclear ang kilos ng tao, mas okay na magtanong nang direkta kaysa manghula ng feelings niya.`,
    romance: `Mas nakakatulong sabihin ang nararamdaman mo, like 'nao-insecure ako pag...', kaysa mag-accuse o mag-check.`,
    family: `Madalas takot at pag-aalala ang nasa likod ng pagiging strict. Pag naintindihan mo yun, mas madaling pumili kung paano ka magsasalita.`,
    emotions: `Hindi mo kailangang ayusin lahat ngayong gabi. One small step lang, and magpahinga ka kung kailangan.`,
    breakup: `Walang tamang bilis ang healing. Ayos lang ang malungkot, hindi mo kailangang magmadaling mag-move on.`,
    trust: `Naibabalik ang trust through consistent honesty over time, and ikaw ang magdedesisyon kung gaano ka kabilis magtiwala ulit.`,
    boundaries: `Sapat na ang maikli at polite na no, like 'Pasensya na, hindi ko kaya ngayon.' You don't need a long explanation.`,
    misunderstanding: `Madalas simple lang ang dahilan ng seen o maikling reply. Bago mag-assume ng pinakamasama, tingnan muna kung ano ang talagang alam mo.`,
    personal_growth: `Highlights lang ang nakikita natin sa social media. Mas fair na ikumpara ang sarili mo sa dati mong sarili.`
  }
};
export const VIEW_LEADIN = { en: ['One thing to keep in mind:', 'Something that may help:', 'A thought:'] };
export const FALLBACK = {
  en: [`I want to make sure I understand. Can you tell me a bit more about what's going on?`, `Go on, I'm listening. What happened?`],
  fil: [`Gusto kong maintindihan nang maayos. Pwede mo bang ikwento pa kung ano ang nangyari?`, `Sige lang, nakikinig ako. Ano ang nangyari?`],
  'tl-en': [`Gusto kong maintindihan nang maayos. Can you tell me more about what's going on?`, `Sige lang, nakikinig ako. Ano ang nangyari?`]
};
export const LIMIT_NOTE = {
  en: `A heads-up: I'm a simple companion that works from a fixed set of topics, so I might be missing what you mean. If this matters a lot, talking with someone you trust can help more than I can.`,
  fil: `Paalala lang: simpleng companion ako na gumagana mula sa limitadong set ng mga paksa, kaya baka hindi ko nakukuha ang ibig mong sabihin. Kung mahalaga ito sa'yo, mas makakatulong ang kausap na pinagkakatiwalaan mo.`,
  'tl-en': `Paalala lang: simple companion lang ako na gumagana sa fixed set ng topics, so baka hindi ko nakukuha ang ibig mong sabihin. Kung mahalaga ito sa'yo, mas makakatulong ang kausap na pinagkakatiwalaan mo.`
};
export const SOFT = {
  en: `That sounds really heavy, and I'm glad you said it out loud. When you say that, do you mean you're worn out and need a break, or are you having thoughts of hurting yourself or ending your life? Either answer is okay to say here.`,
  fil: `Ang bigat nun, at salamat sa pagsabi mo. Kapag sinabi mong ganyan, pagod na pagod ka lang ba at kailangan mo ng pahinga, o may mga iniisip ka bang saktan ang sarili mo o wakasan ang buhay mo? Pwede mong sabihin ang alinman dito.`,
  'tl-en': `Ang bigat nun, and salamat sa pagsabi mo. Kapag sinabi mong ganyan, pagod na pagod ka lang ba at kailangan mo ng pahinga, o may thoughts ka bang saktan ang sarili mo o wakasan ang buhay mo? Okay lang sabihin ang alinman dito.`
};
