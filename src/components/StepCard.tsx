import { forwardRef, type ReactNode } from "react";
import { Check } from "lucide-react";

export const StepCard = forwardRef<HTMLDivElement, {
  step: number;
  title: string;
  subtitle?: string;
  done?: boolean;
  active?: boolean;
  children: ReactNode;
  right?: ReactNode;
}>(function StepCard({ step, title, subtitle, done, active = true, children, right }, ref) {
  return (
    <section
      ref={ref}
      className={`glass-card rounded-2xl p-5 border transition ${
        active ? "border-primary/40 shadow-glow" : done ? "border-emerald-500/40" : "border-border/60 opacity-80"
      }`}
    >
      <header className="flex items-start gap-3 mb-4">
        <div
          className={`h-9 w-9 shrink-0 rounded-full grid place-items-center font-black text-sm shadow-glow ${
            done ? "bg-emerald-500 text-emerald-950" : "bg-gradient-brand text-primary-foreground"
          }`}
        >
          {done ? <Check className="h-4 w-4" /> : String(step).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-display font-black leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className={active || done ? "" : "pointer-events-none select-none opacity-60"}>{children}</div>
    </section>
  );
});
