## module-federation-plugin

Module federation for webpack@4

This project is forked from [alibaba/module-federation4](https://github.com/alibaba/module-federation4).

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
      library: {
        name: '$remoteEntry$website-2',
        type: 'global',
      },
      filename: 'remote-entry.js',
      exposes: {
        foo: './src/foo.js',
      },
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
      remotes: ['@website-2'],
    }),
  ],
}
```

Add the manifest file in your HTML

```html
<html>
  <head>
    <script src="http://localhost:3002/remote-entry.js"></script>
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
