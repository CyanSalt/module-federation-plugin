## module-federation-plugin

[Module federation](https://webpack.js.org/concepts/module-federation/) for webpack@4.

This project is forked from [alibaba/module-federation4](https://github.com/alibaba/module-federation4).

**WARNING: This package is not yet stable and implements only a very limited number of features in the standard module federation. Please take special care before using it in a production environment.**

## Usage

```shell
npm install --save-dev module-federation-plugin
```

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

## Import module from remote

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
    }),
  ],
}
```

Add the manifest file in your HTML

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

Then use dynamic import

```jsx
import('@website-2/foo')
  .then(({ xyz }) => {
    // ...
  })
```
