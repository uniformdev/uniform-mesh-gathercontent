# Location configuration in Uniform

Add an external integration in the Uniform dashboard and use the following for the `Location Configuration` field:
```
{
  "baseLocationUrl": "http://localhost:4020",
  "locations": {
    "install": {
      "description": [
        "GatherContent + Uniform Mesh"
      ]
    },
    "settings": {
      "url": "/settings"
    },
    "canvas": {
      "parameterTypes": [
        {
          "type": "gathercontent-items",
          "editorUrl": "/canvas-item-selector-editor",
          "displayName": "GatherContent Items",
          "configureUrl": "/canvas-item-selector-config"
        }
      ]
    }
  }
}
```
