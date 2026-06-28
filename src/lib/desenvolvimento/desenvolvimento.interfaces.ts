import type { DevelopmentRouteKey } from "./desenvolvimento.types";

export interface DevelopmentRouteConfig {
  key: DevelopmentRouteKey;
  label: string;
  path: string;
  description: string;
}

export interface DevelopmentNavigationItem extends DevelopmentRouteConfig {
  shortLabel?: string;
}

export interface DevelopmentPlaceholderPageConfig extends DevelopmentRouteConfig {
  breadcrumbLabel: string;
}
