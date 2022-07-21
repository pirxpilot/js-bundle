/* eslint-env node, mocha */

const assert = require('assert')
const equals = require('assert-dir-equal')
const Metalsmith = require('metalsmith')
const plugin = require('..')

const updateSnapshots = process.argv.indexOf('--updateSnapshots') > 1

function fixture(p) {
  return require('path').resolve(__dirname, 'fixtures', p)
}

function initUnitTestSnapshots(destination) {
  return async function unitTesting(files, metalsmith) {
    const cloned = Object.entries(files).reduce((all, [key, value]) => {
      all[key] = Object.assign({}, value)
      return all
    }, {})
    const cachedDest = metalsmith.destination()
    const cachedClean = metalsmith.clean()
    try {
      const results = metalsmith
        .destination(destination)
        .clean(true)
        .run(
          cloned,
          metalsmith.plugins.filter((x) => x !== unitTesting)
        )
      return metalsmith.write(results)
    } finally {
      metalsmith.destination(cachedDest).clean(cachedClean)
    }
  }
}
const testcases = [
  {
    name: 'should not crash the metalsmith build when using default options',
    dir: 'default'
  },
  {
    name: 'should do simple bundling',
    dir: 'basic',
    options: {
      entries: { index: 'index.js' }
    }
  },
  {
    name: 'should support built-in loaders',
    dir: 'built-in-loaders',
    options: {
      entries: { index: 'index.js' },
      loader: {
        '.png': 'dataurl',
        '.svg': 'text',
        '.jpg': 'file'
      }
    }
  },
  {
    name: 'should support compiling in-source files',
    dir: 'in-source',
    options: {
      entries: { index: './src/index.js' },
      loader: {
        '.png': 'file',
        '.svg': 'file',
        '.jpg': 'file',
        '.css': 'file'
      },
      assetNames: '[dir]/[name]'
    }
  }
  // @TODO: add testcase for React/JSX
  // @TODO: add testcase for Typescript
]

describe('@metalsmith/js-bundle', function () {
  it('should export a named plugin function', function () {
    assert.strictEqual(plugin().name, 'jsBundle')
  })

  testcases.forEach(({ name, dir, options }) => {
    it(name, async function () {
      const ms = Metalsmith(fixture(dir)).env('DEBUG', process.env.DEBUG).use(plugin(options))

      if (updateSnapshots) {
        ms.use(initUnitTestSnapshots('expected'))
      }

      await ms.build()
      equals(fixture(`${dir}/build`), fixture(`${dir}/expected`))
    })
  })
})
