import React from 'react';

interface VideoEmbedProps {
  youtubeId: string;
  title: string;
  className?: string;
}

/**
 * 유튜브 영상 임베드
 * - youtubeId가 비어 있으면 아무것도 그리지 않습니다.
 * - youtube-nocookie 도메인을 사용해 불필요한 추적 쿠키를 줄입니다.
 */
const VideoEmbed: React.FC<VideoEmbedProps> = ({ youtubeId, title, className = '' }) => {
  if (!youtubeId) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-black ${className}`}
      style={{ aspectRatio: '16 / 9' }}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};

export default VideoEmbed;
