import React, { useState, useEffect } from 'react';
import { Loader2, FolderOpen, ExternalLink, ChevronLeft, HeartHandshake } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TOPICS } from '../data/topics';
import { promoVideos } from '../data/promoVideos';
import VideoEmbed from './VideoEmbed';

interface TopicPageProps {
  topicKey: string;
  onHome: () => void;
  onApply?: () => void;   // 거점형 돌봄에서만 사용
}

const TopicPage: React.FC<TopicPageProps> = ({ topicKey, onHome, onApply }) => {
  const topic = TOPICS.find(t => t.key === topicKey);
  const video = promoVideos[topicKey];

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('topic_pages')
        .select('id, title, content, link_url, link_label, image_url, sort_order')
        .eq('topic', topicKey)
        .order('sort_order')
        .order('id');
      setItems(data || []);
      setLoading(false);
    })();
  }, [topicKey]);

  const Icon = topic?.icon ?? FolderOpen;

  return (
    <div className="w-full animate-in fade-in">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">

        {/* 홈으로 */}
        <button
          onClick={onHome}
          className="inline-flex items-center gap-1 mb-6 px-4 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronLeft size={16} /> 홈으로
        </button>

        {/* 제목 */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`w-14 h-14 rounded-2xl ${topic?.accent ?? 'bg-slate-100'} flex items-center justify-center shrink-0`}>
            <Icon size={28} className={topic?.iconColor ?? 'text-slate-500'} />
          </span>
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {topic?.sub ?? topicKey}
            </h2>
            {topic?.index && (
              <p className="font-bold text-base md:text-lg text-slate-500 dark:text-slate-400 mt-1">
                {topic.index}
              </p>
            )}
          </div>
        </div>

        {/* 홍보영상 */}
        {video?.youtubeId && (
          <div className="mb-8">
            <VideoEmbed youtubeId={video.youtubeId} title={video.title} />
          </div>
        )}

        {/* 거점형 돌봄 전용 안내 */}
        {topicKey === '거점돌봄' && <CareIntro onApply={onApply} />}

        {/* Supabase topic_pages 콘텐츠 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-slate-400" size={40} />
          </div>
        ) : items.length === 0 ? (
          topicKey !== '거점돌봄' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen size={60} className="text-slate-200 dark:text-slate-600 mb-4" />
              <p className="font-black text-slate-500 dark:text-slate-400 text-xl">콘텐츠를 준비 중입니다.</p>
              <p className="font-bold text-base text-slate-400 dark:text-slate-500 mt-2">곧 알찬 내용으로 찾아뵐게요!</p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            {items.map(it => (
              <div key={it.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 md:p-9">
                <h4 className="font-black text-xl md:text-2xl text-slate-900 dark:text-white mb-3">{it.title}</h4>
                {it.image_url && (
                  <img src={it.image_url} alt={it.title} className="w-full rounded-2xl mb-5 border border-slate-100 dark:border-slate-700" loading="lazy" />
                )}
                {it.content && (
                  <p className="font-medium text-lg md:text-xl leading-loose text-slate-700 dark:text-slate-200 whitespace-pre-line">{it.content}</p>
                )}
                {it.link_url && (
                  <a href={it.link_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-5 px-7 py-3.5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-black text-base hover:bg-slate-700 transition-colors">
                    {it.link_label || '자세히 보기'} <ExternalLink size={18} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 거점형 돌봄 안내 + 신청 버튼
// ─────────────────────────────────────────────
const CareIntro: React.FC<{ onApply?: () => void }> = ({ onApply }) => (
  <div className="mb-8">
    <p className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-6">
      전북특별자치도교육청에서 운영하는 <span className="text-amber-600 dark:text-amber-400">거점형 돌봄기관</span>은
      유아의 안전하고 건강한 성장을 지원합니다.
    </p>

    <div className="space-y-5 mb-7 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-amber-200 dark:border-amber-900">
      {[
        { n: 1, t: '오전 돌봄 (아침 시간 지원)', d: '등원 전 아침 시간에 아이를 안전하게 돌봐드립니다.' },
        { n: 2, t: '저녁 돌봄 (방과 후 시간 지원)', d: '방과 후 저녁 시간에 아이를 안전하게 돌봐드립니다.' },
        { n: 3, t: '휴일·방학 돌봄', d: '휴일과 방학 기간 중에도 안정적인 돌봄을 제공합니다.' },
      ].map(item => (
        <div key={item.n} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-lg shrink-0">
            {item.n}
          </div>
          <div>
            <p className="font-black text-lg md:text-xl text-slate-900 dark:text-white">{item.t}</p>
            <p className="font-medium text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">{item.d}</p>
          </div>
        </div>
      ))}
    </div>

    <button
      onClick={onApply}
      className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-lg md:text-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl"
    >
      <HeartHandshake size={26} /> 거점형 돌봄 신청하기
    </button>
  </div>
);

export default TopicPage;
