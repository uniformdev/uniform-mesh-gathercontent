import React, { ChangeEvent, useEffect } from 'react';
import {
  Callout,
  LoadingIndicator,
  useUniformMeshLocation,
  ScrollableList,
  ScrollableListItem,
  ValidationResult,
  InputToggle,
} from '@uniformdev/mesh-sdk-react';
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

function validate(config: CanvasItemSelectorConfigValue): ValidationResult {
  if (
    !config ||
    !config.source ||
    !config.allowedTemplates ||
    Object.values(config.allowedTemplates).every((val) => typeof val === 'undefined')
  ) {
    return {
      isValid: false,
      validationMessage: 'At least one template must be selected.',
    };
  }
  return {
    isValid: true,
  };
}

export default function CanvasItemSelectorConfig() {
  const {
    value: config,
    setValue: setConfig,
    metadata,
    setValidationResult,
  } = useUniformMeshLocation<CanvasItemSelectorConfigValue, CanvasItemSelectorConfigMetadataValue>();

  useEffect(
    () => {
      const runEffect = async () => {
        await setValidationResult(validate(config));
      };
      runEffect();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleAllowedTemplatesSetValue = async (allowedTemplates: TemplateMap | undefined) => {
    const newConfig = { ...config, allowedTemplates };

    await setConfig(newConfig, validate(newConfig));
  };

  const handleLinkedSourceSelect = async (value: LinkedSource) => {
    await setConfig(
      {
        ...config,
        source: value.id,
      },
      { isValid: true }
    );
  };

  const handleRequiredToggle = async (e: ChangeEvent<HTMLInputElement>) => {
    const newConfig = { ...config, required: e.target.checked };
    await setConfig(newConfig, validate(newConfig));
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
        <div className="space-y-4">
          <TemplateSelector
            projectSettings={projectSettings}
            setValue={handleAllowedTemplatesSetValue}
            value={config.allowedTemplates}
          />
          <InputToggle
            label="Required"
            name="required"
            type="checkbox"
            caption="Requires users to select at least one item from the GatherContent item selector"
            checked={Boolean(config?.required)}
            onChange={handleRequiredToggle}
          />
        </div>
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
    <ScrollableList label="Allowed Templates">
      {loading ? <LoadingIndicator /> : null}
      {Array.isArray(templates) ? (
        templates.length === 0 ? (
          <Callout type="caution">No templates were found for project {projectSettings?.projectId}</Callout>
        ) : (
          templates.map((template, index) => {
            const active = Boolean(value ? value[template.id] : false);
            return (
              <ScrollableListItem
                active={active}
                buttonText={template.name}
                key={index}
                onClick={() => handleMenuItemClick(template)}
              />
            );
          })
        )
      ) : null}
      {error ? <Callout type="error">{error.message}</Callout> : null}
    </ScrollableList>
  );
}
