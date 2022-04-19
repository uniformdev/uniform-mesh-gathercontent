import React, { useState } from 'react'
import { useUniformMeshLocation, Button, Input, LoadingOverlay, Callout, Heading } from '@uniformdev/mesh-sdk-react'
import { MeshError, Params } from '../types'

const Settings = () => {
  const { value, setValue } = useUniformMeshLocation<Params, Params>()
  const [formValues, setFormValues] = useState<Params>({
    apiUsername: value.apiUsername,
    apiHost: value.apiHost,
    apiKey: value.apiKey,
    projectId: value.projectId,
    cmsHost: value.cmsHost,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<MeshError>()

  const handleSaveClick = async () => {
    const newSettings = {
      apiUsername: formValues.apiUsername,
      apiHost: formValues.apiHost,
      apiKey: formValues.apiKey,
      projectId: formValues.projectId,
      cmsHost: formValues.cmsHost,
    }

    setIsSaving(true)

    try {
      await setValue(newSettings)
    } catch (err) {
      setError(err)
    } finally {
      setIsSaving(false)
    }
  }

  const getErrorMessage = errorToDisplay => {
    switch (errorToDisplay.status) {
      case 401:
      case 403:
        return 'Wrong Credentials'

      default:
        return 'Something wend wrong'
    }
  }

  const handleFormInputChange = e => {
    setFormValues(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div>
      <Heading level={2}>GatherContent settings</Heading>
      <LoadingOverlay isActive={isSaving} />
      {error ? <Callout type="error">{getErrorMessage(error)}</Callout> : null}
      <Input
        name="apiUsername"
        label="Api username"
        onChange={handleFormInputChange}
        value={formValues.apiUsername || ''}
        caption="Provide any value here"
        placeholder="Provide any value here"
      />

      <Input
        name="apiKey"
        label="Api key"
        type="password"
        onChange={handleFormInputChange}
        value={formValues.apiKey || ''}
        placeholder="Provide any value here"
        caption="Provide any value here"
      />

      <Input
        name="apiHost"
        label="Api Host"
        onChange={handleFormInputChange}
        value={formValues.apiHost || ''}
        placeholder="Provide any value here"
        caption="Provide any value here"
      />

      <Input
        name="cmsHost"
        label="CMS Host"
        onChange={handleFormInputChange}
        value={formValues.cmsHost || ''}
        placeholder="Provide any value here"
        caption="Provide any value here"
      />

      <Input
        name="projectId"
        label="Project id"
        onChange={handleFormInputChange}
        value={formValues.projectId || ''}
        placeholder="Provide any value here"
        caption="Provide any value here"
      />

      <Button
        type="button"
        buttonType="secondary"
        onClick={handleSaveClick}
        disabled={
          isSaving ||
          !formValues.apiHost ||
          !formValues.apiUsername ||
          !formValues.apiKey ||
          !formValues.projectId ||
          !formValues.cmsHost
        }
      >
        Save
      </Button>
    </div>
  )
}

export default Settings
