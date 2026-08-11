interface VideoEmbedProps {
  youtubeId: string;
  title: string;
}

export default function VideoEmbed({ youtubeId, title }: VideoEmbedProps) {
  if (!youtubeId || youtubeId.startsWith('여기에')) return null;

  return (
    <div style={{ margin: '0 0 24px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
        />
      </div>
    </div>
  );
}
