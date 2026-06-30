import {
  DEVELOPMENT_NUMBER_CONFIGS,
  DEVELOPMENT_PRIORITY_RANGE,
} from "./desenvolvimento.constants";
import type {
  DevelopmentEntityPrefix,
  DevelopmentEntityType,
  DevelopmentPriority,
} from "./desenvolvimento.types";

export function formatDevelopmentNumber(
  prefix: DevelopmentEntityPrefix,
  value: number,
  digits = 6,
) {
  return `${prefix}-${String(value).padStart(digits, "0")}`;
}

export function getDevelopmentNumberConfig(entityType: DevelopmentEntityType) {
  return DEVELOPMENT_NUMBER_CONFIGS.find((config) => config.entityType === entityType);
}

export function isDevelopmentPriority(value: number): value is DevelopmentPriority {
  return (
    Number.isInteger(value) &&
    value >= DEVELOPMENT_PRIORITY_RANGE.min &&
    value <= DEVELOPMENT_PRIORITY_RANGE.max
  );
}
