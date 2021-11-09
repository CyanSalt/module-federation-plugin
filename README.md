## module-federation-plugin

[Module federation](https://webpack.js.org/concepts/module-federation/) for webpack@4.

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
      exposes: {
        foo: './src/foo.js',
      },
      // library: {
      //   type: 'global',
      //   name: 'website-2',
      // },
      // filename: 'remoteEntry.js',
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

### No Additional Chunks

An `asyncChunkMode` option can be passed to the plugin to specify the default chunk mode of remote modules.

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('module-federation-plugin')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      // ...
      asyncChunkMode: 'eager',
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

### Static Imports

A `lazyOnce` option can be passed to the plugin to specify whether to replace the module with a synchronized one after loaded. This may be useful if you prefer static imports.

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('module-federation-plugin')

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      // ...
      lazyOnce: true,
    }),
  ],
}
```

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
