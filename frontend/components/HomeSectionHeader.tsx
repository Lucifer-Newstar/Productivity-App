import type { LucideIcon } from "lucide-react";

export default function HomeSectionHeader({
  index,
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <header className="core-section-header">
      <div className="core-section-signal" aria-hidden="true">
        <span>{index}</span>
        <Icon size={19} strokeWidth={1.7} />
      </div>
      <div className="core-section-copy">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
      {actions && <div className="core-section-actions">{actions}</div>}
    </header>
  );
}
