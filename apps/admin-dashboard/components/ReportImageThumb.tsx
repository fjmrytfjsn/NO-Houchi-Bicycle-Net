interface ReportImageThumbProps {
  alt: string;
}

export function ReportImageThumb({ alt }: ReportImageThumbProps) {
  return (
    <div className="thumb" role="img" aria-label={alt}>
      <span>PHOTO</span>
    </div>
  );
}
