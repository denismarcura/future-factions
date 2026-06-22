import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  phase?: string;
};

export function PlaceholderPage({ icon: Icon, title, description, features, phase }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-black">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border-dashed border-2 border-primary/30 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-3">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          Em breve {phase ? `· ${phase}` : ""}
        </div>
        <h3 className="font-display font-black text-lg">Este módulo está sendo construído</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
          Será entregue em uma fase dedicada para garantir qualidade e estabilidade.
        </p>
      </div>

      {features && features.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-display font-black mb-3 text-sm uppercase tracking-wider text-muted-foreground">
            O que virá aqui
          </h4>
          <ul className="grid sm:grid-cols-2 gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
