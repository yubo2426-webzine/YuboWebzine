import React, { useState, useEffect } from 'react';
import {
  Compass, Baby, HeartHandshake, Sparkles, School, Loader2,
  Book, Newspaper, HelpCircle, MessageCircleQuestion, ChevronRight, FolderOpen, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ResourceMap from './ResourceMap';
import CareApply from './CareApply';

// ─────────────────────────────────────────────
// 5개 사업주제 인덱스 (폴더 탭)
// ─────────────────────────────────────────────
const TOPICS = [
  { key: '체험자원', index: '오늘 어디가지?', sub: '체험자원', icon: Compass,        color: 'emerald' },
  { key: '거점돌봄', index: '돌봄이 필요할 때', sub: '거점형·연계형 돌봄', icon: HeartHandshake, color: 'sky' },
  { key: '유아발달', index: '우리아이 잘 크고 있을까?', sub: '유아발달지원사업', icon: Baby,    color: 'amber' },
  { key: '정서심리', index: '우리아이 마음이 궁금해', sub: '유아정서심리발달', icon: Sparkles,  color: 'rose' },
  { key: '이음교육', index: '이음교육이 뭐예요?', sub: '유초이음교육', icon: School,   color: 'violet' },
] as const;

const TAB_ACTIVE: Record<string, string> = {
  emerald: 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
  sky:     'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700',
  amber:   'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  rose:    'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700',
  violet:  'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700',
};
const DOT: Record<string, string> = {
  emerald: 'bg-emerald-400', sky: 'bg-sky-400', amber: 'bg-amber-400', rose: 'bg-rose-400', violet: 'bg-violet-400',
};

interface HomeFolderProps {
  setView: (v: string) => void;
  role: string;
  resourceMapProps: any; // App이 들고 있는 ResourceMap 상태 묶음
}

const HomeFolder: React.FC<HomeFolderProps> = ({ setView, role, resourceMapProps }) => {
  const [active, setActive] = useState<string>('체험자원');
  const topic = TOPICS.find(t => t.key === active)!;

  const sideTabs = [
    { id: 'issue_list', label: '자료실', icon: Book, color: 'text-teal-500' },
    { id: 'news', label: '유보통합 관련 뉴스', icon: Newspaper, color: 'text-rose-500' },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, color: 'text-emerald-500' },
    { id: 'inquiry', label: '문의하기', icon: MessageCircleQuestion, color: 'text-indigo-500' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-6 items-stretch">
      {/* ── 아코디언 폴더 ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 인덱스 탭 */}
        <div className="flex items-end gap-1.5 overflow-x-auto pb-0 px-2 scrollbar-none" role="tablist">
          {TOPICS.map(t => {
            const Icon = t.icon;
            const isActive = t.key === active;
            return (
              <button key={t.key} role="tab" aria-selected={isActive} onClick={() => setActive(t.key)}
                className={`shrink-0 rounded-t-2xl border border-b-0 px-4 md:px-5 pt-3 transition-all text-left relative
                  ${isActive
                    ? `${TAB_ACTIVE[t.color]} pb-4 -mb-px shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-10`
                    : 'bg-slate-100/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 pb-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5'}`}>
                <span className="flex items-center gap-1.5 font-black text-[13px] md:text-sm whitespace-nowrap">
                  <Icon size={15} className="shrink-0"/>{t.index}
                </span>
                <span className="block text-[10px] md:text-[11px] font-bold opacity-70 mt-0.5 whitespace-nowrap flex items-center gap-1">
                  <i className={`w-1.5 h-1.5 rounded-full inline-block ${DOT[t.color]}`}/>{t.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* 폴더 본문 */}
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-b-[2rem] rounded-tr-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.08)] overflow-hidden relative z-0">
          {active === '체험자원' && (
            <div className="h-[620px] [&>div]:!h-full">
              <ResourceMap {...resourceMapProps} role={role}/>
            </div>
          )}
          {active === '거점돌봄' && (
            <div className="h-[620px] overflow-y-auto">
              <CareApply/>
            </div>
          )}
          {active !== '체험자원' && active !== '거점돌봄' && (
            <TopicFolder key={topic.key} topicKey={topic.key} title={topic.sub}/>
          )}
        </div>
      </div>

      {/* ── 우측 세로 탭 (자료실 / 뉴스 / FAQ / 문의하기) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-1 lg:flex lg:flex-col gap-3 lg:w-60 shrink-0">
        {sideTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setView(t.id)}
              className="flex-1 min-h-[90px] lg:min-h-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center gap-2.5 font-black text-slate-700 dark:text-slate-200 hover:-translate-x-0 lg:hover:-translate-x-1.5 hover:-translate-y-1 lg:hover:translate-y-0 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-lg transition-all group px-4 py-6 text-center">
              <Icon size={26} className={`${t.color} group-hover:scale-110 transition-transform`}/>
              <span className="text-sm md:text-base leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 주제별 콘텐츠 폴더 (Supabase topic_pages 테이블에서 로드)
// ─────────────────────────────────────────────
const TopicFolder: React.FC<{ topicKey: string; title: string }> = ({ topicKey, title }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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

  return (
    <div className="h-[620px] overflow-y-auto p-6 md:p-10">
      <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6">
        <FolderOpen className="text-amber-500" size={26}/> {title}
      </h3>
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-slate-400" size={32}/></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen size={56} className="text-slate-200 dark:text-slate-600 mb-4"/>
          <p className="font-black text-slate-400">콘텐츠를 준비 중입니다.</p>
          <p className="font-bold text-sm text-slate-300 dark:text-slate-500 mt-1.5">곧 알찬 내용으로 찾아뵐게요!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map(it => (
            <div key={it.id} className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 md:p-8">
              <h4 className="font-black text-lg md:text-xl text-slate-800 dark:text-white mb-3">{it.title}</h4>
              {it.image_url && (
                <img src={it.image_url} alt={it.title} className="w-full rounded-2xl mb-4 border border-slate-100 dark:border-slate-700" loading="lazy"/>
              )}
              {it.content && (
                <p className="font-bold text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">{it.content}</p>
              )}
              {it.link_url && (
                <a href={it.link_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-5 h-11 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-black text-sm hover:bg-slate-700 transition-colors">
                  {it.link_label || '자세히 보기'} <ExternalLink size={14}/>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeFolder;
