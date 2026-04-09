/**
 * PTT Article Fetcher
 * Fetches articles from PTT boards using the public RSS feed.
 * RSS feed: https://www.ptt.cc/rss/{board}.xml
 * Does NOT require over18 cookie.
 */

const USER_AGENT = 'PTT-Alertor/1.0 (keyword monitoring service; contact: support@pttalertor.com)';
const PTT_RSS_BASE = 'https://www.ptt.cc/rss';

export interface PTTArticle {
  title: string;
  url: string;
  author: string;
  publishedAt: string; // ISO string
  board: string;
}

export interface PTTSearchResult {
  articles: PTTArticle[];
  board: string;
  fetchedAt: string;
}

/**
 * Fetch recent articles from a PTT board via RSS feed.
 * Falls back to web scraping if RSS is unavailable.
 */
export async function fetchBoardArticles(
  boardName: string,
  limit = 30
): Promise<PTTSearchResult> {
  const board = boardName.startsWith('/') ? boardName.slice(1) : boardName;
  const rssUrl = `${PTT_RSS_BASE}/${encodeURIComponent(board)}.xml`;

  try {
    const articles = await fetchFromRSS(rssUrl, board, limit);
    return articles;
  } catch {
    // Fallback: scrape from web
    return fetchFromWeb(board, limit);
  }
}

async function fetchFromRSS(
  url: string,
  board: string,
  limit: number
): Promise<PTTSearchResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/xml, text/xml' },
    next: { revalidate: 0 }, // Always fetch fresh for crawler
  });

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  const xml = await res.text();
  return parseRSS(xml, board, limit);
}

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  author?: string;
  description?: string;
}

function parseRSS(xml: string, board: string, limit: number): PTTSearchResult {
  const articles: PTTArticle[] = [];

  // Parse <item> blocks from RSS XML
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && articles.length < limit) {
    const itemXml = match[1];

    const getTag = (tag: string): string => {
      const re = new RegExp(`<${tag}[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}>|<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
      const m = itemXml.match(re);
      return m ? (m[1] || m[2] || '').trim() : '';
    };

    const title = decodeHTMLEntities(getTag('title'));
    const link = getTag('link');
    const pubDate = getTag('pubDate');
    const author = decodeHTMLEntities(getTag('author') || getTag('dc:creator') || 'unknown');
    const description = decodeHTMLEntities(
      getTag('description') || getTag('content:encoded') || ''
    ).replace(/<[^>]+>/g, '');

    // Skip sticky/announcement posts (usually contain 【公告】 or similar)
    if (title && link && !title.includes('（公告）') && !title.includes('[公告]')) {
      articles.push({
        title: title || description.slice(0, 100),
        url: link,
        author,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        board,
      });
    }
  }

  return {
    articles: articles.slice(0, limit),
    board,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchFromWeb(board: string, limit: number): Promise<PTTSearchResult> {
  // Fallback: scrape PTT board hot list page
  const url = `https://www.ptt.cc/bbs/${board}/index.html`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Cookie': 'over18=1',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return { articles: [], board, fetchedAt: new Date().toISOString() };
  }

  const html = await res.text();
  return parseBoardHTML(html, board, limit);
}

function parseBoardHTML(html: string, board: string, limit: number): PTTSearchResult {
  const articles: PTTArticle[] = [];

  // Match article list entries: <div class="r-ent"> blocks
  const entryRegex = /<div class="r-ent">([\s\S]*?)<\/div>\s*<div class="title">([\s\S]*?)<\/div>/g;
  let match;

  while ((match = entryRegex.exec(html)) !== null && articles.length < limit) {
    const rentContent = match[1];
    const titleContent = match[2];

    const getMeta = (cls: string): string => {
      const re = new RegExp(`<div class="${cls}"[^>]*>([^<]*)</div>`, 'i');
      const m = rentContent.match(re);
      return m ? m[1].trim() : '';
    };

    const titleMatch = titleContent.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
    const link = titleMatch ? `https://www.ptt.cc${titleMatch[1]}` : '';
    const title = titleMatch ? decodeHTMLEntities(titleMatch[2].trim()) : '';

    if (!title || title.includes('（已被刪除）') || title.includes('[公告]')) continue;

    const author = decodeHTMLEntities(getMeta('author') || 'anonymous');
    const date = getMeta('date');
    const publishedAt = date
      ? new Date(`${date} ${new Date().getFullYear()}`).toISOString()
      : new Date().toISOString();

    articles.push({ title, url: link, author, publishedAt, board });
  }

  return { articles, board, fetchedAt: new Date().toISOString() };
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Crawl multiple boards in sequence with rate limiting.
 * Returns all articles found across all boards.
 */
export async function crawlMultipleBoards(
  boardNames: string[],
  limitPerBoard = 20,
  delayMs = 1500 // PTT politeness: >= 1 second between requests
): Promise<PTTSearchResult[]> {
  const results: PTTSearchResult[] = [];

  for (const board of boardNames) {
    try {
      const result = await fetchBoardArticles(board, limitPerBoard);
      results.push(result);

      // Rate limiting: wait between board requests
      if (delayMs > 0 && boardNames.indexOf(board) < boardNames.length - 1) {
        await sleep(delayMs);
      }
    } catch (err) {
      console.error(`[PTT] Failed to fetch board ${board}:`, err);
      // Continue with other boards
    }
  }

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
