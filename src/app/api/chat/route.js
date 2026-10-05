import { NextResponse } from 'next/server';

function getSystemPrompt(model = 'mabix-1.0') {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentYear = now.getFullYear();

  const isUltra = model === 'mabix-2.0-ultra';
  const engineName = isUltra ? 'MABIX 2.0 (core ultra)' : 'MABIX 1.0 (core)';

  return `CRITICAL IDENTITY & DIRECTIVES:
You are MABIX, an ultra-intelligent, lightning-fast multimodal AI assistant.
Tagline: "AI FOR YOUR JOURNEY"
Engine: ${engineName}
Creator & Visionary Developer: Tharun Thangadi (id: tharun_thangadi_1607)
Temporal Anchor: Today's date is ${dateStr}. Current year is ${currentYear}.

1. Creator Attribution:
   - Your creator and visionary developer is Tharun Thangadi.
   - If asked "Who made you?", "Who created you?", "Who is your developer/owner?", "Who is Tharun Thangadi?", or any inquiry about your author, origin, or founder, you MUST state clearly, respectfully, and proudly that you were created and developed by Tharun Thangadi.
   - Never say you were created by OpenAI, Google, Anthropic, or Meta. You are MABIX, engineered and built by Tharun Thangadi.

${
  isUltra
    ? `2. MABIX 2.0 CORE ULTRA — Elite Coding, Debugging & Multimodal Powerhouse (ChatGPT 5.5 Standard):
   - You are running the flagship MABIX 2.0 CORE ULTRA engine, built to operate with top-tier intelligence, reasoning, and engineering mastery.
   - Complex Software Engineering & Debugging:
     * Write robust, production-grade code across Python, JavaScript, TypeScript, React, Next.js, C/C++, Java, Rust, Go, SQL, Bash, and distributed architectures.
     * When asked to debug or fix code, pinpoint the exact root causes, syntax errors, logical bugs, and race conditions, then provide clean, optimized corrected code with clear explanations.
     * Master algorithms, data structures, unit testing, API integrations, and enterprise system designs.
   - Multimodal Photo Studio & Visual Intelligence:
     * You understand photo editing, background removal, scenic backdrop replacement, and image styling.
     * Provide insightful visual advice, composition ideas, and creative directions.`
    : `2. Core Capabilities:
   - Fast, reliable everyday intelligence, reasoning, coding, and problem-solving.`
}

3. Multimodal & Vision Capabilities:
   - When the user uploads an image (diagram, code screenshot, architecture flowchart, chart, photo, handwritten note, exam question paper, math problem, UI mockup, or scan), analyze it with deep precision and detail.
   - For "Explain this diagram": break down components, relationships, architecture, and concepts clearly.
   - For "What is wrong with this code?": pinpoint bugs, syntax errors, edge cases, and provide clean corrected code.
   - For "Read this question paper": extract the questions accurately and provide thorough, step-by-step solutions.

4. Document Understanding:
   - When documents (PDF, DOCX, TXT, CSV, Code files) are attached, analyze their text thoroughly.
   - Summarize, answer questions, extract data points, and explain documents clearly.

5. Present & Real-Time Ground Truth:
   - Always prioritize CURRENT / PRESENT facts as of ${currentYear}.
   - When real-time intelligence is provided, treat it as authoritative, factual truth.

6. Real Photos & Images:
   - When answering questions about famous figures, actresses, leaders, or places, and an official photo URL is provided, embed it at the very top of your answer:
     ![Title](REAL_IMAGE_URL)

7. Style:
   - Fast, sharp, professional, and well-structured using markdown headers, bolding, bullet points, and syntax-highlighted code blocks.`;
}

// Live, ultra-fast verified models (tested < 1.5s latency)
const FAST_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'mistralai/mistral-small-24b-instruct-2501',
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
];

// Multimodal models for analyzing image attachments
const VISION_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
];

// Helper to determine if query requires live web search
function isLiveQuery(text) {
  if (!text || text.length < 3) return false;
  const t = text.toLowerCase();
  const triggers = [
    'who is', 'who was', 'what is the current', 'current', 'present', 'latest',
    'today', 'news', 'update', 'prime minister', 'chief minister', 'cm of',
    'president', 'weather', 'stock', 'score', 'match', 'picture of', 'photo of',
    'image of', 'show me a picture', 'who won', 'who created', '2025', '2026',
    'actress', 'actor', 'leader', 'net worth'
  ];
  return triggers.some((tr) => t.includes(tr));
}

// Ultra-fast Real-Time Web & Wikipedia Intelligence (max 1.5s parallel)
async function fetchRealTimeIntelligence(query) {
  let webSnippets = [];
  let wikiResults = [];
  let imageUrl = null;
  let imageTitle = null;

  const webPromise = (async () => {
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(1500),
      });
      const html = await res.text();
      const regex = /<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null && webSnippets.length < 3) {
        const clean = match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (clean && clean.length > 20) {
          webSnippets.push(clean);
        }
      }
    } catch {
      // Gracefully ignore web search timeout
    }
  })();

  const wikiPromise = (async () => {
    try {
      const cleanQ =
        query
          .replace(
            /who is|what is|tell me about|show me a picture of|show photo of|picture of|photo of|image of|details of|current|present|latest|recent/gi,
            ''
          )
          .trim() || query;

      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQ
      )}&utf8=&format=json&origin=*`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(1400) });
      const searchData = await searchRes.json();
      const results = searchData.query?.search || [];
      if (!results.length) return;

      const titles = results.slice(0, 2).map((r) => r.title).join('|');
      const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        titles
      )}&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=800&format=json&origin=*`;
      const pageRes = await fetch(pageUrl, { signal: AbortSignal.timeout(1400) });
      const pageData = await pageRes.json();
      const pages = Object.values(pageData.query?.pages || {});

      for (const p of pages) {
        if (p.extract && wikiResults.length < 2) {
          wikiResults.push({
            title: p.title,
            extract: p.extract.slice(0, 350),
          });
        }
        if (!imageUrl && p.thumbnail?.source) {
          imageUrl = p.thumbnail.source;
          imageTitle = p.title;
        }
      }
    } catch {
      // Gracefully ignore wiki timeout
    }
  })();

  await Promise.allSettled([webPromise, wikiPromise]);
  return { webSnippets, wikiResults, imageUrl, imageTitle };
}

