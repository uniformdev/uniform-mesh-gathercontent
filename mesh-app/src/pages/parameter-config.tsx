import React from 'react'
import { Callout, useUniformMeshLocation, Input, InputToggle } from '@uniformdev/mesh-sdk-react'
import { EditorMetadata, CmsParams } from '../types'
import ContentTypeSelector from '../components/ContentTypeSelector'
import IntegrationClient from '../lib/IntegrationClient'

const CmsCanvasParameterConfig = () => {
  const { value: config, setValue: setConfig, metadata } = useUniformMeshLocation<CmsParams, EditorMetadata>()
  const { settings } = metadata

  const client = new IntegrationClient({
    apiHost: settings.apiHost,
    apiKey: settings.apiKey,
    apiUsername: settings.apiUsername,
    projectId: settings.projectId,
  })

  const handleAllowedContentTypesSetValue = async allowedContentTypes => {
    await setConfig({ ...config, allowedContentTypes })
  }

  const handleSetMultiSelect = async multiSelect => {
    await setConfig({ ...config, multiSelect })
  }

  const handleSetDisplayName = async displayName => {
    await setConfig({ ...config, displayName })
  }

  return !settings?.apiUsername ? (
    <Callout type="error">
      It appears the Gathercontent integration is not configured. Please visit the &quot;Settings &gt; GatherContent&quot; page
      to provide information for connecting to Gathercontent.
    </Callout>
  ) : (
    <>
      <ContentTypeSelector
        integrationClient={client}
        settings={settings}
        setValue={handleAllowedContentTypesSetValue}
        value={config?.allowedContentTypes}
      />

      <div className="container-with-vertical-padding">
        <InputToggle
          label="Allow multiselect"
          name="multiSelect"
          checked={config?.multiSelect}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSetMultiSelect(e?.target.checked)}
          type="checkbox"
        />
      </div>

      <Input label="Display field" value={config?.displayName} onChange={e => handleSetDisplayName(e?.target.value)} />
    </>
  )
}

export default CmsCanvasParameterConfig
