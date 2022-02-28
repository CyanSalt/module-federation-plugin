## module-federation-plugin

[Module federation](https://webpack.js.org/concepts/module-federation/) for `webpack@4`.

This project is forked from [alibaba/module-federation4](https://github.com/alibaba/module-federation4).

**WARNING: This package is not yet stable and implements only a very limited number of features in the standard module federation. Please take special care before using it in a production environment.**

## Usage

```shell
npm install --save-dev module-federation-plugin
```

### Expose modules in containers

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('module-federation-plugin')

module.exports = {
  output: {
    publicPath: 'http://localhost:3002/',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'website-2',
      filename: 'remoteEntry.js',
      exposes: {
        foo: './src/foo.js',
      },
      // library: {
      //   type: 'var',
      //   name: 'website-2',
      // },
    }),
  ],
}
```

### Import modules from remote containers

You can use the shortcut syntax in webpack v5.

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('module-federation-plugin')

module.exports = {
  output: {
    publicPath: 'http://localhost:3001/',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'website-1',
      remotes: {
        '@website-2': 'website-2@http://localhost:3002/',
      },
      // remoteType: 'script',
    }),
  ],
}
```

Or you can reference the container entry file in the HTML entry manually.

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('module-federation-plugin')

module.exports = {
  output: {
    publicPath: 'http://localhost:3001/',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'website-1',
      remotes: {
        '@website-2': 'website-2',
      },
      remoteType: 'global',
    }),
  ],
}
```

```html
<html>
  <head>
    <script src="http://localhost:3002/remoteEntry.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

You can use the `import()` call to reference these modules.

```js
import('@website-2/foo')
  .then(({ xyz }) => {
    // ...
  })
```

## Additional Features

In addition to the module federation itself, this plugin also provides the `additionalFeatures` option to support some additional features.

### No Additional Chunks

An `asyncChunkMode` option can be passed to the plugin to specify the default chunk mode of remote modules.

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('module-federation-plugin')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      // ...
      additionalFeatures: {
        asyncChunkMode: 'eager',
      },
    }),
  ],
}
```

```js
// In this case the following code
import('@website-2/foo')

// will be equivalent to
import(/* webpackMode: 'eager' */'@website-2/foo')

// which will not create extra asynchronous chunks
```

### No Static Imports

By default, an asynchronous module will be replaced with a synchronous one after loaded. This may be useful if you prefer static imports.

```js
// In the entry file
import('@website-2/foo').then(() => import(/* webpackMode: 'eager' */'/path/to/the-real-entry-file'))

// OR
// import('@website-2/foo').then(() => require('/path/to/the-real-entry-file'))
```

```js
// In the real entry file
import { MyComponent } from '@website-2/foo';
```

A `keepAsync` option can be passed to the plugin if you wish to disable the feature.

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('module-federation-plugin')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      // ...
      additionalFeatures: {
        keepAsync: true,
      },
    }),
  ],
}
```

## Migrate to `webpack>=5`

Simply perform the following steps in sequence:

1. Modify the import path of the plugin.

```diff
+ const { ModuleFederationPlugin } = require('webpack').container
- const { ModuleFederationPlugin } = require('module-federation-plugin')
```

2. Remove the `additionalFeatures` option and modify the code that depends on these features.

```diff
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      // ...
-     additionalFeatures: {/* ... */},
    }),
  ],
}
```

3. Run and test to confirm that the relevant functions are working properly.
