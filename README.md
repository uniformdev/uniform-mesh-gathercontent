# GatherContent + Uniform Mesh

GatherContent app built with Uniform Mesh SDK.

## Mesh App (`/mesh-app`)

### Development

In development the app can be served from `localhost` via:

```
cd mesh-app
npm i
npm run dev
```

### Location config

Use the following location configuration to create a private integration:

```
{
  "baseLocationUrl": "http://localhost:4020",
  "locations": {
    "canvas": {
      "parameterTypes": [
        {
          "type": "gathercontent-items",
          "editorUrl": "/canvas-item-selector-editor",
          "displayName": "GatherContent Items",
          "configureUrl": "/canvas-item-selector-config"
        }
      ]
    },
    "install": {
      "description": [
        "Integrating Uniform with GatherContent allows business users to have complete control over presentation layer compositions - assembled from existing items in GatherContent - without losing the freedom and flexibility of a headless architecture.",
        "Uniform allows business users to personalize and A/B test content sourced from GatherContent without developer effort."
      ]
    },
    "settings": {
      "url": "/settings"
    }
  }
}
```

## Sample App (`/sample-app`)

### Development

A sample Uniform Canvas app with a GatherContent enhancer can be found in `sample-app/`.

Copy `.env.example` to `.env` and set env variables to hold details of your Uniform and GatherContent projects.

To run the app:

```
cd sample-app
npm i
npm run dev
```

### Enhancer

`lib/enhancers.ts` exports a GatherContent enhancer. The enhancer is capable of batched fetching to minimize the number of API requests.
