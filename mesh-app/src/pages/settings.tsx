import React, { useState } from 'react'
import { useUniformMeshLocation, Button, Input, LoadingOverlay, Callout, Heading } from '@uniformdev/mesh-sdk-react'
import { MeshError, Params } from '../types'

const Settings = () => {
  const { value, setValue } = useUniformMeshLocation<Params, Params>()
  const [formValues, setFormValues] = useState<Params>({
    password: value.password,
    identifier: value.identifier,
    apiHost: value.apiHost,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<MeshError>()

  const handleSaveClick = async () => {
    const newSettings = {
      password: formValues.password,
      identifier: formValues.identifier,
      apiHost: formValues.apiHost,
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
      <Heading level={2}>Gathercontent settings</Heading>
      <LoadingOverlay isActive={isSaving} />
      {error ? <Callout type="error">{getErrorMessage(error)}</Callout> : null}
      <Input
        name="identifier"
        label="Identifier"
        onChange={handleFormInputChange}
        value={formValues.identifier || ''}
        caption="Provide any value here"
        placeholder="Provide any value here"
      />

      <Input
        name="password"
        label="Password"
        type="password"
        onChange={handleFormInputChange}
        value={formValues.password || ''}
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

      <Button
        type="button"
        buttonType="secondary"
        onClick={handleSaveClick}
        disabled={isSaving || !formValues.identifier || !formValues.password || !formValues.apiHost}
      >
        Save
      </Button>
    </div>
  )
}

export default Settings
