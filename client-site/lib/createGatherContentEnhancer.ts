/* eslint-disable no-console */
import {
  ComponentParameterEnhancer,
  ComponentInstance,
  ComponentParameter,
  createBatchEnhancer,
  UniqueBatchEntries,
  LimitPolicy,
  createLimitPolicy,
  EnhancerContext,
} from '@uniformdev/canvas';
import { GatherContentClient } from './GatherContentClient';
import { GatherContentClientList } from './GatherContentClientList';
import { Item } from './GatherContentTypes';

export type EntrySelectorParameterValue =
  | {
      itemIds: string[];
      source: string;
    }
  | null
  | undefined;

export type AddGatherContentQueryOptions<TContext extends EnhancerContext = EnhancerContext> = {
  /** Canvas parameter name being queried for. Not defined if using batching. */
  parameterName?: string;
  /** Canvas parameter value being fetched. Not defined if using batching. */
  parameter?: ComponentParameter<EntrySelectorParameterValue>;
  /** Component containing the parameter being fetched. Not defined if using batching. */
  component?: ComponentInstance;
  /** The default GatherContent query expression */
  defaultQueryOptions: Parameters<GatherContentClient['getItems']>[0]; //  { item_id: number[]; include_content: boolean };
  /** The enhancer context provided to the enhance() function */
  context: TContext;
};

export type AddGatherContentBatchQueryOptions<TContext extends EnhancerContext = EnhancerContext> = Pick<
  AddGatherContentQueryOptions<TContext>,
  'component' | 'context'
> & {
  /** The default GatherContent query options when using batching */
  defaultBatchQueryOptions: Parameters<GatherContentClient['getItems']>[0];
};

/** The default shape of the result value of the GatherContent enhancer. Note that this can change if the query is altered. */
export type GatherContentEnhancerResult = Item[] | null;

export type CreateGatherContentEnhancerOptions = {
  /** A list of GatherContent clients for use with multi-source-enabled Canvas projects. */
  clients: GatherContentClientList;
  /** Creates the GatherContent client's query params for specific parameters. */
  addItemQueryOptions?: (
    options: AddGatherContentQueryOptions
  ) => Parameters<GatherContentClient['getItems']>[0];
  addBatchQueryOptions?: (
    options: AddGatherContentBatchQueryOptions
  ) => Parameters<GatherContentClient['getItems']>[0];
  useBatching?: boolean;
  limitPolicy?: LimitPolicy;
};

export const CANVAS_GATHERCONTENT_PARAMETER_TYPES = Object.freeze(['gathercontent-items']);

export function createGatherContentEnhancer({
  clients,
  addItemQueryOptions,
  addBatchQueryOptions,
  useBatching,
  limitPolicy,
}: CreateGatherContentEnhancerOptions): ComponentParameterEnhancer<
  EntrySelectorParameterValue,
  GatherContentEnhancerResult
