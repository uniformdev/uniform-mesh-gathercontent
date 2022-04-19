import React from 'react'
import { useAsync } from 'react-use'
import { Callout, ScrollableList, ScrollableListItem, LoadingIndicator } from '@uniformdev/mesh-sdk-react'
import { ContentType, EditorSettings, SetAllowedContentTypesPayload } from '../types'

interface EditorProps {
  settings: EditorSettings
  value: {
    [name: string]: ContentType
  }
  setValue: (params: SetAllowedContentTypesPayload) => void
  integrationClient: {
    getContentTypes: () => Promise<ContentType[]>
  }
}

const ContentTypeSelector = ({ settings, value, setValue, integrationClient }: EditorProps) => {
  const {
    loading,
    error,
    value: contentTypes,
  } = useAsync(async () => integrationClient.getContentTypes(), [settings.apiHost])

  const handleContentTypeSelect = async contentType => {
    const allowedContentTypes = {
      ...(value || {}),
    }

    allowedContentTypes[contentType.id] = allowedContentTypes[contentType.id] ? undefined : contentType

    await setValue(allowedContentTypes)
  }
  return (
    <div>
      {loading ? <LoadingIndicator /> : null}
      {Array.isArray(contentTypes) ? (
        <div data-test-id="content-type-selector">
          {contentTypes.length === 0 ? (
            <Callout type="caution">No content types were found for project {settings.projectId}</Callout>
          ) : (
            <ScrollableList label="Allowed Content Types">
              {contentTypes.map(item => {
                const isActive = Boolean(value ? value[item.id] : false)

                return (
                  <div key={item.id} className="container-with-vertical-margin">
                    <ScrollableListItem
                      buttonText={item.name}
                      active={isActive}
                      onClick={() => handleContentTypeSelect(item)}
                    />
                  </div>
                )
              })}
            </ScrollableList>
          )}
        </div>
      ) : null}
      {error ? <Callout type="error">{error.message}</Callout> : null}
    </div>
  )
}

export default ContentTypeSelector
