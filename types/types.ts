import { Template } from './GatherContentTypes';

export type TemplateMap = {
  [templateId: number]: Pick<Template, 'id' | 'name'> | undefined;
};

export type CanvasItemSelectorConfigValue =
  | {
      allowedTemplates?: TemplateMap;
      source?: LinkedSource['id'];
    }
  | undefined;

export interface CanvasItemSelectorConfigMetadataValue {
  settings: SettingsValue;
  /** Uniform project id, not GatherContent project id */
  projectId: string;
}

export interface CanvasItemSelectorEditorValue {
  source: string | undefined;
  itemIds: number[] | undefined;
}

export interface CanvasItemSelectorEditorMetadataValue {
  parameterConfiguration: CanvasItemSelectorConfigValue;
  settings: SettingsValue;
  /** Uniform project id, not GatherContent project id */
  projectId: string;
}

export interface SettingsValue {
  linkedSources: LinkedSource[] | undefined;
}

export interface LinkedSource {
  id: string;
  project: ProjectSettings;
}

export interface ProjectSettings {
  apiUsername: string;
  apiKey: string;
  /** GatherContent project id */
  projectId: string;
  /** URL used for accessing GatherContent project(s), e.g. https://myorg.gathercontent.com */
  projectUrl: string;
}
