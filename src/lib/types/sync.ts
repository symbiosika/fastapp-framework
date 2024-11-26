export interface SyncItem {
  externalId: string;
  title: string;
  text: string;
  lastChange?: string;
  lastHash?: string;
  meta?: Record<string, any>;
}
