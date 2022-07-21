const { build } = require('esbuild')
const { relative } = require('path')

const debugNs = '@metalsmith/js-bundle'

module.exports = initJsBundle

/**
 * @typedef {import('esbuild').BuildOptions} Options
 */

/**
 * Normalize plugin options
 * @param {Options} [options]
 * @param {import('metalsmith').Metalsmith} metalsmith
 * @returns {Object}
 */
function normalizeOptions(options = {}, metalsmith, debug) {
  const entries = options.entries || {}
  const isProd = metalsmith.env('NODE_ENV') !== 'development'
  const define = Object.entries(metalsmith.env()).reduce((acc, [name, value]) => {
    // see notes at https://esbuild.github.io/api/#define, string values require explicit quotes
    acc[`process.env.${name}`] = typeof value === 'string' ? `'${value}'` : value
    return acc
  }, {})

  /** @type {Options} */
  const defaults = {
    bundle: true,
    minify: isProd,
    sourcemap: !isProd,
    platform: 'browser',
    target: 'es6',
    assetNames: '[dir]/[name]',
    drop: isProd ? ['console', 'debugger'] : []
  }

  const isFullyInSource = Object.values(entries).every((sourcepath) => {
    return metalsmith.path(sourcepath).startsWith(metalsmith.source())
  })

  /** @type {Options} */
  const overwrites = {
    entryPoints: entries,
    absWorkingDir: metalsmith.directory(),
    outdir: relative(metalsmith.directory(), metalsmith.destination()),
    write: false,
    metafile: true,
    define
  }

  if (isFullyInSource) {
    debug.info('All entries to bundle are in metalsmith.source(), setting `outbase` to metalsmith.source()')
    overwrites.outbase = metalsmith.source()
  }

  delete options.entries

  return {
    ...defaults,
    ...options,
    ...overwrites
  }
}

/**
 * A metalsmith plugin that bundles your JS using [esbuild](https://esbuild.github.io)
 *
 * @param {Options} options
 * @returns {import('metalsmith').Plugin}
 */
function initJsBundle(options = {}) {
  return async function jsBundle(files, metalsmith) {
    const debug = metalsmith.debug(debugNs)

    options = normalizeOptions(options, metalsmith, debug)
    if (Object.keys(options.entryPoints).length === 0) {
      debug.warn('No files to process, skipping.')
      return
    }

    options.entryPoints = Object.entries(options.entryPoints).reduce((mapped, current) => {
      const [dest, src] = current
      mapped[dest] = src
      return mapped
    }, {})

    debug('Running with options %O', options)
    const sourceRelPath = relative(metalsmith.directory(), metalsmith.source())

    const result = await build(options)
    debug(
      'Finished bundling %O',
      result.outputFiles.map((o) => relative(metalsmith.destination(), o.path))
    )

    // first read esbuild metafile to remove the compilation inputs from the build
    Object.values(result.metafile.outputs).forEach((o) => {
      if (o.inputs) {
        metalsmith.match(`${sourceRelPath}/**`, Object.keys(o.inputs)).forEach((input) => {
          delete files[relative(metalsmith.source(), metalsmith.path(input))]
        })
      }
    })

    result.outputFiles.forEach((file) => {
      // For in-source files, esbuild returns entries in the format 'build/src/path/to/file.ext'
      // first we strip the metalsmith.destination()
      let destPath = relative(metalsmith.destination(), file.path)

      // if the file was in-source, we strip the source path part (eg 'src') too.
      if (destPath.startsWith(sourceRelPath)) {
        destPath = relative(metalsmith.source(), metalsmith.path(destPath))
      }

      files[destPath] = {
        contents: Buffer.from(file.contents.buffer)
      }
    })
  }
}
