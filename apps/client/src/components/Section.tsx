import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function Section({
  title,
  eyebrow,
  description,
  actions,
  children,
}: SectionProps) {
  return (
    <section className="panel section">
      <div className="section__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {description ? <p className="section__description">{description}</p> : null}
        </div>
        {actions ? <div className="section__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
