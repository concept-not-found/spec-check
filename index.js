#!/usr/bin/env node

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {inspect, promisify} = require('util')
const marked = require('marked')

const readFile = promisify(fs.readFile)

function parseOptions (options) {
  const requires = {}
  let documentFilename
  options.forEach((option) => {
    if (option.includes('=')) {
      const [name, requireFilename] = option.split('=')
      requires[name] = requireFilename
    } else {
      documentFilename = option
    }
  })
  if (!documentFilename) {
    throw new Error('missing document filename')
  }
  return {
    requires,
    documentFilename
  }
}
async function main () {
  const [, , ...options] = process.argv
  const {requires, documentFilename} = parseOptions(options)
  const document = await readFile(path.join(process.cwd(), documentFilename), 'utf8')
  const tokens = marked.lexer(document, {
    gfm: true,
    tables: true,
    breaks: true
  })

  Object.keys(requires).forEach((name) => {
    eval(`${name} = require('${path.join(process.cwd(), requires[name])}')`) // eslint-disable-line no-eval
  })
  function scopedEval (code) {
    return eval(code) // eslint-disable-line no-eval
  }

  const codeBlocks = [].concat(...tokens
    .filter(({type, lang}) => type === 'code' && ['js', 'javascript'].includes(lang))
    .map(({text}) => text.split('\n')
      .reduce(({results, input}, line) => {
        if (input) {
          return {
            results: [...results, {
              input: input,
              output: line
            }]
          }
        }
        if (!line.startsWith('> ')) {
          throw new Error('expected input line start with `> `')
        }
        return {
          results,
          input: line.substr(2)
        }
      }, {
        results: []
      }).results))
  codeBlocks.forEach(({input, output}) => {
    let result
    let expected
    try {
      result = scopedEval(input)
    } catch (error) {
      if (error instanceof Error) {
        result = `Error: ${error.message}`
      } else {
        throw error
      }
    }
    try {
      if (output.startsWith('Error: ')) {
        expected = output
      } else {
        expected = scopedEval(`const expected = ${output}; expected`)
      }
    } catch (error) {
      throw new Error(`failed to eval output ${output}: ${error.message}`)
    }
    try {
      assert.deepEqual(result, expected)
    } catch (error) {
      throw new Error(`${input} => expected ${inspect(expected, false, null)}, but got ${inspect(result, false, null)}`)
    }
  })
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
