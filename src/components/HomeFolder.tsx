import React, { useState, useEffect } from 'react';
import {
  Compass, Baby, HeartHandshake, Sparkles, School, Loader2,
  Book, Newspaper, HelpCircle, MessageCircleQuestion, ChevronRight, FolderOpen, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ResourceMap from './ResourceMap';
import CareApply from './CareApply';
import VideoEmbed from './VideoEmbed';
import { promoVideos } from '../data/promoVideos';

// ─────────────────────────────────────────────
// 5개 사업주제 인덱스 (폴더 탭)
// ─────────────────────────────────────────────
const TOPICS = [
  { key: '체험자원', index: '오늘 어디가지?', sub: '체험자원', icon: Compass,        color: 'amber' },
  { key: '거점돌봄', index: '돌봄이 필요할 때', sub: '거점형 돌봄', icon: HeartHandshake, color: 'amber' },
  { key: '유아발달', index: '우리아이 잘 크고 있을까?', sub: '유아발달지원사업', icon: Baby,    color: 'amber' },
  { key: '정서심리', index: '우리아이 마음이 궁금해', sub: '유아정서심리발달', icon: Sparkles,  color: 'amber' },
  { key: '이음교육', index: '이음교육이 뭐예요?', sub: '5세이음교육', icon: School,   color: 'amber' },
] as const;

const TAB_ACTIVE: Record<string, string> = {
  amber: 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-400 dark:border-amber-600',
};
const DOT: Record<string, string> = {
  amber: 'bg-amber-500',
};

interface HomeFolderProps {
  setView: (v: string) => void;
  role: string;
  resourceMapProps: any; // App이 들고 있는 ResourceMap 상태 묶음
}

const HomeFolder: React.FC<HomeFolderProps> = ({ setView, role, resourceMapProps }) => {
  const [active, setActive] = useState<string>('체험자원');
  const [showCareApply, setShowCareApply] = useState(false);
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
        {/* 인덱스 탭 — 모바일 2칸 / PC 5칸 균등분할 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-0 mb-3 md:mb-0 pb-0 px-0" role="tablist">
          {TOPICS.map(t => {
            const isActive = t.key === active;
            return (
              <button key={t.key} role="tab" aria-selected={isActive} onClick={() => setActive(t.key)}
                className={`rounded-2xl md:rounded-t-3xl md:rounded-b-none border md:border-b-0 px-3 md:px-3 pt-5 md:pt-8 pb-5 md:pb-9 transition-all text-center relative flex flex-col items-center justify-center
                  ${isActive
                    ? `bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-amber-400 dark:border-amber-600 shadow-[0_-12px_30px_rgba(245,158,11,0.2)] z-10 md:-mb-px`
                    : 'bg-amber-100 dark:bg-amber-950/40 text-slate-800 dark:text-slate-200 border-amber-200 dark:border-amber-900 hover:bg-amber-200 dark:hover:bg-amber-900/60 md:hover:-translate-y-2'}`}>
                <span className="font-black text-2xl md:text-3xl lg:text-4xl leading-tight text-center">
                  {t.index}
                </span>
                <span className="block text-base lg:text-lg font-bold text-amber-800 dark:text-amber-500 mt-2 md:mt-2.5 leading-snug text-center whitespace-pre-wrap">
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* 폴더 본문 */}
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] md:rounded-tl-none md:rounded-b-[2.5rem] md:rounded-tr-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.1)] overflow-hidden relative z-0">
          {active === '체험자원' && (
            <div className="h-[740px] [&>div]:!h-full">
              <ResourceMap {...resourceMapProps} role={role}/>
            </div>
          )}
          {active === '거점돌봄' && (
            <div className="h-[740px] overflow-y-auto">
              {!showCareApply ? (
                <CareIntroduction onApply={() => setShowCareApply(true)}/>
              ) : (
                <CareApply/>
              )}
            </div>
          )}
          {active !== '체험자원' && active !== '거점돌봄' && (
            <TopicFolder key={topic.key} topicKey={topic.key} title={topic.sub}/>
          )}
        </div>
      </div>

      {/* ── 우측 세로 탭 (자료실 / 뉴스 / FAQ / 문의하기) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-1 lg:flex lg:flex-col gap-5 lg:w-80 shrink-0">
        {sideTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setView(t.id)}
              className="flex-1 min-h-[160px] lg:min-h-44 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-900 rounded-3xl shadow-[0_25px_60px_rgba(245,158,11,0.12)] flex flex-col items-center justify-center gap-4 font-black text-slate-800 dark:text-slate-100 hover:-translate-x-0 lg:hover:-translate-x-3 hover:-translate-y-2 lg:hover:translate-y-0 hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-2xl hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all group px-5 py-8 text-center">
              <Icon size={52} className={`${t.color} group-hover:scale-130 transition-transform`}/>
              <span className="text-2xl lg:text-3xl leading-tight font-black">{t.label}</span>
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
    <div className="h-[740px] overflow-y-auto p-6 md:p-12">
      <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <FolderOpen className="text-amber-500 shrink-0" size={36}/> {title}
      </h3>

      {/* 사업별 홍보영상 (promoVideos.ts에 등록된 사업만 표시) */}
      {promoVideos[topicKey] && <VideoEmbed {...promoVideos[topicKey]} />}

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-slate-400" size={48}/></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen size={80} className="text-slate-200 dark:text-slate-600 mb-5"/>
          <p className="font-black text-slate-500 dark:text-slate-400 text-2xl">콘텐츠를 준비 중입니다.</p>
          <p className="font-bold text-lg text-slate-400 dark:text-slate-500 mt-3">곧 알찬 내용으로 찾아뵐게요!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map(it => (
            <div key={it.id} className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 md:p-10">
              <h4 className="font-black text-2xl md:text-3xl text-slate-900 dark:text-white mb-4">{it.title}</h4>
              {it.image_url && (
                <img src={it.image_url} alt={it.title} className="w-full rounded-3xl mb-5 border border-slate-100 dark:border-slate-700" loading="lazy"/>
              )}
              {it.content && (
                <p className="font-bold text-xl md:text-2xl leading-loose text-slate-700 dark:text-slate-200 whitespace-pre-line">{it.content}</p>
              )}
              {it.link_url && (
                <a href={it.link_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-7 md:px-8 h-14 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-black text-lg md:text-xl hover:bg-slate-700 transition-colors">
                  {it.link_label || '자세히 보기'} <ExternalLink size={20}/>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// 거점형 돌봄 설명 및 신청 시작 화면
// ─────────────────────────────────────────────
const CareIntroduction: React.FC<{ onApply: () => void }> = ({ onApply }) => (
  <div className="min-h-full flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-slate-900">
    <div className="max-w-3xl text-center">

      {/* 거점형 돌봄 홍보영상 */}
      {promoVideos['거점돌봄'] && <VideoEmbed {...promoVideos['거점돌봄']} />}

      <div className="mb-8">
        <HeartHandshake size={80} className="text-amber-600 dark:text-amber-500 mx-auto mb-6"/>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4">
          거점형 돌봄이란?
        </h2>
      </div>
      <p className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-8">
        전북특별자치도교육청에서 운영하는 <span className="text-amber-700 dark:text-amber-400">거점형 돌봄기관</span>은 유아의 안전하고 건강한 성장을 지원합니다.
      </p>
      <div className="space-y-6 mb-10 text-left bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-10 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xl shrink-0">1</div>
          <div>
            <p className="font-black text-xl md:text-2xl text-slate-900 dark:text-white">오전 돌봄 (아침 시간 지원)</p>
            <p className="font-bold text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 mt-2">등원 전 아침 시간에 아이를 안전하게 돌봐드립니다.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xl shrink-0">2</div>
          <div>
            <p className="font-black text-xl md:text-2xl text-slate-900 dark:text-white">저녁 돌봄 (방과 후 시간 지원)</p>
            <p className="font-bold text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 mt-2">방과 후 저녁 시간에 아이를 안전하게 돌봐드립니다.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xl shrink-0">3</div>
          <div>
            <p className="font-black text-xl md:text-2xl text-slate-900 dark:text-white">휴일·방학 돌봄</p>
            <p className="font-bold text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 mt-2">휴일과 방학 기간 중에도 안정적인 돌봄을 제공합니다.</p>
          </div>
        </div>
      </div>
      <button onClick={onApply}
        className="w-full h-20 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xl md:text-3xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl">
        <HeartHandshake size={32}/> 거점형 돌봄 신청하기
      </button>
    </div>
  </div>
);

export default HomeFolder;
