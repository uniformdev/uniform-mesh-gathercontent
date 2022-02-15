import { Callout, LoadingIndicator, useUniformMeshLocation, Icons } from '@uniformdev/mesh-sdk-react';
import { useAsync } from 'react-use';
import {
  CanvasItemSelectorConfigValue,
  CanvasItemSelectorConfigMetadataValue,
  Template,
  ProjectSettings,
  LinkedSource,
  TemplateMap,
} from '../types';
import { GatherContentClient } from '../lib/GatherContentClient';
import { LinkedSourceSelect } from '../components/LinkedSourceSelect';

export default function CanvasItemSelectorConfig() {
  const {
    value: config,
    setValue: setConfig,
    metadata,
  } = useUniformMeshLocation<CanvasItemSelectorConfigValue, CanvasItemSelectorConfigMetadataValue>();

  const handleAllowedTemplatesSetValue = async (allowedTemplates: TemplateMap | undefined) => {
    await setConfig({ ...config, allowedTemplates });
  };

  const handleLinkedSourceSelect = async (value: LinkedSource) => {
    await setConfig({
      ...config,
      source: value.id,
    });
  };

  const selectedLinkedSource = metadata.settings.linkedSources?.find((ls) => ls.id === config?.source);
  const projectSettings = selectedLinkedSource?.project;

  return (
    <>
      {!metadata.settings.linkedSources ? (
        <Callout type="error">
          It appears the GatherContent integration is not configured. Please visit the &quot;Settings &gt;
          GatherContent&quot; page to provide information for connecting to GatherContent.
        </Callout>
      ) : (
        <LinkedSourceSelect
          selectedLinkId={config?.source}
          onLinkSelect={handleLinkedSourceSelect}
          linkedSources={metadata.settings.linkedSources}
        />
      )}

      {config?.source && projectSettings ? (
        <TemplateSelector
          projectSettings={projectSettings}
          setValue={handleAllowedTemplatesSetValue}
          value={config.allowedTemplates}
        />
      ) : null}
    </>
  );
}

interface TemplateSelectorProps {
  setValue: (value: TemplateMap) => Promise<void>;
  value: TemplateMap | undefined;
  projectSettings: ProjectSettings;
}

function TemplateSelector({ projectSettings, value, setValue }: TemplateSelectorProps) {
  const {
    loading,
    error,
    value: templates,
  } = useAsync(async () => {
    if (!projectSettings) {
      return;
    }
    const client = new GatherContentClient({
      apiUsername: projectSettings.apiUsername,
      apiKey: projectSettings.apiKey,
      projectId: projectSettings.projectId,
    });

    const result = await client.getTemplates();

    return result;
  }, [projectSettings]);

  const handleMenuItemClick = async (template: Template) => {
    // If the clicked template id already exists in the provided state value,
    // set the template id value to 'undefined' in the stored object.
    // This makes updating the state value less complex.
    // note: we can't mutate `value` directly as it is read-only/frozen, so spread the existing
    // value into a new object if it exists.
    const allowedTemplates = {
      ...(value || {}),
    };
    allowedTemplates[template.id] = allowedTemplates[template.id]
      ? undefined
      : { id: template.id, name: template.name };

    await setValue(allowedTemplates);
  };

  return (
    <div className="relative">
      <label className="uniform-input-label">Allowed Templates</label>
      {loading ? <LoadingIndicator /> : null}
      {Array.isArray(templates) ? (
        <div
          className="overflow-y-auto p-2 bg-gray-100 border-t border-b border-gray-300 space-y-2 max-h-96"
          data-test-id="content-type-selector"
        >
          {templates.length === 0 ? (
            <Callout type="caution">No templates were found for project {projectSettings?.projectId}</Callout>
          ) : (
            templates.map((template, index) => {
              const active = Boolean(value ? value[template.id] : false);
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-3 bg-white border-2 rounded-md shadow-md ${
                    active ? 'border-green-500' : 'border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleMenuItemClick(template)}
                    className="flex items-center justify-between w-full outline-none focus:outline-none"
                  >
                    <span>{template.name}</span>
                    {active ? <Icons.Checkmark className="block h-6 w-6 text-green-500" /> : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : null}
      {error ? <Callout type="error">{error.message}</Callout> : null}
    </div>
  );
}
