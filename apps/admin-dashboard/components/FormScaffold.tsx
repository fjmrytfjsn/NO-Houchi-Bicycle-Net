import Link from 'next/link';
import type { PropsWithChildren, ReactNode } from 'react';

interface FormScaffoldProps extends PropsWithChildren {
  title: string;
  description: string;
  confirmation: string;
  successMessage?: string | null;
  fields: ReactNode;
  submitLabel: string;
  cancelHref: string;
}

export function FormScaffold({
  title,
  description,
  confirmation,
  successMessage,
  fields,
  submitLabel,
  cancelHref,
  children,
}: FormScaffoldProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
      <div className="form-section">{fields}</div>
      <div className="confirmation-box">{confirmation}</div>
      {successMessage ? <p className="success-message">{successMessage}</p> : null}
      <div className="form-actions">
        <Link href={cancelHref} className="button-secondary">
          キャンセル
        </Link>
        <button type="submit" className="button-primary">
          {submitLabel}
        </button>
      </div>
    </section>
  );
}
