# GatherContent Mesh integration

### Contains:

- client demo site (see `/client-site`)
- mesh SDK app (see `/mesh-app`)
- GatherContent cms (see `/GatherContent-cms`)

# Production installation

Add an external integration in the Uniform dashboard and use the following for the `Location Configuration` field:

```
{
  "locations": {
    "canvas": {
      "parameterTypes": [
        {
          "type": "gather-content-content",
          "editorUrl": "/parameter-editor",
          "displayName": "gather-content Content",
          "configureUrl": "/parameter-config"
        }
      ]
    },
    "install": {
      "description": [
        "GatherContent CMS"
      ]
    },
    "settings": {
      "url": "/settings"
    }
  },
  "baseLocationUrl": "http://localhost:3000"
}
```

- Badge Icon Url: `https://gather-content-mesh-integration.netlify.app/GatherContent-badge.svg`
- Logo Icon Url: `https://gather-content-mesh-integration.netlify.app/GatherContent-logo.svg`

# Location configuration in Uniform

Add an external integration in the Uniform dashboard and use the following for the `Location Configuration` field:

```
{
  "locations": {
    "canvas": {
      "parameterTypes": [
        {
          "type": "gather-content-content",
          "editorUrl": "/parameter-editor",
          "displayName": "gather-content Content",
          "configureUrl": "/parameter-config"
        }
      ]
    },
    "install": {
      "description": [
        "GatherContent CMS"
      ]
    },
    "settings": {
      "url": "/settings"
    }
  },
  "baseLocationUrl": "http://localhost:3000"
}
```

- Badge Icon Url: `http://localhost:3000/gather-content-badge.svg`
- Logo Icon Url: `http://localhost:3000/gather-content-logo.svg`


# Location configuration notes

- `baseLocationUrl` is used to prefix URL paths for specific locations. For instance, the `settings.url` property in the JSON above is `/settings`. When that location loads, the resolved URL will be `http://localhost:3000/settings`

- `locations` contains configuration data for each location where the integration may appear.
  - `install` is the `Project Settings > Integrations` page in the Uniform dashboard. The `install.description` property can be used to provide descriptive text that will be rendered when a user adds an integration.
  - `settings` is the integration-specific settings page that is available after an integration has been added. Typically this is where an integration is configured by adding API keys and other information for connecting to the 3rd party API.
  - `canvas` contains Canvas parameter type definitions. `type` and `displayName` are used when identifying Canvas parameters in a component definition. `configureUrl` specifies the URL that will be rendered when adding a Canvas parameter to a component definition. `editorUrl` specifis the URL that will be rendered when editing a Canvas parameter within the Composition editor.

# Next.js app

> note: Next.js is _not_ required for creating a Mesh integration app, we're just using it as an example.

The idea behind a Mesh integration app is that it will serve up the UI for the locations defined in the integration configuration in Uniform dashboard.

The sample app does this by creating a page (route) corresponding to each integration location. In the `pages` folder you'll see:

- `settings.tsx`
- `parameter-config.tsx`
- `parameter-editor.tsx`

As mentioned, each page corresponds to an integration location. This works great for page-based app frameworks like Next/Nuxt. For non-page-based apps, you'll probably want to consider using a router or using querystring values to determine which integration location is being requested and which component(s) to render for a location.

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Once the app is running, you can adjust the integration configuration in Uniform dashboard to utilize your app URL for rendering locations.

# Mesh SDK

The Mesh SDK provides the mechanics for interacting with the Uniform dashboard for a given location.

## Initialization

The SDK needs to be initialized before you can access location data or save location data. The initialization process handles establishing a connection with the Uniform dashboard (via iframe / `postMessage` communication) and obtaining location-specific data from the dashboard. Once initialized, the SDK can be used to get and set location data.

Once initialized, the Mesh SDK can be accessed via the `window.UniformMeshSDK` property.

### VanillaJS

```
import { initializeUniformMeshSDK } from '@uniformdev/mesh-sdk';

if (typeof window !== 'undefined' && typeof window.UniformMeshSDK === 'undefined') {
  initializeUniformMeshSDK()
    .then((sdk) => {
      // do something with `sdk` if you want, otherwise just render your app/component
    })
    .catch((err) => {
      // there was an error during initialization
    });
}

```

### React

For React-based apps, use the `pages/_app.tsx` code as an example. We provide a React hook for straightforward initialization.

```
import type { AppProps } from 'next/app';
import { UniformMeshSdkContextProvider, useInitializeUniformMeshSdk } from '@uniformdev/mesh-sdk-react';

function App({ Component, pageProps }: AppProps) {
  const { initializing, error } = useInitializeUniformMeshSdk();

  if (error) {
    throw error;
  }

  // Some apps may want to show a splash screen while the SDK is initializing, but we render `null` for simplicity.
  return initializing ? null : (
    <UniformMeshSdkContextProvider>
      <Component {...pageProps} />
    </UniformMeshSdkContextProvider>
  );
}
```

The `UniformMeshSdkContextProvider` provides the initialized Mesh SDK instance to any Mesh SDK context consumers.

## Location data via Mesh SDK

