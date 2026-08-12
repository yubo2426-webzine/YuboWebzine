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
    <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">

      {/* ── 상단: 대표영상(좌) + 사업 인덱스(우) ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* 대표 홍보영상 */}
        {mainVideo?.youtubeId && (
          <div className="flex-1 min-w-0 w-full bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.07)] p-3 md:p-4">
            <VideoEmbed youtubeId={mainVideo.youtubeId} title={mainVideo.title} />
            <p className="text-center font-bold text-sm md:text-base text-slate-500 dark:text-slate-400 mt-3 mb-1">
              {mainVideo.title}
            </p>
          </div>
        )}

        {/* 5개 사업 인덱스 — PC에서는 우측 세로 목록 */}
        <nav className="w-full lg:w-[340px] shrink-0 grid grid-cols-2 lg:grid-cols-1 gap-3">
          {TOPICS.map((t, i) => {
            const Icon = t.icon;
            const isLastOdd = i === TOPICS.length - 1 && TOPICS.length % 2 === 1;
            return (
              <button
                key={t.key}
                onClick={() => setView(t.view)}
                className={`group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl
                  px-4 py-5 lg:px-5 lg:py-4
                  flex flex-col lg:flex-row items-center gap-2.5 lg:gap-4 text-center lg:text-left
                  hover:border-amber-400 dark:hover:border-amber-600 hover:-translate-y-1 lg:hover:-translate-y-0 lg:hover:-translate-x-1.5
                  hover:shadow-[0_16px_36px_rgba(245,158,11,0.16)] transition-all duration-200
                  ${isLastOdd ? 'col-span-2 lg:col-span-1' : ''}`}
              >
                <span className={`w-12 h-12 rounded-xl ${t.accent} flex items-center justify-center shrink-0`}>
                  <Icon size={24} className={t.iconColor} />
                </span>

                <span className="flex-1 min-w-0 flex flex-col lg:items-start">
                  <span className="font-black text-lg lg:text-xl text-slate-800 dark:text-white leading-tight">
                    {t.sub}
                  </span>
                  <span className="font-bold text-sm text-slate-500 dark:text-slate-400 leading-snug break-keep mt-0.5">
                    {t.index}
                  </span>
                </span>

                <ChevronRight
                  size={20}
                  className="hidden lg:block shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors"
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 하단: 자료실 / 뉴스 / FAQ / 문의하기 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {SIDE_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="min-h-[104px] md:min-h-[116px] bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900 rounded-2xl
                shadow-[0_16px_40px_rgba(245,158,11,0.1)]
                flex flex-col items-center justify-center gap-2.5 px-4 py-6 text-center
                font-black text-slate-800 dark:text-slate-100
                hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20
                hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group"
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
