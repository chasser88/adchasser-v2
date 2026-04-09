// ── All 38 Survey Questions ──────────────────────────────────────
export const QUESTIONS = {
  1: [
    {
      id: 'q1_1', type: 'single',
      text: "Let's start somewhere easy. When you think about [CATEGORY] — whether it's something you use every day or barely think about — what kind of person would you say you are when it comes to it?",
      options: [
        "I know exactly what I want and I stick to it",
        "I'm open to trying new things if something catches my eye",
        "I follow what people I trust recommend",
        "I buy what's convenient or on offer at the time",
        "I don't really think about it much — it's just a habit",
      ],
    },
    {
      id: 'q1_2', type: 'single',
      text: "How often does [CATEGORY] actually make it onto your shopping list — or into your basket?",
      options: [
        "It's a regular — I buy it almost every time I shop",
        "A few times a month, depending on how things are going",
        "Every now and then — maybe once a month or less",
        "Rarely — I've bought it before but it's not a staple",
        "Honestly, I can't remember the last time I bought it",
      ],
    },
    {
      id: 'q1_3', type: 'single',
      text: "If someone asked you to describe your relationship with [BRAND] the way you'd describe a person you know — which of these comes closest?",
      options: [
        "An old friend — familiar, trusted, I don't think twice",
        "Someone I've just started getting to know",
        "An acquaintance I see occasionally but don't think much about",
        "Someone I've drifted from — we used to be closer",
        "A stranger — I know of them but we haven't really met",
        "A competitor's loyalist — I'm with someone else, honestly",
      ],
    },
    {
      id: 'q1_4', type: 'multi', max: 3,
      text: "Think about a typical Tuesday — not a weekend, just a regular day. Where do you spend most of your time and attention? Pick up to 3.",
      options: [
        "Scrolling through Instagram, TikTok or YouTube Shorts",
        "Watching TV — live or streaming",
        "Listening to radio, podcasts or music",
        "Reading — news sites, articles, newsletters",
        "Commuting — billboards, transport, out and about",
        "WhatsApp, group chats, talking to people",
        "I'm mostly heads-down — work or tasks, not media",
      ],
    },
    {
      id: 'q1_5', type: 'single',
      text: "Just so we can group your answers with people who share a similar context — roughly where are you in life right now?",
      options: [
        "Early career, living independently or with others",
        "Building — career growing, maybe a family starting",
        "Established — settled, responsibilities are real",
        "Peak — experienced, things are stable",
        "Retired or winding down",
      ],
    },
    {
      id: 'q1_6', type: 'single',
      text: "When it comes to spending on [CATEGORY], which of these feels most like you?",
      options: [
        "I treat it — I'm willing to pay for quality here",
        "I'm value-conscious but I won't compromise too much",
        "I shop around — price matters, I compare",
        "I go for what's affordable, full stop",
        "It varies — depends on the month, honestly",
      ],
    },
  ],
  2: [
    {
      id: 'q2_1', type: 'open',
      text: "Thinking about [CATEGORY] advertising you've come across recently — on any screen, surface or channel — what's the first thing that comes to mind? It could be an image, a feeling, a tagline, anything.",
      placeholder: "Just say whatever surfaces first — no wrong answers here...",
    },
    {
      id: 'q2_2', type: 'single', isGate: true,
      text: "Has anything from [BRAND] specifically crossed your path lately — an ad, a post, a promotion, anything at all? Don't overthink it.",
      options: [
        "Yes, definitely — something's been showing up",
        "I think so — something feels familiar but I'm not certain",
        "Not that I've noticed",
        "I actively avoid ads so I honestly couldn't say",
      ],
    },
    {
      id: 'q2_3', type: 'asset_carousel',
      text: "Let us show you what's been out there — take a moment with each of these.",
      assetInstruction: "Watch, listen or view each one fully. We'll ask about your reaction after.",
      trackBOnly: true,
    },
    {
      id: 'q2_4', type: 'multi',
      text: "Where did you come across it? Pick everything that applies — even if it was just a fleeting moment.",
      options: [
        "Instagram / Facebook feed or Stories",
        "TikTok or YouTube",
        "TV — live or on a streaming service",
        "A billboard, poster or screen out and about",
        "WhatsApp or a group chat someone shared it in",
        "A website or app I was using",
        "Radio or a podcast",
        "In-store — at the shelf, on a screen, on packaging",
        "Somewhere else entirely",
      ],
    },
    {
      id: 'q2_5', type: 'single',
      text: "How much did it seem to follow you around?",
      options: [
        "Constantly — it felt like it was everywhere",
        "A fair amount — I noticed it more than once",
        "Once or twice — it showed up but didn't pursue me",
        "Barely — more of a blink-and-miss-it moment",
      ],
    },
    {
      id: 'q2_6', type: 'single',
      text: "Did you do anything with it — even something small? Pause, tap, share, look something up after?",
      options: [
        "Yes — I actively engaged with it in some way",
        "Not deliberately, but it made me stop for a second",
        "No — it registered but I kept moving",
        "No — I actively ignored or skipped it",
      ],
    },
    {
      id: 'q2_7', type: 'single',
      text: "Where were you, roughly, when you came across it most? Pick the one that feels most true.",
      options: [
        "At home, relaxed — scrolling or watching",
        "On the move — commuting, travelling",
        "At work or in task mode",
        "In or near a shop",
        "Out socialising",
        "I genuinely can't place it",
      ],
    },
  ],
  3: [
    {
      id: 'q3_1', type: 'open',
      text: "If you had to tell a friend what that campaign was about — not word for word, just the gist — what would you say?",
      placeholder: "In your own words, however it comes...",
    },
    {
      id: 'q3_2', type: 'open',
      text: "Without looking anything up — which brand do you associate most with that campaign?",
      placeholder: "Just type what comes to mind...",
    },
    {
      id: 'q3_3', type: 'scale', min: 1, max: 10,
      text: "How sharp did the message feel to you — like, did you immediately get what they were trying to say?",
      minLabel: "No idea what they were going for",
      maxLabel: "Crystal clear — got it immediately",
    },
    {
      id: 'q3_4', type: 'single',
      text: "And honestly — did what they were saying feel like it was meant for someone like you?",
      options: [
        "Yes — it spoke directly to my world",
        "Somewhat — parts of it felt relevant",
        "Not really — it felt aimed at someone else",
        "No — this clearly wasn't made with me in mind",
      ],
    },
    {
      id: 'q3_5', type: 'yes_no_open',
      text: "Was there anything about it that made you pause for the wrong reason — something confusing, off-putting, or that just didn't quite land?",
      followUp: "What was it?",
      followUpPlaceholder: "Tell us what caused the friction...",
    },
  ],
  4: [
    {
      id: 'q4_1', type: 'emotion_wheel', max: 3,
      text: "Close your eyes for a second — or just pause. When you bring that campaign to mind, what's the first feeling that surfaces? Don't filter it. Pick up to 3.",
      clusters: [
        { name: 'Warm & Positive', color: '#E87C4A', emotions: ['Warm','Inspired','Joyful','Proud','Nostalgic','Hopeful','Reassured'] },
        { name: 'Energised',       color: '#C9A84C', emotions: ['Excited','Motivated','Curious','Entertained'] },
        { name: 'Neutral',         color: '#64718F', emotions: ['Interested','Informed','Indifferent','Unsure'] },
        { name: 'Negative',        color: '#E05555', emotions: ['Irritated','Sceptical','Overwhelmed','Bored','Patronised','Uncomfortable'] },
      ],
    },
    {
      id: 'q4_2', type: 'semantic_diff',
      text: "If this campaign were a person who just walked into the room — how would you describe them?",
      pairs: [
        ['Cold',        'Warm'],
        ['Ordinary',    'Distinctive'],
        ['Dated',       'Fresh'],
        ['Distant',     'Relatable'],
        ['Loud',        'Subtle'],
        ['Generic',     'Authentic'],
        ['Forgettable', 'Memorable'],
      ],
    },
    {
      id: 'q4_3', type: 'single',
      text: "How much did the campaign feel like it came from [BRAND] — like you could have guessed who it was for even without the logo?",
      options: [
        "Completely — it felt distinctly them",
        "Mostly — it fits, even if it wasn't instantly obvious",
        "Somewhat — it could have been a few brands in this space",
        "Not really — it felt disconnected from what I know of them",
        "I don't know the brand well enough to say",
      ],
    },
    {
      id: 'q4_4', type: 'single',
      text: "Be honest with us — did seeing this campaign change anything about how you think or feel about [BRAND]?",
      options: [
        "Yes — they've gone up in my estimation",
        "Slightly — it nudged something, but nothing dramatic",
        "No — same as before, neither better nor worse",
        "Actually, it pulled them back a little for me",
        "I didn't have an opinion before, but now I'm forming one",
      ],
    },
    {
      id: 'q4_5', type: 'single',
      text: "Thinking about other campaigns you've seen from [BRAND] over the years — where does this one sit?",
      options: [
        "This is the best I've seen from them — it stands out",
        "About the same — consistent with what they usually do",
        "Not their strongest — I've seen better from them",
        "I don't have enough history with them to compare",
        "This is the first thing I've really noticed from them",
      ],
    },
  ],
  5: [
    {
      id: 'q5_1', type: 'single',
      text: "If someone asked you to name a brand in [CATEGORY] right now, unprompted — where does [BRAND] naturally sit in your head?",
      options: [
        "First one I'd mention, without thinking",
        "One of a short list that comes to mind",
        "It comes to mind, but not immediately",
        "It takes a moment to place them",
        "I wouldn't have thought of them at all",
      ],
    },
    {
      id: 'q5_2', type: 'scale', min: 1, max: 10,
      text: "How much does [BRAND] feel genuinely relevant to your life — not just as a product, but as something that fits who you are or what you care about?",
      minLabel: "Doesn't connect with my life at all",
      maxLabel: "Feels made for someone like me",
    },
    {
      id: 'q5_3', type: 'open',
      text: "What makes [BRAND] feel different — if anything — from the others in this space? What's the thing only they seem to do or stand for?",
      placeholder: "Take a moment — what comes to mind?",
    },
    {
      id: 'q5_4', type: 'single',
      text: "And how strongly do you feel that — is it a real sense of difference or more of a subtle impression?",
      options: [
        "Very strong — they clearly stand apart",
        "Noticeable — there's something there",
        "Mild — it's a slight difference more than a distinct one",
        "Honestly, they feel quite similar to the rest",
        "I'm not sure I see a difference at all",
      ],
    },
    {
      id: 'q5_5', type: 'single',
      text: "If a friend brought up [BRAND] in conversation, what would you most likely say about them?",
      options: [
        "I'd recommend them without hesitation",
        "I'd say good things but probably not push them strongly",
        "I'd be neutral — neither sell them nor dismiss them",
        "I'd probably mention some reservations",
        "I'd actively steer them elsewhere, if I'm honest",
      ],
    },
    {
      id: 'q5_6', type: 'scale', min: 1, max: 10,
      text: "All things considered — the campaign, the brand, what you know of them — how powerful does [BRAND] feel to you as a brand right now?",
      minLabel: "Weak — barely registers",
      maxLabel: "Dominant — a brand that really stands for something",
    },
  ],
  6: [
    {
      id: 'q6_1', type: 'single',
      text: "After encountering this campaign, where did [BRAND] sit in your mind when you next thought about buying in this category?",
      options: [
        "It moved to the top of my list",
        "It was already there, and this reinforced it",
        "It got added to my thinking — wouldn't have considered it before",
        "It was already on my radar but this didn't really move it",
        "It didn't factor into my thinking at all",
      ],
    },
    {
      id: 'q6_2', type: 'single',
      text: "Did the campaign push you to do anything — even something small? Look something up, visit the website, check the shelf?",
      options: [
        "Yes — I actively looked into it or sought it out",
        "I thought about it but didn't act on it",
        "Not consciously, but I may have noticed it in-store",
        "No — it didn't trigger any action",
      ],
    },
    {
      id: 'q6_3', type: 'single',
      text: "And did you actually buy [BRAND] — or buy more of it — around the time of this campaign?",
      options: [
        "Yes — I bought it and I think the campaign played a role",
        "Yes — but I would have bought it anyway",
        "No — but I'm more likely to next time",
        "No — and my likelihood hasn't really changed",
        "No — and if anything, I'm less inclined",
      ],
    },
    {
      id: 'q6_4', type: 'multi',
      text: "If the campaign didn't lead to a purchase — what would have needed to be different for it to have made a difference?",
      options: [
        "A clearer reason to choose them over what I usually buy",
        "A better price or offer",
        "Seeing it somewhere more relevant to where I shop",
        "More information about the product itself",
        "Seeing other people like me using it",
        "Honestly, the timing just wasn't right",
        "Nothing — I'm just not the right customer for this",
      ],
    },
  ],
  7: [
    {
      id: 'q7_1', type: 'open',
      text: "What was the thing about this campaign — if anything — that genuinely worked for you? What made it worth a second of your attention?",
      placeholder: "Be direct — what earned your attention?",
    },
    {
      id: 'q7_2', type: 'multi',
      text: "Which of these, if any, would you say were real strengths of this campaign?",
      options: [
        "The visual — it was striking and well made",
        "The message — it said something worth saying",
        "The humour or lightness — it didn't take itself too seriously",
        "The emotion — it touched something real",
        "The relevance — it felt like it understood my life",
        "The clarity — I knew exactly what they were saying",
        "The distinctiveness — it felt like only [BRAND] could have made it",
      ],
    },
    {
      id: 'q7_3', type: 'open',
      text: "If you were giving [BRAND] one piece of genuine advice on how to make their advertising better for someone like you — what would it be?",
      placeholder: "Speak freely — this is where real insight lives...",
    },
    {
      id: 'q7_4', type: 'rank',
      text: "From this list — what would make the biggest difference to how you engage with [BRAND]'s advertising? Tap in order of importance.",
      options: [
        "Show me real people who look like my world",
        "Less frequency — I've seen this too many times already",
        "More relevant channels — meet me where I actually am",
        "Sharper message — tell me why it matters to me specifically",
        "More entertainment, less selling",
        "More substance — give me something to think about",
        "Shorter, punchy content — I don't have time for long ads",
      ],
    },
    {
      id: 'q7_5', type: 'single',
      text: "If [BRAND] could show you one thing that would genuinely make you stop and pay attention, what kind of content would that be?",
      options: [
        "A story — real, emotional, characters I connect with",
        "Proof — show me the product doing what it claims",
        "Humour — make me genuinely laugh",
        "Community — people like me, using and loving it",
        "Values — show me what the brand actually stands for",
        "Inspiration — elevate me, give me something to aspire to",
        "Information — teach me something I didn't know",
      ],
    },
    {
      id: 'q7_6', type: 'open',
      text: "Is there anything else — about this campaign, about [BRAND], or about what it would take for a brand in this space to really win you over — that we haven't asked?",
      placeholder: "Say it here. No filter needed.",
    },
  ],
}

// Interpolate [BRAND] and [CATEGORY] placeholders
export function interpolateQuestion(q, brand, category) {
  const replace = str => str
    ?.replace(/\[BRAND\]/g,    brand    ?? 'this brand')
    ?.replace(/\[CATEGORY\]/g, category ?? 'this category')

  return {
    ...q,
    text:              replace(q.text),
    placeholder:       replace(q.placeholder),
    followUpPlaceholder: replace(q.followUpPlaceholder),
    options:           q.options?.map(replace),
    clusters:          q.clusters?.map(c => ({ ...c, emotions: c.emotions })),
  }
}
