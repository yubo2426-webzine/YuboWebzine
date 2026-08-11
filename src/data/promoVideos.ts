export interface PromoVideo {
  youtubeId: string;
  title: string;
}

export const promoVideos: Record<string, PromoVideo> = {
  거점돌봄: { youtubeId: 'J4OZfEiQqz4', title: '거점형 돌봄 홍보영상' },
  정서심리: { youtubeId: 'J4OZfEiQqz4', title: '유아정서심리발달 홍보영상' },
  이음교육: { youtubeId: 'J4OZfEiQqz4', title: '5세 이음교육 홍보영상' },
};
