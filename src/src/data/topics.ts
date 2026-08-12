import { Compass, HeartHandshake, Baby, Sparkles, School } from 'lucide-react';

// ─────────────────────────────────────────────
// 5개 사업 정보 (단일 관리 지점)
//
//  key   : Supabase topic_pages 테이블의 topic 값
//  view  : App.tsx의 화면 식별자 (주소창에 노출되므로 영문)
//  index : 인덱스 문구
//  sub   : 사업명
// ─────────────────────────────────────────────
export interface Topic {
  key: string;
  view: string;
  index: string;
  sub: string;
  icon: any;
  accent: string;   // 아이콘 배경색
  iconColor: string;
}

export const TOPICS: Topic[] = [
  {
    key: '체험자원',
    view: 'resource_map',
    index: '오늘 어디가지?',
    sub: '체험자원',
    icon: Compass,
    accent: 'bg-sky-50 dark:bg-sky-950/40',
    iconColor: 'text-sky-500',
  },
  {
    key: '거점돌봄',
    view: 'care_intro',
    index: '돌봄이 필요할 때',
    sub: '거점형 돌봄',
    icon: HeartHandshake,
    accent: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-500',
  },
  {
    key: '유아발달',
    view: 'topic_dev',
    index: '우리아이 잘 크고 있을까?',
    sub: '유아발달지원사업',
    icon: Baby,
    accent: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-500',
  },
  {
    key: '정서심리',
    view: 'topic_emotion',
    index: '우리아이 마음이 궁금해',
    sub: '유아정서심리발달',
    icon: Sparkles,
    accent: 'bg-rose-50 dark:bg-rose-950/40',
    iconColor: 'text-rose-500',
  },
  {
    key: '이음교육',
    view: 'topic_bridge',
    index: '이음교육이 뭐예요?',
    sub: '5세이음교육',
    icon: School,
    accent: 'bg-indigo-50 dark:bg-indigo-950/40',
    iconColor: 'text-indigo-500',
  },
];

// view 식별자로 사업 정보 찾기
export const findTopicByView = (view: string) => TOPICS.find(t => t.view === view);