Once initialized, you can use the Mesh SDK to get/set data for the current location. All locations currently have the same interface:

```
interface MeshLocation<TValue = unknown, TMetadata = unknown> {
  getValue: () => TValue;
  setValue: (value: TValue) => Promise<void>;
  getMetadata: () => TMetadata;
}
```

- `getValue` - returns the current location data. This is a synchronous method,
- `getMetadata` - returns the current location metadata. Metadata will contain arbitrary data for a location and may not be location-specific. For instance, metadata may contain integration configuration data from Uniform dashboard. Another example is the Canvas editor location - that location will receive Canvas parameter and component information in the `metadata` object. Also note that not all locations will have metadata. `getMetadata` is a synchronous method.
- `setValue` - sends a value for the current location to the Uniform dashboard for storage. This is an asynchronous method, so it is important to `await` the method before expecting the location value from `getValue` to be updated.

### VanillaJS

```
const location = window.UniformMeshSDK.getCurrentLocation();

// for typescript, you can provide types for the location value and location metadata:
// const location = window.UniformMeshSDK.getCurrentLocation<LocationData, LocationMetadata>();

// note: `value` and/or `metadata` may be undefined, be sure to conditionally access their properties,
// e.g. `value?.someProperty`
const locationValue = location.getValue();
const locationMetadata = location.getMetadata();

async function valueChanged(newValue) {
  await location.setValue(newValue);
  // subsequent calls to `location.getValue()` will now contain the updated value.
}

```

> IMPORTANT: if your code is going to run during server-side rendering (SSR) or static site generation (SSG), then be sure you're checking for `window` to be defined before attempting to reference the Mesh SDK. e.g.

```
if (typeof window !== 'undefined') {
  // it is safe to reference window.UniformMeshSDK here
}
```

### React

For React-based apps, use the `pages/settings.tsx`, `pages/parameter-config.tsx`, or `pages/parameter-editor.tsx` code as an example. We provide a React hook for straightforward access to the current location.

```
import { useUniformMeshLocation } from '@uniformdev/mesh-sdk-react';

export default function MyLocation() {
  // note: `value` and/or `metadata` may be undefined, be sure to conditionally access their properties,
  // e.g. `value?.someProperty`
  const { value, setValue, metadata } = useUniformMeshLocation();

  const handleChange = async (e) => {
    await setValue({ something: e.target.value });
  };

  return (
    <div>
      <input type="text" name="something" onChange={handleChange} value={value?.something || ''} />
    </div>
  );
}

```

> IMPORTANT: the `useUniformMeshLocation` hook expects to be used as a descendant of a `UniformMeshLocationContextProvider` context provider. This happens automatically for you if you use the `UniformMeshSdkContextProvider`.

#Notes

1. Select property of CmsEntrySearch component is a function that takes contentTypeId as the second parameter. So you know the content type of current selection

Here is an example how we use it:

```ecmascript 6
  const handleSelect = async (entries, contentType) => {
    await setValue({
      entries: entries.map(id => value?.entries?.find(e => e.id === id) || { id, contentType }),
    })
  }
```

2. GatherContent CMS needs the content type to be specified for fetch by ids query. To collect data of different content types we just hitting the GatherContent API several times in the loop.

Here is an example:

```ecmascript 6
  async getContentEntries({ entries }): Promise<ContentEntry[]> {
    const token = await this.login()
    // entries is an array of objects { id: string (id of entry), contentType: string (id of entry's content type) }
    // group entries by content types
    const idsByContentType = groupBy(entries, 'contentType.schema.pluralName')
    // get content types ids
    const contentTypeIds = Object.entries(idsByContentType)
    // fetch data for each content type separately
    const itemLists = await Promise.all(
      contentTypeIds.map(async ([contentTypeId, items]) => {
        const contentTypeData = items[0]?.contentType

        const query = qs.stringify(
          {
            filters: {
              id: {
                $in: idsByContentType[contentTypeId].map(e => e.cmsId),
              },
            },
          },
          {
            encodeValuesOnly: true,
          }
        )

        const url = `${this.apiHost}/api/${contentTypeId}?${query}`

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const msg = await res.text()
          throw new Error(`Error fetching '${url}': ${msg}`)
        }

        const currentResult: GetContentEntityResponse = await res.json()
        return (currentResult?.data || []).map(item => ({
          ...item,
          contentTypeId: contentTypeData?.id,
        }))
      })
    )
  
    // concat arrays of fetched data
    return itemLists.flat().map(IntegrationClient.mapContentEntity)
  }
```

3. To use the same token across multiple IFrames on the same page Session storage is used:

```ecmascript 6
  export const setToSessionStorage = (key: string, value: any) => {
    sessionStorage.setItem(key, JSON.stringify(value))
  }
  
  export const getFromSessionStorage = (key: string) => {
    const data = sessionStorage.getItem(key)
  
    try {
      return JSON.parse(data)
    } catch (e) {
      return data
    }
  }
```

4. GatherContent CMS does not have full cloud version. So it should be hosted somewhere. For demo cms was build locally and published on AWS Elastic Beanstalk. For `https` protocol AWS CloudFront distribution was created.
