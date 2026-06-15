import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Vercel 환경변수에서 Supabase 접속 정보를 가져옵니다
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 💡 1. 구글이 기계(봇)로 인식하지 못하도록 '일반 크롬 브라우저'인 척하는 신분증(헤더)을 달아줍니다.
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9'
  }
});

// 💡 2. 수석님이 손으로 하시던 '여러 번 새로고침'을 코드가 알아서 최대 3번까지 대신 해주는 마법의 함수입니다.
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await parser.parseURL(url);
    } catch (error) {
      console.log(`[시도 ${i + 1}/${maxRetries}] 구글 뉴스 연결 지연. 1초 뒤 자동 새로고침합니다...`);
      if (i === maxRetries - 1) throw error; // 3번 다 실패하면 그때만 에러 처리
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 쉬고 다시 요청
    }
  }
}

export default async function handler(req, res) {
  // 1. 보안 체크
  const authHeader = req.headers.authorization;
  if (req.query.key !== process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const keywords = ['유보통합', '영유아학교'];
  let allNews = [];

  try {
    // 2. 뉴스 수집 (자동 재시도 함수 적용)
    for (const keyword of keywords) {
      const feed = await fetchWithRetry(
        `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`
      );

      const items = feed.items.map(item => ({
        title: item.title,
        link: item.link,
        description: item.contentSnippet || '',
        author: item.source || 'Google News',
        pub_date: new Date(item.pubDate).toISOString()
      }));
      allNews = [...allNews, ...items];
    }

    // 3. DB 저장 (링크가 같은 뉴스는 중복 저장하지 않음)
    if (allNews.length > 0) {
      const { error } = await supabase
        .from('news')
        .upsert(allNews, { onConflict: 'link', ignoreDuplicates: true });

      if (error) throw error;
    }

    // 성공 메시지 반환
    return res.status(200).json({ success: true, count: allNews.length });

  } catch (error) {
    console.error('News Cron Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
