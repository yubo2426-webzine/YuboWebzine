// ─────────────────────────────────────────────
// 홍보영상 목록
//
//  youtubeId : 유튜브 주소의 watch?v= 뒤 11자리
//              예) https://www.youtube.com/watch?v=J4OZfEiQqz4 → J4OZfEiQqz4
//  빈 문자열('')로 두면 해당 위치에 영상이 표시되지 않습니다.
// ─────────────────────────────────────────────
export interface PromoVideo {
  youtubeId: string;
  title: string;
}

export const promoVideos: Record<string, PromoVideo> = {
  // 첫 화면 대표 영상
  main: {
    youtubeId: 'J4OZfEiQqz4',
    title: '전북 유보통합 홍보영상',
  },

  // 사업별 영상 (topics.ts의 key와 이름이 같아야 합니다)
  거점돌봄: {
    youtubeId: '',
    title: '거점형 돌봄 홍보영상',
  },
  정서심리: {
    youtubeId: '',
    title: '유아정서심리발달 홍보영상',
  },
  이음교육: {
    youtubeId: '',
    title: '5세 이음교육 홍보영상',
  },
};