> {
  if (!clients) {
    throw new Error(
      'No GatherContent clients were provided to the enhancer. You must provide at least one client via the GatherContentfulClientList.'
    );
  }

  const finalLimitPolicy =
    limitPolicy ||
    createLimitPolicy({
      // per https://docs.gathercontent.com/reference/rate-limiting
      // there is a rate limit of 250 requests every 15 seconds.
      throttle: {
        limit: 250,
        interval: 15000,
      },
    });

  if (useBatching) {
    return createBatchEnhancer({
      handleBatch: async (queuedTasks) => {
        // We need to group queuedTasks by source, then we can batch requests per source.
        const taskGroups = queuedTasks.reduce<
          Record<string, { client: GatherContentClient; tasks: Array<typeof queuedTasks[0]> }>
        >((result, queuedTask) => {
          const { parameter, parameterName, component, context } = queuedTask.args;
          const paramValue = parameter.value;

          // An empty value means we should ignore the task
          if (!isParameterValueDefined(paramValue)) {
            return result;
          }

          const client = resolveClientForParameter({
            // note: we can non-null assert paramValue because of the `isParameterValueDefined` check above.
            parameterValue: paramValue!,
            parameterName,
            clients,
            component,
            context,
          });

          // note: we can non-null assert paramValue because of the `isParameterValueDefined` check above.
          const { source = 'default' } = paramValue!;

          // If the source for the current task is already a group, then add the task to the group.
          // Otherwise, start a new group for the source.
          if (result[source] && Array.isArray(result[source].tasks)) {
            result[source].tasks.push(queuedTask);
          } else {
            result[source] = {
              client,
              tasks: [queuedTask],
            };
          }

          return result;
        }, {});

        try {
          console.time('fetch all gathercontent items');
          // Iterate over each group, identify the itemIds to fetch for each group, then get to fetchin'.
          for await (const [sourceKey, taskGroup] of Object.entries(taskGroups)) {
            const { context, component } = taskGroup.tasks[0].args;

            // create a UniqueBatchEntries object from the provided tasks.
            // Each task represents a parameter within a component and the task is essentially responsible for
            // resolving a value for a parameter.
            // A `UniqueBatchEntries` object creates a "group" for each task and assigns a unique key for the task.
            // For the GatherContent item selector parameter, we use the parameter value as a unique key.
            // However, the GatherContent item selector allows you to select multiple items. So, we have to handle scenarios
            // where the item selector parameter value has more than one item id in its value.
            // Therefore, we use the String.join method to create a unique key for the GatherContent item selector parameter.
            // This behavior complicates things a bit when we're resolving the value for each task/parameter - and how
            // we handle that is explained in comments further below.
            const uniqueBatchEntries = new UniqueBatchEntries(
              taskGroup.tasks,
              // We can non-null assert `value` because we've already done null/undefined-checking when
              // grouping the tasks.
              (task) => task.parameter.value!.itemIds.join('|')
            );

            // Once we have our tasks/parameters grouped, we can use `flatMap` to construct a single array
            // of item ids to retrieve. This allows us to make one call to GatherContent for all of the
            // items referenced in all GatherContent item selector parameters in a composition.
            const idsToResolve = Object.keys(uniqueBatchEntries.groups).flatMap((ids) => {
              return ids.split('|').map((id) => Number(id));
            });

            const defaultQueryOptions: AddGatherContentBatchQueryOptions['defaultBatchQueryOptions'] = {
              item_id: idsToResolve,
              include_content: true,
            };

            const resolvedQueryOptions =
              addBatchQueryOptions?.({
                defaultBatchQueryOptions: defaultQueryOptions,
                context,
                component,
              }) ?? defaultQueryOptions;

            console.time(`fetch gathercontent items ${sourceKey}`);
            try {
              const itemsResult = await taskGroup.client.getItems(resolvedQueryOptions);

              // As mentioned above, the tasks for each parameter are uniquely identified by a string (group) key.
              // Some keys may be the result of a joined array, i.e. String.join('|')
              // However, when we fetch all of the identified items from GatherContent, we receive all of the items
              // in a singular array and don't know which group(s) an item belongs to.
              // Therefore, we need to organize all of the fetched items back into their respective task groups
              // so that each Canvas parameter receives only the correct item/items referenced in the parameter value.

              // To do so, we first create a map of item ids to their respective group keys (this may seem a bit
              // extra, but reduces the amount of nested looping for large amounts of items). We'll end up with something like:
              // { 100: ['groupKey1', 'groupKey2'] }

              // We then create another map - this one containing group keys to items:
              // { 'groupKey1': [Item1, Item2] }
              // Then we can iterate over all of the items fetched from GatherContent and use each item id to lookup
              // the group key(s) for each item. We then add each item to its respective group key(s) in the groupKey:Item map.

              // Finally, we can iterate over the groupKey:Item map and resolve all of the UniqueBatchEntries tasks with the
              // proper GatherContent items for each group key.

              // Note: items may belong to more than one group/parameter, which is why the value of `idToGroupKeyMap` is a string array.
              const idToGroupKeyMap: Record<number, string[]> = {};

              Object.keys(uniqueBatchEntries.groups).forEach((groupKey) => {
                const itemIdsInGroup = groupKey.split('|').map((id) => Number(id));
                itemIdsInGroup.forEach((id) => {
                  (idToGroupKeyMap[id] = idToGroupKeyMap[id] || []).push(groupKey);
                });
              });

              const groupKeyValues: Record<string, Item[]> = {};

              itemsResult.items.forEach((item) => {
                const groupKeysForItem = idToGroupKeyMap[item.id];
                if (groupKeysForItem) {
                  groupKeysForItem.forEach((groupKey) => {
                    (groupKeyValues[groupKey] = groupKeyValues[groupKey] || []).push(item);
                  });
                }
              });

              Object.entries(groupKeyValues).forEach(([groupKey, groupValue]) => {
                // The GatherContent Items API returns items sorted in ascending order by their respective item id.
                // The API does _not_ return items in the order we provide item ids.
                // Therefore, we sort the API results to match the order of the item ids we are requesting.
                // This ensures that items are returned in the order they are expected.
                const itemIds = groupKey.split('|');
                if (itemIds.length > 1) {
                  groupValue?.sort(
                    (a, b) => itemIds.indexOf(a.id.toString()) - itemIds.indexOf(b.id.toString())
                  );
                }

                uniqueBatchEntries.resolveKey(groupKey, groupValue);
              });

              // any remaining keys in entriesToResolve are ones that were not found in the response,
              // thus we can conclude the entry ids were invalid
              uniqueBatchEntries.resolveRemaining(null);

              // log any items that failed to be fetched
              itemsResult.failedItems?.forEach((failedItem) => {
                console.warn(
                  `Failed loading GatherContent items '${failedItem.id}' from source '${sourceKey}' referenced in component '${component.type}': ${failedItem.reason}`
                );
              });
            } finally {
              console.timeEnd(`fetch gathercontent items ${sourceKey}`);
            }
          }
          console.timeEnd('fetch all gathercontent items');
        } catch (e) {
          const message = `Failed loading GatherContent items batch (${queuedTasks.length}): ${e.message}`;
          const error = new Error(message);
          queuedTasks?.forEach((task) => task.reject(error));
        }
      },
      shouldQueue: ({ parameter }) => parameterIsGatherContentEntrySelector(parameter),
      limitPolicy: finalLimitPolicy,
    });
  } else {
    return {
      enhanceOne: async function gatherContentEnhancer({ parameter, parameterName, component, context }) {
        if (parameterIsGatherContentEntrySelector(parameter)) {
          // an empty value or entryId/source means we should ignore the param
          if (!isParameterValueDefined(parameter.value)) {
            return null;
          }

          const client = resolveClientForParameter({
            clients,
            parameterName,
            // We can non-null assert parameter.value because of the `isParameterValueDefined` check above.
            parameterValue: parameter.value!,
            component,
            context,
          });

          // We can non-null assert parameter.value because of the `isParameterValueDefined` check above.
          // We can assert `clientToUse` as non-null because of the validateEnhancerConfiguration function,
          // which is called above and will throw an error if a client instance can't be resolved
          // for a given task.
          const entryIds = parameter.value!.itemIds.map((id) => Number(id));

          const defaultQueryOptions: AddGatherContentQueryOptions['defaultQueryOptions'] = {
            item_id: entryIds,
            include_content: true,
          };

          const resolvedQueryOptions =
            addItemQueryOptions?.({
              parameter,
              parameterName,
              component,
              defaultQueryOptions,
              context,
            }) ?? defaultQueryOptions;

          try {
            console.time(`fetch gathercontent items ${entryIds}`);

            const itemsResult = await client.getItems(resolvedQueryOptions);

            // The GatherContent Items API returns items sorted in ascending order by their respective item id.
            // The API does _not_ return items in the order we provide item ids.
            // Therefore, we sort the API results to match the order of the item ids we are requesting.
            // This ensures that items are returned in the order they are expected.
            const itemIds = resolvedQueryOptions?.item_id;
            if (Array.isArray(itemIds) && itemIds.length > 0) {
              itemsResult.items.sort((a, b) => itemIds.indexOf(a.id) - itemIds.indexOf(b.id));
            }

            itemsResult.failedItems?.forEach((failedItem) => {
              console.warn(
                `Failed loading GatherContent items '${failedItem.id}' from source '${
                  parameter.value!.source ?? 'default'
                }' referenced in parameter '${parameterName}': ${failedItem.reason}`
              );
            });

            return itemsResult.items;
          } catch (e) {
            const message = `Failed loading GatherContent items '${entryIds}' from source '${
              parameter.value!.source ?? 'default'
            }' referenced in parameter '${parameterName}': ${e.message}`;

            throw new Error(message);
          } finally {
            console.timeEnd(`fetch gathercontent items ${entryIds}`);
          }
        }
      },
      limitPolicy: finalLimitPolicy,
    };
  }
}

