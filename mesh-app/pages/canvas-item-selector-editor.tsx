import React from 'react';
import {
  CanvasItemSelectorEditorMetadataValue,
  CanvasItemSelectorEditorValue,
  Item,
  LinkedSource,
  ProjectSettings,
  Template,
  TemplateMap,
} from '../types';
import {
  Callout,
  EntrySearch,
  EntrySearchContentType,
  EntrySearchResult,
  LoadingIndicator,
  useUniformMeshLocation,
} from '@uniformdev/mesh-sdk-react';
import { useAsync, useAsyncFn, useMountedState } from 'react-use';
import { format as timeAgo } from 'timeago.js';
import { GatherContentClient } from '../lib/GatherContentClient';
import LogoIcon from '../public/gathercontent-badge.png';

export default function CanvasItemSelectorEditor() {
  const { value, setValue, metadata } = useUniformMeshLocation<
    CanvasItemSelectorEditorValue | undefined,
    CanvasItemSelectorEditorMetadataValue
  >();

  // Parameter value stores the linked source id within the parameter value.
  // But the parameter config may (or may not) also have a linked environment configured.
  // If the parameter value is defined, attempt to use the linked environment info from the value.
  // Else attempt to use the linked environment info from parameter config.
  // If neither are defined, we can't render the search component and show a message instead.
  const sourceId = value?.source || metadata.parameterConfiguration?.source || 'default';
  const resolvedLinkedSource = metadata.settings.linkedSources?.find((ls) => ls.id === sourceId);

  if (resolvedLinkedSource) {
    return (
      <ItemSearch
        linkedSource={resolvedLinkedSource}
        allowedTemplates={metadata.parameterConfiguration?.allowedTemplates}
        value={value}
        setValue={setValue}
      />
    );
  }

  return null;
}

function ItemSearch({
  linkedSource,
  allowedTemplates,
  value,
  setValue,
}: {
  linkedSource: LinkedSource;
  allowedTemplates: TemplateMap | undefined;
  value: CanvasItemSelectorEditorValue | undefined;
  setValue: (value: CanvasItemSelectorEditorValue) => Promise<void>;
}) {
  const isMounted = useMountedState();

  const {
    loading: allTemplatesLoading,
    error: allTemplatesError,
    value: allTemplates,
  } = useGetAllTemplatesMap({ projectSettings: linkedSource.project });

  const availableTemplates: TemplateMap = {};
  allTemplates
    ? Object.keys(allTemplates).forEach((templateId) => {
        const allowedTemplate = allowedTemplates?.[Number(templateId)];
        if (allowedTemplate) {
          availableTemplates[allowedTemplate.id] = allowedTemplate;
        }
      })
    : undefined;

  const [searchState, handleSearch] = useSearchItems({
    availableTemplates,
    convertItemToSearchResult: convertItemToSearchResultFn,
    projectSettings: linkedSource.project,
  });

  const { error: selectedItemsError, selectedItems } = useSelectedItems({
    convertItemToSearchResult: convertItemToSearchResultFn,
    itemIds: value?.itemIds,
    projectSettings: linkedSource.project,
    availableTemplates,
  });

  // Don't continue if the component was unmounted for some reason while search query was running.
  if (!isMounted()) {
    return null;
  }

  // map GatherContent templates to content type objects used by the component search component.
  const contentTypeOptions = availableTemplates
    ? Object.values(availableTemplates)
        ?.filter((template) => Boolean(template))
        ?.map<EntrySearchContentType>((template) => ({
          id: template!.id.toString(),
          name: template!.name,
        }))
    : undefined;

  const handleSelect = async (ids: string[]) => {
    await setValue({
      itemIds: ids.map((id) => Number(id)),
      source: linkedSource.id,
    });
  };

  if (searchState.error) {
    return <Callout type="error">{searchState.error.message}</Callout>;
  }

  if (selectedItemsError) {
    return <Callout type="error">{selectedItemsError.message}</Callout>;
  }

  if (allTemplatesError) {
    return <Callout type="error">{allTemplatesError.message}</Callout>;
  }

  if (allTemplatesLoading) {
    return <LoadingIndicator />;
  }

  return (
    <EntrySearch
      contentTypes={contentTypeOptions}
      search={handleSearch}
      results={searchState.value}
      resultsLoading={searchState.loading}
      logoIcon={LogoIcon.src}
      multiSelect={true}
      selectedItems={selectedItems}
      select={handleSelect}
      requireContentType={true}
      onSort={handleSelect}
    />
  );
}

function convertItemToSearchResultFn({
  item,
  selectedTemplate,
  projectSettings,
}: {
  item: Item;
  selectedTemplate: Pick<Template, 'id' | 'name'> | undefined;
  projectSettings: ProjectSettings;
}): EntrySearchResult {
  // use `new URL` to remove errant double slash `//` that may occur if projectUrl contains a trailing slash.
  const projectUrl = new URL(projectSettings.projectUrl);
  projectUrl.pathname = `/item/${item.id}`;
  return {
    id: item.id.toString(),
    title: item.name,
    metadata: {
      Type: selectedTemplate?.name || 'Unknown',
      Updated: <span>{timeAgo(item.updated_at)}</span>,
    },
    editLink: projectUrl.toString(),
  };
}

