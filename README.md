[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Dependency Status][deps-image]][deps-url]
[![license: MIT][license-badge]][license-url]

# @pirxpilot/metalsmith-esbuild

Fork of [@metalsmith/js-bundle] without ES5 support.

A metalsmith plugin that bundles your JS using [esbuild](https://esbuild.github.io) with sensible defaults.

## Features

- Supports most ESbuild options including custom loaders and plugins

## Installation

NPM:

```
npm install @pirxpilot/metalsmith-esbuild
```

Yarn:

```
yarn add @pirxpilot/metalsmith-esbuild
```

## Usage

Pass `@pirxpilot/metalsmith-esbuild` to `metalsmith.use` :

```js
const jsBundle = require('@pirxpilot/metalsmith-esbuild')

metalsmith.use(
  jsBundle({
    // defaults
    entries: {
      index: 'lib/index.js'
    }
  })
)

const isProd = metalsmith.env('NODE_ENV') !== 'development'
metalsmith.use(
  jsBundle({
    // explicit defaults
    bundle: true,
    minify: isProd,
    sourcemap: !isProd,
    platform: 'browser',
    target: 'es6',
    assetNames: '[dir]/[name]',
    // accessible as process.env.<NAME> in your JS files
    define: metalsmith.env(),
    // removes console & debugger statements
    drop: isProd ? ['console', 'debugger'] : [],
    entries: {
      index: 'lib/index.js'
    }
  })
)
```

The paths in the `entries` option should be relative to `metalsmith.directory()`.

### Options

`@pirxpilot/metalsmith-esbuild` provides access to most underlying [esbuild options](https://esbuild.github.io/api/#build-api), with a few notable differences:

The options `absWorkingDir` (=`metalsmith.directory()`), `outdir` (=`metalsmith.destination()`), `write` (=`false`), and `metafile` (=`true`) can not be set, they are determined by the plugin.

The option `entryPoints` is renamed to `entries`. Specify `entries` as a `{'target': 'path/to/source.js' }`} object, and mind that the target _should not have an extension_.

The option `define` is automatically filled with with `metalsmith.env()`, but can be overwritten if desired. `metalsmith.env('DEBUG')` would be accessible in the bundle as `process.env.DEBUG`.

### Loading assets

You can load assets with any of the [ESbuild loaders](https://esbuild.github.io/content-types/) by specifying a loader map. By default there is support for `.js`,`.ts`,`.css`,`.json`,`.jsx`,`.tsx`, and `.txt` loading. It's important to note 2 things:

- assets loaded with any loader but the `file` loader will be "embedded" in the resulting JS bundle and removed from the build (=not available for other plugins), increasing bundle size.
- if you would like to process assets loaded with the `file` loader with other metalsmith plugins (eg [metalsmith-imagemin](https://github.com/ahmadnassri/metalsmith-imagemin))
  `@pirxpilot/metalsmith-esbuild` needs to be _run first_ and you should not overwrite the default [`assetNames` option](https://esbuild.github.io/api/#asset-names) `[dir]/[name]`.

The [file loader](https://esbuild.github.io/content-types/#external-file) is the loader you need for most large asset types you wouldn't want to bloat your JS bundle with.
If you want to use inline SVG's, you would set its loader to `text`, while if you prefer loading them in image tags, you could set them to `dataurl` (embedded) or `file` (external).

The [`publicPath` option](https://esbuild.github.io/api/#public-path) will prepend a path to each asset loaded with the `file` loader. This can be useful if you are serving the metalsmith build from a non-root URI.

```js
metalsmith.use(
  jsbundle({
    entries: { index: 'src/index.js' },
    loader: {
      '.png': 'file',
      '.svg': 'dataurl',
      '.jpg': 'file', // this will be a relative URI
      '.yaml': 'text' // this will be a parseable string
    },
    publicPath: metalsmith.env('NODE_ENV') === 'development' ? '' : 'https://johndoe.com'
  })
)
```

### Debug

To enable debug logs, set `metalsmith.env('DEBUG', '@pirxpilot/metalsmith-esbuild*')` or in `metalsmith.json`: `"env": { "DEBUG": "@pirxpilot/metalsmith-esbuild*" }`.
You can also pass the live environment variable by running `metalsmith.env('DEBUG', process.env.DEBUG)` or in `metalsmith.json`: `"env": { "DEBUG": "$DEBUG" }`

Alternatively you can set `DEBUG` to `@metalsmith/*` to debug all Metalsmith core plugins.

### CLI usage

To use this plugin with the Metalsmith CLI, add `@pirxpilot/metalsmith-esbuild` to the `plugins` key in your `metalsmith.json` file:

```json
{
  "plugins": [
    {
      "@pirxpilot/metalsmith-esbuild": {
        "entries": {
          "app": "lib/main.js"
        }
      }
    }
  ]
}
```

## License

[MIT](LICENSE)

[@metalsmith/js-bundle]: https://npmjs.org/package/@metalsmith/js-bundle
[license-badge]: https://img.shields.io/github/license/metalsmith/js-bundle
[license-url]: LICENSE
[npm-image]: https://img.shields.io/npm/v/@pirxpilot/metalsmith-esbuild
[npm-url]: https://npmjs.org/package/@pirxpilot/metalsmith-esbuild
[build-url]: https://github.com/pirxpilot/metalsmith-esbuild/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/workflow/status/pirxpilot/metalsmith-esbuild/check
[deps-image]: https://img.shields.io/librariesio/release/npm/@pirxpilot/metalsmith-esbuild
[deps-url]: https://libraries.io/npm/@pirxpilot%2Fmetalsmith-esbuild
