import { Link } from "@tanstack/react-router";
import { Sparkles, Trophy, Plus } from "lucide-react";

/**
 * Banner CTA mostrado após um desafio encerrar — incentiva o criador (ou
 * comunidade) a criar o próximo desafio com bônus de 10.000 tokens para o
 * campeão. Aparece destacado abaixo do resultado.
 */
export function NextChallengeBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-yellow-400/10 p-5 sm:p-6 ${className}`}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-yellow-300/15 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-500/20 p-2.5 ring-1 ring-emerald-400/40">
            <Trophy className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Bônus exclusivo
            </div>
            <h3 className="mt-1 font-display text-xl font-black text-white sm:text-2xl">
              Vamos criar seu próximo desafio?
            </h3>
            <p className="mt-1 max-w-md text-sm text-emerald-50/90">
              Seu desafio foi um sucesso! Como recompensa, além do seu prêmio normal, damos{" "}
              <b className="text-yellow-300">+10.000 tokens</b> para o campeão do próximo.
            </p>
          </div>
        </div>
        <Link
          to="/criar"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:bg-emerald-300"
        >
          <Plus className="h-4 w-4" /> Criar próximo desafio
        </Link>
      </div>
    </div>
  );
}
