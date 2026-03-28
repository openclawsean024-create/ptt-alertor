import { NextResponse } from 'next/server';

// PTT Board list
const POPULAR_BOARDS = [
  { name: 'Stock', alias: '股板', category: 'finance' },
  { name: 'Tech_Job', alias: '科技業板', category: 'career' },
  { name: 'Soft_Job', alias: '軟工板', category: 'career' },
  { name: 'Gossiping', alias: '八卦板', category: 'social' },
  { name: 'NBA', alias: 'NBA板', category: 'sports' },
  { name: 'Baseball', alias: '棒球板', category: 'sports' },
  { name: 'Movie', alias: '電影板', category: 'entertainment' },
  { name: 'TechNews', alias: '科技板', category: 'news' },
  { name: 'Crypto', alias: '加密貨幣', category: 'finance' },
  { name: 'MobileComm', alias: '手機板', category: 'tech' },
  { name: 'WomenTalk', alias: '女性板', category: 'social' },
  { name: 'Muscle', alias: '健身板', category: 'health' },
  { name: 'Food', alias: '美食板', category: 'lifestyle' },
  { name: 'Travel', alias: '旅遊板', category: 'lifestyle' },
  { name: 'StudyAbroad', alias: '留學板', category: 'education' },
];

// Fetch latest articles from a PTT board using ptt.ai API
async function fetchPTTArticles(board: string, limit = 20) {
  try {
    const response = await fetch(
      `https://api.ptt.ai/v1/board/${board}/articles?limit=${limit}&desc=true`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PTT_API_TOKEN || ''}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }, // cache 60s
      }
    );

    if (!response.ok) {
      throw new Error(`PTT API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Fallback: scrape directly
    return await scrapePTTDirect(board, limit);
  }
}

// Fallback direct scrape using cheerio
async function scrapePTTDirect(board: string, limit = 20) {
  try {
    const response = await fetch(`https://www.ptt.cc/bbs/${board}/index.html`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PTTAlertor/1.0)',
        'Cookie': 'over18=1',
      },
      next: { revalidate: 60 },
    });

    const html = await response.text();
    const articles: any[] = [];

    // Simple regex-based parsing for article list
    const regex = /<a href="\/bbs\/[^/]+\/([^"]+)">([^<]+)<\/a>[\s\S]{0,200}<span class="meta">([^<]+)<\/span>/g;
    let match;
    let count = 0;

    while ((match = regex.exec(html)) !== null && count < limit) {
      articles.push({
        url: `https://www.ptt.cc${match[0].match(/href="([^"]+)"/)?.[1] || ''}`,
        title: match[2]?.trim(),
        author: match[3]?.trim(),
        board,
      });
      count++;
    }

    return { data: articles };
  } catch (error) {
    console.error(`Error scraping ${board}:`, error);
    return { data: [] };
  }
}

// GET /api/boards - List available boards
export async function GET() {
  return NextResponse.json({
    success: true,
    data: POPULAR_BOARDS,
  });
}
