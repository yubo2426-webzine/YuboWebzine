import { Film } from 'lucide-react';
import VideoEmbed from './VideoEmbed';

const episode = {
  title: '눈 떠보니 내가 5살-5살이 되다',
  youtubeId: 'eOELi_776jI',
};

export default function ShortDrama() {
  if (!episode.youtubeId) return null;

  return (
    <section
      id="short-drama"
      aria-labelledby="short-drama-heading"
      className="grid items-center gap-5 rounded-[2rem] border border-teal-100 bg-white p-4 shadow-[0_12px_38px_rgba(15,118,110,0.08)] dark:border-slate-700 dark:bg-slate-800 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-8 md:p-6"
    >
      <div className="min-w-0 md:px-2">
        <h2
          id="short-drama-heading"
          className="flex items-center gap-2 text-sm font-black text-teal-700 dark:text-teal-300"
        >
          <Film size={19} aria-hidden="true" />
          숏폼드라마
        </h2>
        <h3
          id="short-drama-episode-title"
          className="mt-2 break-keep text-xl font-black leading-snug tracking-tight text-slate-900 dark:text-white md:text-3xl"
        >
          {episode.title}
        </h3>
      </div>
      <VideoEmbed youtubeId={episode.youtubeId} title={episode.title} />
    </section>
  );
}
