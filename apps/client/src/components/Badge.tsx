import type { ReactNode } from "react";

type BadgeTone = "neutral" | "good" | "warn" | "bad" | "accent";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