function parameterIsGatherContentEntrySelector(
  parameter: ComponentParameter<any>
): parameter is ComponentParameter<EntrySelectorParameterValue> {
  const test = parameter as ComponentParameter<EntrySelectorParameterValue>;
  return test.type === CANVAS_GATHERCONTENT_PARAMETER_TYPES[0] && Array.isArray(test.value?.itemIds);
}

function isParameterValueDefined(value: EntrySelectorParameterValue) {
  return Array.isArray(value?.itemIds);
}

function resolveClientForParameter({
  clients,
  parameterValue,
  parameterName,
  component,
  context,
}: {
  clients: GatherContentClientList;
  parameterValue: NonNullable<EntrySelectorParameterValue>;
  parameterName: string;
  component: Readonly<ComponentInstance>;
  context: EnhancerContext;
}) {
  // Attempt to resolve the client for the parameter and throw if none could be found.
  const { source = 'default' } = parameterValue;
  const client = clients.getClient({
    source,
    isPreviewClient: context.preview,
  });

  if (!client) {
    throw new Error(
      `No GatherContent client could be resolved for source key '${source}' referenced in parameter '${parameterName} in component '${component.type}'. Ensure that the 'clients' property you are passing to the enhancer has a client instance registered for the source key.`
    );
  }

  return client;
}