function useSelectedItems({
  projectSettings,
  itemIds,
  convertItemToSearchResult,
  availableTemplates,
}: {
  projectSettings: ProjectSettings;
  itemIds: number[] | undefined;
  convertItemToSearchResult: typeof convertItemToSearchResultFn;
  availableTemplates: TemplateMap | undefined;
}) {
  const { loading, error, value } = useGetItemsById({ projectSettings, itemIds });

  const resolveSelectedItems = () => {
    if (!itemIds) {
      return;
    }

    if (loading) {
      return itemIds.map((itemId) => ({
        id: itemId.toString(),
        title: `Loading...`,
      }));
    } else if (value) {
      const results = itemIds.map((selectedItemId) => {
        const item = value.find((item) => item.id === selectedItemId);
        if (item) {
          const resolvedTemplate = availableTemplates ? availableTemplates[item.template_id] : undefined;
          return convertItemToSearchResult({ item, selectedTemplate: resolvedTemplate, projectSettings });
        }
        return {
          id: selectedItemId.toString(),
          title: `Unresolvable (${JSON.stringify(selectedItemId)})`,
        };
      });
      return results;
    }

    return;
  };

  const selectedItems = resolveSelectedItems();

  return { selectedItems, error };
}

function useGetItemsById({
  projectSettings,
  itemIds,
}: {
  projectSettings: ProjectSettings;
  itemIds: number[] | undefined;
}) {
  // The `itemIds` array may have the same ids for different calls to the useGetItemsById hook,
  // but the ids might be in a different order (selected items are sortable in the UI).
  // Therefore, we sort the ids in ascending order so we can use the ids as a dependency key for the `useAsync`
  // hook and only fetch items from the API if item ids have been added/removed.
  // Changing item sort order should not result in API calls.
  const sortedItemIds = [...(itemIds || [])].sort();

  const { loading, error, value } = useAsync(async () => {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return;
    }

    const client = new GatherContentClient({
      apiUsername: projectSettings.apiUsername,
      apiKey: projectSettings.apiKey,
      projectId: projectSettings.projectId,
    });

    const results = await client.getItems({
      item_id: itemIds,
    });

    return results;
  }, [
    projectSettings.apiKey,
    projectSettings.apiUsername,
    projectSettings.projectId,
    // create a string value of the sortedItemIds so that the hook dependency check is accurate.
    // otherwise, the dependency check is referential only, so if the itemId array is "new" in between
    // calls the hook will always run (which we're trying to avoid).
    sortedItemIds?.join(','),
  ]);

  // The GatherContent Items API returns items sorted in ascending order by their respective item id.
  // The API does _not_ return items in the order we provide item ids.
  // Therefore, we sort the API results to match the order of the item ids we are requesting.
  // This ensures that sort order in the UI is correct.
  // Also note that we sort the results outside of the `useAsync` hook because said hook may not
  // run on every invocation of `useGetItemsById`. In particular when sort order of items is
  // changed via the UI.
  if (Array.isArray(itemIds) && itemIds.length > 0) {
    value?.sort((a, b) => itemIds.indexOf(a.id) - itemIds.indexOf(b.id));
  }

  return { loading, error, value };
}

function useSearchItems({
  availableTemplates,
  projectSettings,
  convertItemToSearchResult,
}: {
  availableTemplates: TemplateMap | undefined;
  projectSettings: ProjectSettings;
  convertItemToSearchResult: typeof convertItemToSearchResultFn;
}) {
  // `useAsyncFn` instead of `useAsync` so that we can control when
  // the `search` function is invoked (and do something meaningful afterwards).
  return useAsyncFn(
    async (text: string, options?: { contentType?: string }) => {
      // We require a template selection for searching otherwise the results list could be stupid long.
      if (!availableTemplates || !options?.contentType) {
        return;
      }

      const selectedTemplate = Object.values(availableTemplates).find(
        (template) => template?.id.toString() === options.contentType
      );

      // If the selected template somehow doesn't map to an allowed template we are in a bad state.
      if (!selectedTemplate) {
        return;
      }

      const client = new GatherContentClient({
        apiUsername: projectSettings.apiUsername,
        apiKey: projectSettings.apiKey,
        projectId: projectSettings.projectId,
      });

      const results = await client.getItems({
        template_id: [selectedTemplate.id],
        name_contains: text,
      });

      if (results) {
        const mappedResults = results.map((item) =>
          convertItemToSearchResult({
            item,
            selectedTemplate,
            projectSettings,
          })
        );
        return mappedResults;
      }
      return undefined;
    },
    [availableTemplates, projectSettings, convertItemToSearchResult]
  );
}

function useGetAllTemplatesMap({ projectSettings }: { projectSettings: ProjectSettings }) {
  const client = new GatherContentClient({
    apiUsername: projectSettings.apiUsername,
    apiKey: projectSettings.apiKey,
    projectId: projectSettings.projectId,
  });

  return useAsync(async () => {
    const templates = await client.getTemplates();

    const templateMap: TemplateMap = {};
    templates.forEach((template) => {
      templateMap[template.id] = {
        id: template.id,
        name: template.name,
      };
    });

    return templateMap;
  });
}
