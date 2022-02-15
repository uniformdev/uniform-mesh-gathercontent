import React, { useEffect, useState } from 'react';
import { useUniformMeshLocation, Input, Button, Callout, LoadingOverlay } from '@uniformdev/mesh-sdk-react';
import { ProjectSettings, SettingsValue } from '../../types';

export default function Settings() {
  const { value, setValue } = useUniformMeshLocation<SettingsValue>();

  const handleSettingsChange = async (settings: ProjectSettings) => {
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
      <h3 className="main-heading">GatherContent settings</h3>
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
    } catch (err) {
      setError(err);
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        saveSuccess: false,
      }));
    }
  };

  return (
    <div className="space-y-4 relative">
      <LoadingOverlay isActive={formState.isSubmitting} />
      {error ? <Callout type="error">{error.message}</Callout> : null}
      {formState.saveSuccess ? <Callout type="success">Settings were saved successfully</Callout> : null}

      <Input name="projectId" label="Project Id" onChange={handleInputChange} value={formState.projectId} />
      <Input
        name="projectUrl"
        label="Project Access URL (ex: https://my-organization.gathercontent.com)"
        onChange={handleInputChange}
        value={formState.projectUrl}
      />
      <Input
        name="apiUsername"
        label="API Username"
        onChange={handleInputChange}
        value={formState.apiUsername}
      />
      <Input name="apiKey" label="API Key" onChange={handleInputChange} value={formState.apiKey} />
      <Button type="submit" buttonType="secondary" disabled={formState.isSubmitting} onClick={handleSubmit}>
        Save
      </Button>
    </div>
  );
};
