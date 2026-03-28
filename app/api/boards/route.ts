import { NextResponse } from 'next/server';

interface Board {
  name: string;
  alias: string;
  class: string;
}

const PTT_HOT_URL = 'https://www.ptt.cc/bbs/hotboards.html';
const PTT_CLS_URLS = [
  'https://www.ptt.cc/cls/801',
  'https://www.ptt.cc/cls/802',
  'https://www.ptt.cc/cls/806',
  'https://www.ptt.cc/cls/807',
  'https://www.ptt.cc/cls/899',
  'https://www.ptt.cc/cls/1056',
  'https://www.ptt.cc/cls/2141',
  'https://www.ptt.cc/cls/2870',
  'https://www.ptt.cc/cls/3290',
  'https://www.ptt.cc/cls/3297',
  'https://www.ptt.cc/cls/3362',
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': USER_AGENT, 'Cookie': 'over18=1' };

// Cache: in-memory per cold-start instance (Vercel kills instance after idle)
let cachedBoards: Board[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

function parseBoards(html: string): Board[] {
  const entries: Board[] = [];
  // Match: <div class="b-ent"> ... <div class="board-name">NAME</div> ... <div class="board-class">CLASS</div>
  const regex = /<div class="b-ent">[\s\S]*?<div class="board-name">([^<]+)<\/div>[\s\S]*?<div class="board-class">([^<]*)<\/div>/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const name = m[1].trim();
    const cls = m[2].trim();
    if (name) entries.push({ name, alias: cls || name, class: cls || 'other' });
  }
  return entries;
}

async function fetchPage(url: string): Promise<Board[]> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    return parseBoards(html);
  } catch {
    return [];
  }
}

async function fetchAllPTTBoards(): Promise<Board[]> {
  const now = Date.now();
  if (cachedBoards && now - cacheTime < CACHE_TTL) return cachedBoards;

  // Fetch hotboards + all cls pages in parallel
  const [hotHtml, ...clsResults] = await Promise.all([
    fetch(PTT_HOT_URL, { headers: HEADERS }).then(r => r.ok ? r.text() : ''),
    ...PTT_CLS_URLS.map(url => fetchPage(url)),
  ]);

  // Parse hotboards
  const hotBoards = hotHtml ? parseBoards(hotHtml) : [];

  // Parse cls pages (may contain boards not in hot list)
  const clsBoards = clsResults.flat();

  // Merge: hotboards first (more popular), then cls-only boards
  const merged = new Map<string, Board>();
  for (const b of hotBoards) merged.set(b.name, b);
  for (const b of clsBoards) { if (!merged.has(b.name)) merged.set(b.name, b); }

  const result = Array.from(merged.values());
  cachedBoards = result;
  cacheTime = now;
  return result;
}

// GET /api/boards?search=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('search')?.trim().toLowerCase() ?? '';

  const allBoards = await fetchAllPTTBoards();

  let results: Board[];

  if (!query) {
    results = allBoards.slice(0, 50);
  } else {
    results = allBoards.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.alias.toLowerCase().includes(query) ||
      b.class.toLowerCase().includes(query)
    );

    // Exact match on board name wins
    if (results.length === 0) {
      const exact = allBoards.find(b => b.name.toLowerCase() === query);
      if (exact) results = [exact];
    }

    // Unknown board name → offer as candidate
    if (results.length === 0 && query.length >= 2 && query.length <= 24) {
      results = [{ name: query, alias: `/${query}`, class: 'other' }];
    }
  }

  return NextResponse.json({
    success: true,
    data: results.slice(0, 50),
    total: allBoards.length,
  });
}
