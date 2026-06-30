import type {
  DevelopmentBugStatus,
  DevelopmentComplexity,
  DevelopmentDeploymentStatus,
  DevelopmentEntityNumberConfig,
  DevelopmentEvidenceType,
  DevelopmentIdeaStatus,
  DevelopmentImpact,
  DevelopmentKnowledgeStatus,
  DevelopmentSprintPhase,
  DevelopmentSprintStatus,
} from "./desenvolvimento.types";
import type { DevelopmentRouteConfig } from "./desenvolvimento.interfaces";

export const DEVELOPMENT_MODULE_NAME = "Desenvolvimento";

export const DEVELOPMENT_BASE_ADMIN_PATH = "/admin/desenvolvimento";

export const DEVELOPMENT_ROUTES = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin/desenvolvimento/dashboard",
    description: "Indicadores operacionais da evolução do produto.",
  },
  {
    key: "correcoes-ajustes",
    label: "Correções",
    path: "/admin/desenvolvimento/correcoes",
    description: "Controle de bugs, ajustes, evidências, timeline e histórico.",
  },
  {
    key: "implantacoes",
    label: "Implantações",
    path: "/admin/desenvolvimento/implantacoes",
    description: "Controle de entregas, dependências, arquivos alterados e observações.",
  },
  {
    key: "backlog",
    label: "Backlog",
    path: "/admin/desenvolvimento/backlog",
    description: "Entrada obrigatória de novas ideias antes de qualquer Sprint.",
  },
  {
    key: "roadmap",
    label: "Roadmap",
    path: "/admin/desenvolvimento/roadmap",
    description: "Organização das Sprints e visão planejada de evolução.",
  },
  {
    key: "sprints",
    label: "Sprints",
    path: "/admin/desenvolvimento/sprints",
    description: "Planejamento, execução e acompanhamento de ciclos de desenvolvimento.",
  },
  {
    key: "base-conhecimento",
    label: "Base de Conhecimento",
    path: "/admin/desenvolvimento/base-conhecimento",
    description: "Documentação técnica automática e manual da evolução do produto.",
  },
  {
    key: "metricas",
    label: "Métricas",
    path: "/admin/desenvolvimento/metricas",
    description: "Estrutura para indicadores atuais e futuros.",
  },
] as const satisfies readonly DevelopmentRouteConfig[];

export const DEVELOPMENT_OFFICIAL_IMPLEMENTATION_ORDER = [
  {
    key: "sprint-0.1",
    label: "Sprint 0.1",
    objective: "Estrutura técnica",
    implementationAllowed: true,
  },
  {
    key: "sprint-0.2",
    label: "Sprint 0.2",
    objective: "Banco de dados",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.3",
    label: "Sprint 0.3",
    objective: "Layout base sem lógica",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.4",
    label: "Sprint 0.4",
    objective: "Correções e Ajustes",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.5",
    label: "Sprint 0.5",
    objective: "Dashboard",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.6",
    label: "Sprint 0.6",
    objective: "Implantações",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.7",
    label: "Sprint 0.7",
    objective: "Backlog",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.8",
    label: "Sprint 0.8",
    objective: "Roadmap",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.9",
    label: "Sprint 0.9",
    objective: "Métricas",
    implementationAllowed: false,
  },
  {
    key: "sprint-0.10",
    label: "Sprint 0.10",
    objective: "Base de Conhecimento",
    implementationAllowed: false,
  },
] as const satisfies readonly DevelopmentSprintPhase[];

export const DEVELOPMENT_NUMBER_CONFIGS = [
  { entityType: "bug", prefix: "BUG", digits: 6, example: "BUG-000001" },
  { entityType: "deployment", prefix: "IMP", digits: 6, example: "IMP-000001" },
  { entityType: "idea", prefix: "IDE", digits: 6, example: "IDE-000001" },
  { entityType: "sprint", prefix: "SPR", digits: 6, example: "SPR-000001" },
  { entityType: "knowledge", prefix: "DOC", digits: 6, example: "DOC-000001" },
  { entityType: "metric", prefix: "MET", digits: 6, example: "MET-000001" },
  { entityType: "evidence", prefix: "EVI", digits: 6, example: "EVI-000001" },
] as const satisfies readonly DevelopmentEntityNumberConfig[];

export const DEVELOPMENT_BUG_STATUSES = [
  "novo",
  "em_analise",
  "em_desenvolvimento",
  "aguardando_testes",
  "homologado",
  "producao",
  "fechado",
] as const satisfies readonly DevelopmentBugStatus[];

export const DEVELOPMENT_DEPLOYMENT_STATUSES = [
  "planejada",
  "em_preparacao",
  "em_desenvolvimento",
  "aguardando_homologacao",
  "homologada",
  "em_producao",
  "concluida",
  "cancelada",
  "falhou",
  "rollback",
] as const satisfies readonly DevelopmentDeploymentStatus[];

export const DEVELOPMENT_IDEA_STATUSES = [
  "nova",
  "em_discussao",
  "aprovada",
  "priorizada",
  "planejada",
  "em_sprint",
  "concluida",
  "rejeitada",
  "arquivada",
] as const satisfies readonly DevelopmentIdeaStatus[];

export const DEVELOPMENT_SPRINT_STATUSES = [
  "planejada",
  "ativa",
  "em_homologacao",
  "concluida",
  "cancelada",
  "adiada",
] as const satisfies readonly DevelopmentSprintStatus[];

export const DEVELOPMENT_KNOWLEDGE_STATUSES = [
  "rascunho",
  "publicado",
  "arquivado",
] as const satisfies readonly DevelopmentKnowledgeStatus[];

export const DEVELOPMENT_COMPLEXITIES = [
  "baixa",
  "media",
  "alta",
  "muito_alta",
] as const satisfies readonly DevelopmentComplexity[];

export const DEVELOPMENT_IMPACTS = [
  "baixo",
  "medio",
  "alto",
  "critico",
  "financeiro",
  "operacional",
  "experiencia_usuario",
  "seguranca",
  "performance",
] as const satisfies readonly DevelopmentImpact[];

export const DEVELOPMENT_EVIDENCE_TYPES = [
  "print",
  "video",
  "log",
  "arquivo",
] as const satisfies readonly DevelopmentEvidenceType[];

export const DEVELOPMENT_PRIORITY_RANGE = {
  min: 1,
  max: 10,
} as const;