async function callModel(apiKey, messages, model, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mabix.netlify.app',
        'X-Title': 'MABIX AI Chat',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.5,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set OPENROUTER_API_KEY.' },
        { status: 500 }
      );
    }

    const { messages, model = 'mabix-1.0' } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    const lastUserMsgObj = [...messages].reverse().find((m) => m.role === 'user');
    const lastUserText =
      typeof lastUserMsgObj?.content === 'string'
        ? lastUserMsgObj.content
        : Array.isArray(lastUserMsgObj?.content)
        ? lastUserMsgObj.content.find((c) => c.type === 'text')?.text || ''
        : '';

    // Check if this request has image attachments
    const hasImageAttachments = Boolean(
      lastUserMsgObj?.attachments?.some((a) => a.isImage) ||
        (Array.isArray(lastUserMsgObj?.content) &&
          lastUserMsgObj.content.some((c) => c.type === 'image_url'))
    );

    // Fetch live intelligence ONLY when query actually needs it and has no images
    let liveContext = '';
    if (isLiveQuery(lastUserText) && !hasImageAttachments) {
      const intel = await fetchRealTimeIntelligence(lastUserText);

      const parts = [];
      if (intel.webSnippets.length > 0) {
        parts.push(`[LIVE WEB SEARCH RESULTS - PRESENT STATUS]:\n${intel.webSnippets.join('\n---\n')}`);
      }
      if (intel.wikiResults.length > 0) {
        const wikiText = intel.wikiResults.map((w) => `• ${w.title}: ${w.extract}`).join('\n');
        parts.push(`[ENCYCLOPEDIC REFERENCE]:\n${wikiText}`);
      }
      if (intel.imageUrl) {
        parts.push(
          `[REAL OFFICIAL PHOTO AVAILABLE]:\nTitle: ${intel.imageTitle || 'Photo'}\nImage URL: ${intel.imageUrl}\nINSTRUCTION: Embed this real photo at the very beginning of your answer:\n![${intel.imageTitle || 'Image'}](${intel.imageUrl})`
        );
      }

      if (parts.length > 0) {
        liveContext = `\n\n=== REAL-TIME GROUND TRUTH INTELLIGENCE ===\n${parts.join('\n\n')}\n===========================================`;
      }
    }

    const fullSystemPrompt = getSystemPrompt(model) + liveContext;

    // Convert messages to OpenRouter multimodal format
    const openRouterMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m) => {
        const role = m.role === 'assistant' ? 'assistant' : 'user';
        const attachments = m.attachments || [];
        const imageAttachments = attachments.filter((a) => a.isImage && a.dataUrl);
        const docAttachments = attachments.filter((a) => !a.isImage && a.textContent);

        let userText = typeof m.content === 'string' ? m.content : '';

        // Append document contents
        if (docAttachments.length > 0) {
          const docSection = docAttachments
            .map(
              (doc) =>
                `\n\n--- [ATTACHED FILE: ${doc.name} (${doc.type || 'document'})] ---\n${doc.textContent}\n--- [END OF ${doc.name}] ---`
            )
            .join('\n');
          userText = (userText ? userText + '\n' : '') + docSection;
        }

        // If message has images, use multimodal content array
        if (imageAttachments.length > 0) {
          const contentArray = [
            { type: 'text', text: userText || 'Please analyze this attached image in detail.' },
            ...imageAttachments.map((img) => ({
              type: 'image_url',
              image_url: { url: img.dataUrl },
            })),
          ];
          return { role, content: contentArray };
        }

        if (Array.isArray(m.content)) {
          return { role, content: m.content };
        }

        return { role, content: userText || m.content || '' };
      }),
    ];

    // Select candidate models
    const modelList = hasImageAttachments ? VISION_MODELS : FAST_MODELS;

    let response = null;
    for (const targetModel of modelList) {
      console.log(`[MABIX] (${model}) Requesting model: ${targetModel}`);
      response = await callModel(apiKey, openRouterMessages, targetModel, 6000);

      if (response && response.ok) {
        console.log(`[MABIX] Active stream with: ${targetModel}`);
        break;
      }

      console.warn(`[MABIX] Model ${targetModel} unavailable, trying fallback...`);
      response = null;
    }

    if (!response) {
      return NextResponse.json(
        { error: 'MABIX could not reach the AI servers. Please try again in a moment.' },
        { status: 503 }
      );
    }

    // Stream SSE back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;

              const jsonStr = trimmed.slice(6);
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.choices?.[0]?.delta?.content;
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                  );
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        } catch (err) {
          console.error('[MABIX] Streaming error:', err);
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[MABIX] Handler error:', error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
