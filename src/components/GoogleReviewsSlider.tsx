import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

type Review = {
  name: string;
  initials: string;
  city: string;
  rating: number;
  date: string;
  comment: string;
  color: string;
};

const REVIEWS: Review[] = [
  {
    name: "Carlos Henrique",
    initials: "CH",
    city: "São Paulo, SP",
    rating: 5,
    date: "há 2 semanas",
    comment:
      "Plataforma incrível! Já troquei meus tokens por um fone bluetooth. Tudo gratuito mesmo, recomendo demais!",
    color: "bg-blue-500",
  },
  {
    name: "Rafael Almeida",
    initials: "RA",
    city: "Rio de Janeiro, RJ",
    rating: 5,
    date: "há 1 mês",
    comment:
      "Melhor app de palpites que já usei. Os desafios da Copa são viciantes e o ranking é super competitivo.",
    color: "bg-emerald-500",
  },
  {
    name: "Bruno Santos",
    initials: "BS",
    city: "Belo Horizonte, MG",
    rating: 5,
    date: "há 3 dias",
    comment:
      "Comecei brincando e hoje participo todos os dias. Ganhei uma camisa oficial trocando tokens, chegou rapidinho!",
    color: "bg-purple-500",
  },
  {
    name: "Lucas Pereira",
    initials: "LP",
    city: "Curitiba, PR",
    rating: 5,
    date: "há 1 semana",
    comment:
      "Não acreditava que era 100% grátis, mas é verdade. Criei meu próprio desafio com a galera do trabalho e foi sucesso.",
    color: "bg-orange-500",
  },
  {
    name: "Felipe Oliveira",
    initials: "FO",
    city: "Porto Alegre, RS",
    rating: 5,
    date: "há 2 meses",
    comment:
      "Interface linda, fácil de usar e cheia de desafios diferentes. UFC, NBA, futebol... tem de tudo.",
    color: "bg-pink-500",
  },
  {
    name: "Diego Martins",
    initials: "DM",
    city: "Salvador, BA",
    rating: 4,
    date: "há 4 dias",
    comment:
      "Muito divertido competir com os amigos. O sistema de tokens é justo e a loja tem prêmios de verdade.",
    color: "bg-cyan-500",
  },
  {
    name: "André Costa",
    initials: "AC",
    city: "Recife, PE",
    rating: 5,
    date: "há 3 semanas",
    comment:
      "Já indiquei pra todos os amigos. Bônus de cadastro generoso e missões diárias que rendem bastante token.",
    color: "bg-red-500",
  },
  {
    name: "Marcos Silva",
    initials: "MS",
    city: "Fortaleza, CE",
    rating: 5,
    date: "há 5 dias",
    comment:
      "Os palpites malucos da Copa são geniais! Dá pra dar palpite em coisas que nenhuma outra plataforma tem.",
    color: "bg-amber-500",
  },
  {
    name: "Thiago Rodrigues",
    initials: "TR",
    city: "Brasília, DF",
    rating: 5,
    date: "há 1 mês",
    comment:
      "Suporte rápido, prêmios chegando direitinho e zero pegadinha. É exatamente o que promete.",
    color: "bg-indigo-500",
  },
  {
    name: "Gustavo Lima",
    initials: "GL",
    city: "Florianópolis, SC",
    rating: 5,
    date: "há 6 dias",
    comment:
      "Subi pro top 100 do ranking nacional e me senti um craque. App leve, sem propaganda chata, muito bem feito.",
    color: "bg-teal-500",
  },
];

const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24 12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3C36.9 39.7 44 34.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
);

export function GoogleReviewsSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
  );
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    setCount(emblaApi.scrollSnapList().length);
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary font-bold">
            <GoogleG /> Reviews do Google
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black">
            O que os usuários estão dizendo
          </h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
            </div>
            <span className="font-bold text-foreground">4.9</span>
            <span>· baseado em +2.500 avaliações</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Anterior"
            className="h-9 w-9 rounded-full border border-border/60 hover:border-primary/60 grid place-items-center transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Próximo"
            className="h-9 w-9 rounded-full border border-border/60 hover:border-primary/60 grid place-items-center transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="shrink-0 grow-0 basis-[88%] sm:basis-[48%] lg:basis-[32%]"
            >
              <article className="h-full rounded-2xl border border-border/60 glass-card p-5 flex flex-col">
                <header className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-full ${r.color} text-white grid place-items-center font-black text-sm shrink-0`}
                  >
                    {r.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-bold text-sm truncate">{r.name}</div>
                      <GoogleG />
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {r.city}
                    </div>
                  </div>
                </header>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < r.rating
                            ? "fill-gold text-gold"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {r.date}
                  </span>
                </div>
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed flex-1">
                  "{r.comment}"
                </p>
              </article>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Ir para review ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === selected
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-border hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
