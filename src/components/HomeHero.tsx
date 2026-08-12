import React from 'react';
import { Book, Newspaper, HelpCircle, MessageCircleQuestion, ChevronRight } from 'lucide-react';
import { TOPICS } from '../data/topics';
import { promoVideos } from '../data/promoVideos';
import VideoEmbed from './VideoEmbed';

interface HomeHeroProps {
  setView: (v: string) => void;
}

const SIDE_TABS = [
  { id: 'issue_list', label: '자료실',           icon: Book,                   color: 'text-teal-500' },
  { id: 'news',       label: '유보통합 관련 뉴스', icon: Newspaper,              color: 'text-rose-500' },
  { id: 'faq',        label: 'FAQ',              icon: HelpCircle,             color: 'text-emerald-500' },
  { id: 'inquiry',    label: '문의하기',          icon: MessageCircleQuestion,  color: 'text-indigo-500' },
];

const HomeHero: React.FC<HomeHeroProps> = ({ setView }) => {
  const mainVideo = promoVideos.main;

  return (
    <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-6 items-start">

      {/* ── 좌측: 대표영상 + 인덱스 버튼 ── */}
      <div className="flex-1 min-w-0 w-full flex flex-col gap-5">

        {/* 대표 홍보영상 */}
        {mainVideo?.youtubeId && (
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.07)] p-3 md:p-4">
            <VideoEmbed youtubeId={mainVideo.youtubeId} title={mainVideo.title} />
            <p className="text-center font-bold text-sm md:text-base text-slate-500 dark:text-slate-400 mt-3 mb-1">
              {mainVideo.title}
            </p>
          </div>
        )}

        {/* 5개 사업 인덱스 버튼 */}
        <nav className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TOPICS.map((t, i) => {
            const Icon = t.icon;
            const isLastOdd = i === TOPICS.length - 1 && TOPICS.length % 2 === 1;
            return (
              <button
                key={t.key}
                onClick={() => setView(t.view)}
                className={`group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-5 flex flex-col items-center text-center gap-2.5
                  hover:border-amber-400 dark:hover:border-amber-600 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(245,158,11,0.16)]
                  transition-all duration-200
                  ${isLastOdd ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <span className={`w-12 h-12 rounded-xl ${t.accent} flex items-center justify-center shrink-0`}>
                  <Icon size={24} className={t.iconColor} />
                </span>

                <span className="font-black text-lg md:text-base lg:text-lg text-slate-800 dark:text-white leading-tight">
                  {t.sub}
                </span>

                <span className="font-bold text-sm text-slate-500 dark:text-slate-400 leading-snug break-keep">
                  {t.index}
                </span>

                <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-black text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  바로가기 <ChevronRight size={13} />
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 우측: 자료실 / 뉴스 / FAQ / 문의하기 ── */}
      <div className="w-full lg:w-72 shrink-0 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
        {SIDE_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="min-h-[112px] lg:min-h-[124px] bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900 rounded-2xl shadow-[0_16px_40px_rgba(245,158,11,0.1)]
                flex flex-col items-center justify-center gap-2.5 px-4 py-6 text-center
                font-black text-slate-800 dark:text-slate-100
                hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:-translate-y-1 hover:shadow-xl
                transition-all duration-200 group"
            >
              <Icon size={30} className={`${t.color} group-hover:scale-110 transition-transform`} />
              <span className="text-base lg:text-lg leading-tight break-keep">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeHero;
