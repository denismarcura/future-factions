import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Twitter, Mail } from "lucide-react";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Plataforma",
    links: [
      { label: "Desafios", to: "/desafios" },
      { label: "Criar Desafio", to: "/criar" },
      { label: "Palpite da IA", to: "/palpite-ia" },
      { label: "Ranking", to: "/ranking" },
      { label: "Top 100", to: "/top100" },
    ],
  },
  {
    title: "Explorar",
    links: [
      { label: "Prêmios", to: "/shop" },
      { label: "Missões", to: "/missoes" },
      { label: "Empresas", to: "/empresas" },
      { label: "Desafios Empresas", to: "/desafios-empresas" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { label: "Como Funciona", to: "/como-funciona" },
      { label: "Tokens e Recompensas", to: "/como-funcionam-os-tokens" },

      { label: "FAQ", to: "/faq" },
      { label: "Termos de Uso", to: "/termos" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/40 blur-lg opacity-60 group-hover:opacity-100 transition" />
                <img
                  src={logoAsset.url}
                  alt="Desafio dos Palpites"
                  className="relative h-12 w-12 object-contain drop-shadow-[0_0_8px_rgba(0,230,118,0.55)]"
                />
              </div>
              <div className="leading-none">
                <div className="font-display font-black text-sm tracking-tight">
                  DESAFIO <span className="text-gradient-brand">DOS</span>{" "}
                  <span className="text-gradient-silver">PALPITES</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
                  100% grátis · Só Tokens
                </div>
              </div>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Participe gratuitamente, acumule tokens e troque por prêmios reais.
              Esporte, entretenimento, criptos e muito mais.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
                { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { Icon: Mail, href: "mailto:contato@desafiodospalpites.com.br", label: "E-mail" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-9 w-9 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/60 transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {COLS.map((col) => (
              <div key={col.title}>
                <div className="text-[11px] uppercase tracking-wider text-primary font-bold mb-3">
                  {col.title}
                </div>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className="text-sm text-muted-foreground hover:text-foreground transition"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Desafio dos Palpites. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/termos" className="hover:text-foreground transition">Termos</Link>
            <Link to="/faq" className="hover:text-foreground transition">FAQ</Link>
            <span>CNPJ 00.000.000/0001-00</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
