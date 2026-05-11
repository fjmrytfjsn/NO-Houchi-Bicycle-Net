import { useState } from 'react';

interface ReportImageThumbProps {
  alt: string;
  imageUrl?: string;
}

export function ReportImageThumb({ alt, imageUrl }: ReportImageThumbProps) {
  const [hasImageError, setHasImageError] = useState(false);

  if (imageUrl && !hasImageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Backend report image URLs are dynamic in this prototype.
      <img
        className="thumb thumb-image"
        src={imageUrl}
        alt={alt}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div className="thumb" role="img" aria-label={alt}>
      <span>PHOTO</span>
    </div>
  );
}
