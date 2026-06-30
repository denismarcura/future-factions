export type DevelopmentEntityType =
  | "bug"
  | "deployment"
  | "idea"
  | "sprint"
  | "knowledge"
  | "metric"
  | "evidence"
  | "dependency"
  | "timeline_event"
  | "activity_log"
  | "tag";

export type DevelopmentEntityPrefix = "BUG" | "IMP" | "IDE" | "SPR" | "DOC" | "MET" | "EVI";

export type DevelopmentBugStatus =
  | "novo"
  | "em_analise"
  | "em_desenvolvimento"
  | "aguardando_testes"
  | "homologado"
  | "producao"
  | "fechado";

export type DevelopmentDeploymentStatus =
  | "planejada"
  | "em_preparacao"
  | "em_desenvolvimento"
  | "aguardando_homologacao"
  | "homologada"
  | "em_producao"
  | "concluida"
  | "cancelada"
  | "falhou"
  | "rollback";

export type DevelopmentIdeaStatus =
  | "nova"
  | "em_discussao"
  | "aprovada"
  | "priorizada"
  | "planejada"
  | "em_sprint"
  | "concluida"
  | "rejeitada"
  | "arquivada";

export type DevelopmentSprintStatus =
  | "planejada"
  | "ativa"
  | "em_homologacao"
  | "concluida"
  | "cancelada"
  | "adiada";

export type DevelopmentKnowledgeStatus = "rascunho" | "publicado" | "arquivado";

export type DevelopmentComplexity = "baixa" | "media" | "alta" | "muito_alta";

export type DevelopmentEvidenceType = "print" | "video" | "log" | "arquivo";

export type DevelopmentDependencyType =
  | "bloqueia"
  | "depende_de"
  | "relacionado"
  | "duplicado"
  | "substitui";

export type DevelopmentDependencyStatus = "ativa" | "resolvida" | "cancelada";

export type DevelopmentTimelineEventType =
  | "created"
  | "updated"
  | "status_changed"
  | "assigned"
  | "linked"
  | "unlinked"
  | "commented"
  | "evidence_added"
  | "dependency_added"
  | "dependency_resolved"
  | "closed"
  | "deployed"
  | "document_generated";

export type DevelopmentPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DevelopmentImpact =
  | "baixo"
  | "medio"
  | "alto"
  | "critico"
  | "financeiro"
  | "operacional"
  | "experiencia_usuario"
  | "seguranca"
  | "performance";

export type DevelopmentChangedFileType = "created" | "updated" | "deleted" | "renamed";

export type DevelopmentRouteKey =
  | "dashboard"
  | "correcoes-ajustes"
  | "implantacoes"
  | "backlog"
  | "roadmap"
  | "sprints"
  | "base-conhecimento"
  | "metricas";

export type DevelopmentSprintPhaseKey =
  | "sprint-0.1"
  | "sprint-0.2"
  | "sprint-0.3"
  | "sprint-0.4"
  | "sprint-0.5"
  | "sprint-0.6"
  | "sprint-0.7"
  | "sprint-0.8"
  | "sprint-0.9"
  | "sprint-0.10";

export type DevelopmentEntityNumberConfig = {
  entityType: DevelopmentEntityType;
  prefix: DevelopmentEntityPrefix;
  digits: number;
  example: string;
};

export type DevelopmentSprintPhase = {
  key: DevelopmentSprintPhaseKey;
  label: string;
  objective: string;
  implementationAllowed: boolean;
};

export type DevelopmentTagContract = {
  id: string;
  name: string;
  color?: string;
  entityTypes: DevelopmentEntityType[];
};

export type DevelopmentDependencyContract = {
  id: string;
  sourceEntityType: DevelopmentEntityType;
  sourceEntityId: string;
  targetEntityType: DevelopmentEntityType;
  targetEntityId: string;
  dependencyType: DevelopmentDependencyType;
  status: DevelopmentDependencyStatus;
};

export type DevelopmentEvidenceContract = {
  id: string;
  entityType: DevelopmentEntityType;
  entityId: string;
  evidenceType: DevelopmentEvidenceType;
  fileName: string;
  fileUrl: string;
  storagePath?: string;
  notes?: string;
};

export type DevelopmentTimelineEventContract = {
  id: string;
  entityType: DevelopmentEntityType;
  entityId: string;
  eventType: DevelopmentTimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
};
