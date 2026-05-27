import Link from 'next/link';
import type { PropsWithChildren, ReactNode } from 'react';

interface FormScaffoldProps extends PropsWithChildren {
  title: string;
  confirmation: string;
  successMessage?: string | null;
  errorMessage?: string | null;
  fields: ReactNode;
  submitLabel: string;
  cancelHref: string;
  isSubmitting?: boolean;
}

export function FormScaffold({
  title,
  confirmation,
  successMessage,
  errorMessage,
  fields,
  submitLabel,
  cancelHref,
  isSubmitting = false,
  children,
}: FormScaffoldProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      {children}
      <div className="form-section">{fields}</div>
      <div className="confirmation-box">{confirmation}</div>
      {errorMessage ? (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}
      <div className="form-actions">
        <Link href={cancelHref} className="button-secondary">
          キャンセル
        </Link>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </div>
    </section>
  );
}
