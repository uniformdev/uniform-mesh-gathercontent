import React from 'react'
import { useUniformMeshLocation } from '@uniformdev/mesh-sdk-react'
import ContentEntrySearch from '../components/ContentEntrySearch'
import { EditorMetadata, CmsValueParams } from '../types'
import IntegrationClient from '../lib/IntegrationClient'

const CmsCanvasParameterEditor = () => {
  const { value, setValue, metadata } = useUniformMeshLocation<CmsValueParams, EditorMetadata>()

  const { allowedContentTypes, multiSelect = false, displayName = 'title' } = metadata.parameterConfiguration
  const { settings } = metadata

  const client = new IntegrationClient({
    apiUsername: settings.apiUsername,
    apiHost: settings.apiHost,
    projectId: settings.projectId,
    apiKey: settings.apiKey,
  })

  return (
    <ContentEntrySearch
      integrationClient={client}
      value={value}
      setValue={setValue}
      displayName={displayName}
      multiSelect={multiSelect}
      allowedContentTypes={allowedContentTypes}
      settings={settings}
    />
  )
}

export default CmsCanvasParameterEditor
