import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Vercel 환경변수에서 Supabase 접속 정보를 가져옵니다
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const parser = new Parser();

export default async function handler(req, res) {
  // 1. 보안 체크 (설정된 비밀번호가 맞는지 확인)
  // Vercel Cron은 자동으로 헤더에 키를 담아 보내지만, 수동 호출을 위해 쿼리 파라미터도 허용합니다.
  const authHeader = req.headers.authorization;
  if (req.query.key !== process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const keywords = ['유보통합', '영유아학교'];
  let allNews = [];

  try {
    // 2. 뉴스 수집 (구글 뉴스 RSS 직접 호출)
    for (const keyword of keywords) {
      const feed = await parser.parseURL(
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
