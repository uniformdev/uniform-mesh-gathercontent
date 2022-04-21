import React, { useEffect, useState } from 'react';
import {
  useUniformMeshLocation,
  Input,
  Button,
  Callout,
  LoadingOverlay,
  Heading,
} from '@uniformdev/mesh-sdk-react';
import { ProjectSettings, SettingsValue } from '../../types';
import { GatherContentClient } from '../../lib/GatherContentClient';

export default function Settings() {
  const { value, setValue } = useUniformMeshLocation<SettingsValue>();

  const handleSettingsChange = async (settings: ProjectSettings) => {
    const valid = await validateApiConnection(settings);
    if (!valid) {
      throw new Error(
        'It appears that the provided settings are not able to access the GatherContent API. Please check the settings and try again.'
      );
    }

    await setValue({
      linkedSources: [
        {
          id: 'default',
          project: settings,
        },
      ],
    });
  };

  return (
    <>
      <Heading level={2}>GatherContent settings</Heading>
      <SettingsInner settings={value?.linkedSources?.[0].project} onSettingsChange={handleSettingsChange} />
    </>
  );
}

type FormState = Partial<ProjectSettings> & { isSubmitting: boolean; saveSuccess: boolean };

const SettingsInner = ({
  settings,
  onSettingsChange,
}: {
  settings: ProjectSettings | undefined;
  onSettingsChange: (settings: ProjectSettings) => Promise<void>;
}) => {
  const [formState, setFormState] = useState<FormState>({
    apiKey: '',
    apiUsername: '',
    projectId: '',
    projectUrl: '',
    isSubmitting: false,
    saveSuccess: false,
  });
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    setFormState((prev) => {
      return {
        ...prev,
        apiKey: settings?.apiKey || '',
        apiUsername: settings?.apiUsername || '',
        projectId: settings?.projectId || '',
        projectUrl: settings?.projectUrl || '',
      };
    });
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    setFormState((prev) => {
      return {
        ...prev,
        [e.target.name]: e.target.value,
        saveSuccess: false,
      };
    });
  };

  const handleSubmit = async () => {
    if (!formState.apiKey || !formState.apiUsername || !formState.projectId || !formState.projectUrl) {
      setError(new Error('Be sure to provide a Project Id, Project URL, API Username, and API Key'));
      return;
    }

    setError(undefined);
    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      saveSuccess: false,
    }));

    try {
      await onSettingsChange({
        apiKey: formState.apiKey!,
        apiUsername: formState.apiUsername!,
        projectId: formState.projectId!,
        projectUrl: formState.projectUrl!,
      });

      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        saveSuccess: true,
      }));
    } catch (err: any) {
      setError(err);
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        saveSuccess: false,
      }));
    }
  };

  return (
    <div className="space-y-4 relative mt-4">
      <LoadingOverlay isActive={formState.isSubmitting} />
      {error ? <Callout type="error">{error.message}</Callout> : null}
      {formState.saveSuccess ? <Callout type="success">Settings were saved successfully</Callout> : null}

      <div>
        <Input name="projectId" label="Project Id" onChange={handleInputChange} value={formState.projectId} />
      </div>
      <div>
        <Input
          name="projectUrl"
          label="Project Access URL (ex: https://my-organization.gathercontent.com)"
          onChange={handleInputChange}
          value={formState.projectUrl}
        />
      </div>
      <div>
        <Input
          name="apiUsername"
          label="API Username"
          onChange={handleInputChange}
          value={formState.apiUsername}
        />
      </div>
      <div>
        <Input name="apiKey" label="API Key" onChange={handleInputChange} value={formState.apiKey} />
      </div>
      <Button type="submit" buttonType="secondary" disabled={formState.isSubmitting} onClick={handleSubmit}>
        Save
      </Button>
    </div>
  );
};

async function validateApiConnection(settings: ProjectSettings) {
  const client = new GatherContentClient({
    apiKey: settings.apiKey,
    apiUsername: settings.apiUsername,
    projectId: settings.projectId,
  });

  let isValid = true;
  try {
    await client.getTemplates({ per_page: 1 });
  } catch (err) {
    isValid = false;
  }

  return isValid;
}
