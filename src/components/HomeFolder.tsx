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
  const TopicIcon = topic.icon;

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

        {/* 인덱스 탭 (모바일) — 사업명만 알약 버튼으로 압축 */}
        <div className="md:hidden flex flex-wrap justify-center gap-2 mb-3" role="tablist">
          {TOPICS.map(t => {
            const isActive = t.key === active;
            return (
              <button key={t.key} role="tab" aria-selected={isActive} onClick={() => setActive(t.key)}
                className={`h-12 px-5 rounded-full border-2 font-black text-base transition-colors
                  ${isActive
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-amber-200 dark:border-amber-900'}`}>
                {t.sub}
              </button>
            );
          })}
        </div>

        {/* 인덱스 탭 (PC) — 5개 균등분할 폴더 탭 */}
        <div className="hidden md:grid grid-cols-5 gap-0 pb-0 px-0" role="tablist">
          {TOPICS.map(t => {
            const isActive = t.key === active;
            return (
              <button key={t.key} role="tab" aria-selected={isActive} onClick={() => setActive(t.key)}
                className={`rounded-t-3xl border border-b-0 px-3 pt-7 pb-8 transition-all text-center relative flex flex-col items-center justify-center
                  ${isActive
                    ? `bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-amber-400 dark:border-amber-600 shadow-[0_-12px_30px_rgba(245,158,11,0.2)] z-10 -mb-px`
                    : 'bg-amber-100 dark:bg-amber-950/40 text-slate-800 dark:text-slate-200 border-amber-200 dark:border-amber-900 hover:bg-amber-200 dark:hover:bg-amber-900/60 hover:-translate-y-2'}`}>
                <span className="font-black text-2xl lg:text-3xl leading-tight text-center">
                  {t.index}
                </span>
                <span className="block text-sm lg:text-base font-bold text-amber-800 dark:text-amber-500 mt-2.5 leading-snug text-center whitespace-pre-wrap">
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* 폴더 본문 */}
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] md:rounded-tl-none md:rounded-b-[2.5rem] md:rounded-tr-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:shadow-[0_30px_80px_rgba(0,0,0,0.1)] overflow-hidden relative z-0">

          {/* 선택한 주제 문구 (모바일 전용) */}
          <div className="md:hidden flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <TopicIcon size={22} className="text-amber-500 shrink-0"/>
            <span className="font-black text-xl text-slate-900 dark:text-white leading-tight">{topic.index}</span>
          </div>

          {active === '체험자원' && (
            <div className="h-[640px] md:h-[740px] [&>div]:!h-full">
              <ResourceMap {...resourceMapProps} role={role}/>
            </div>
          )}
          {active === '거점돌봄' && (
            <div className="h-[640px] md:h-[740px] overflow-y-auto">
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
      <div className="grid grid-cols-2 lg:grid-cols-1 lg:flex lg:flex-col gap-4 lg:gap-5 lg:w-80 shrink-0">
        {sideTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setView(t.id)}
              className="flex-1 min-h-[120px] lg:min-h-40 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-900 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.1)] flex flex-col items-center justify-center gap-3 font-black text-slate-800 dark:text-slate-100 hover:-translate-x-0 lg:hover:-translate-x-3 hover:-translate-y-2 lg:hover:translate-y-0 hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-2xl hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all group px-4 py-6 text-center">
              <Icon size={40} className={`${t.color} group-hover:scale-110 transition-transform`}/>
              <span className="text-lg lg:text-2xl leading-tight font-black">{t.label}</span>
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
    <div className="h-[640px] md:h-[740px] overflow-y-auto p-6 md:p-12">
      {/* 사업별 홍보영상 (promoVideos.ts에 등록된 사업만 표시) */}
      {promoVideos[topicKey] && <VideoEmbed {...promoVideos[topicKey]} />}

      <h3 className="hidden md:flex text-3xl lg:text-4xl font-black text-slate-900 dark:text-white items-center gap-3 mb-8">
        <FolderOpen className="text-amber-500 shrink-0" size={32}/> {title}
      </h3>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-slate-400" size={44}/></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={64} className="text-slate-200 dark:text-slate-600 mb-5"/>
          <p className="font-black text-slate-500 dark:text-slate-400 text-xl">콘텐츠를 준비 중입니다.</p>
          <p className="font-bold text-base text-slate-400 dark:text-slate-500 mt-2">곧 알찬 내용으로 찾아뵐게요!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map(it => (
            <div key={it.id} className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 md:p-9">
              <h4 className="font-black text-xl md:text-2xl text-slate-900 dark:text-white mb-3">{it.title}</h4>
              {it.image_url && (
                <img src={it.image_url} alt={it.title} className="w-full rounded-2xl mb-5 border border-slate-100 dark:border-slate-700" loading="lazy"/>
              )}
              {it.content && (
                <p className="font-medium text-lg md:text-xl leading-loose text-slate-700 dark:text-slate-200 whitespace-pre-line">{it.content}</p>
              )}
              {it.link_url && (
                <a href={it.link_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 px-7 h-13 py-3.5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-black text-base md:text-lg hover:bg-slate-700 transition-colors">
                  {it.link_label || '자세히 보기'} <ExternalLink size={18}/>
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
    <div className="max-w-2xl w-full text-center">

      {/* 거점형 돌봄 홍보영상 */}
      {promoVideos['거점돌봄'] && <VideoEmbed {...promoVideos['거점돌봄']} />}

      <div className="mb-7">
        <HeartHandshake size={64} className="text-amber-600 dark:text-amber-500 mx-auto mb-5"/>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
          거점형 돌봄이란?
        </h2>
      </div>
      <p className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-8">
        전북특별자치도교육청에서 운영하는 <span className="text-amber-700 dark:text-amber-400">거점형 돌봄기관</span>은 유아의 안전하고 건강한 성장을 지원합니다.
      </p>
      <div className="space-y-5 mb-8 text-left bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-9 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-lg shrink-0">1</div>
          <div>
            <p className="font-black text-lg md:text-xl text-slate-900 dark:text-white">오전 돌봄 (아침 시간 지원)</p>
            <p className="font-medium text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">등원 전 아침 시간에 아이를 안전하게 돌봐드립니다.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-lg shrink-0">2</div>
          <div>
            <p className="font-black text-lg md:text-xl text-slate-900 dark:text-white">저녁 돌봄 (방과 후 시간 지원)</p>
            <p className="font-medium text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">방과 후 저녁 시간에 아이를 안전하게 돌봐드립니다.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-lg shrink-0">3</div>
          <div>
            <p className="font-black text-lg md:text-xl text-slate-900 dark:text-white">휴일·방학 돌봄</p>
            <p className="font-medium text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5">휴일과 방학 기간 중에도 안정적인 돌봄을 제공합니다.</p>
          </div>
        </div>
      </div>
      <button onClick={onApply}
        className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-lg md:text-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl">
        <HeartHandshake size={26}/> 거점형 돌봄 신청하기
      </button>
    </div>
  </div>
);

export default HomeFolder;
