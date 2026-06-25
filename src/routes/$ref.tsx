import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { getFriendProfile } from "@/lib/friend-profile.functions";
import { FriendProfileView } from "./amigo.$ref";

type SearchParams = { d?: string };

export const Route = createFileRoute("/$ref")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    d: typeof s.d === "string" ? s.d : undefined,
  }),
  loader: async ({ params }) => {
    const fn = getFriendProfile as any;
    const data = await fn({ data: { ref: params.ref } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.profile?.full_name ?? "Amigo";
    const title = `${name} te convidou para o Desafio dos Palpites`;
    const desc = `Veja os desafios criados, em andamento e oportunidades para participar com ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: loaderData?.profile?.avatar_url ?? "" },
      ],
    };
  },
  errorComponent: () => <AppShell><div className="p-8 text-center">Erro ao carregar convite.</div></AppShell>,
  notFoundComponent: () => (
    <AppShell>
      <div className="max-w-md mx-auto p-8 text-center space-y-3">
        <h1 className="font-display text-2xl font-black">Convite não encontrado</h1>
        <p className="text-sm text-muted-foreground">O link pode estar incorreto ou o usuário ainda não está ativo.</p>
        <Link to="/desafios" className="inline-block h-11 px-6 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold flex items-center justify-center">Ver desafios abertos</Link>
      </div>
    </AppShell>
  ),
  component: InviteSlugPage,
});

function InviteSlugPage() {
  const data = Route.useLoaderData() as any;
  const search = Route.useSearch();
  return <FriendProfileView data={data} highlightId={search.d} />;
}