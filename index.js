#!/usr/bin/env node

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {inspect, promisify} = require('util')
const Unified = require('unified')
const RemarkParse = require('remark-parse')
const RemarkStringify = require('remark-stringify')
const Minimist = require('minimist')

const parser = require('./parser')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

function parseOptions ({_: options, report}) {
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
    report,
    requires,
    documentFilename
  }
}
function flatten (arrays) {
  return [].concat(...arrays)
}
async function linearize (closure, array) {
  const results = []
  await array.reduce(async (previous, child) => {
    await previous
    const result = closure(child)
    results.push(result)
    return result
  }, Promise.resolve())
  return Promise.all(results)
}
function scopedEval (code) {
  return eval(code) // eslint-disable-line no-eval
}
function SpecCheck ({requires, errors}) {
  Object.keys(requires).forEach((name) => {
    eval(`${name} = require('${path.join(process.cwd(), requires[name])}')`) // eslint-disable-line no-eval
  })
  return async (root) => {
    root.children = flatten(await linearize(async (node) => {
      if (!(node.type === 'code' && ['js', 'javascript'].includes(node.lang))) {
        return [node]
      }
      const rawLines = node.value.split('\n')
      let input
      let result
      let expected
      try {
        const lines = parser(rawLines)
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].type === 'input') {
            input = lines[i].code
            try {
              result = scopedEval(input)
            } catch (error) {
              result = error
            }
          } else {
            if (i === 0) {
              throw new Error('at least one input required')
            }
            const output = lines[i]
            try {
              if (output.type === 'resolve') {
                try {
                  result = {
                    Resolve: await result
                  }
                } catch (error) {
                  result = {
                    Reject: error
                  }
                }
                expected = {
                  Resolve: scopedEval(output.code)
                }
              } else if (output.type === 'reject') {
                try {
                  result = {
                    Resolve: await result
                  }
                } catch (error) {
                  result = {
                    Reject: error
                  }
                }
                expected = {
                  Reject: scopedEval(output.code)
                }
              } else if (output.type === 'reject error') {
                try {
                  result = {
                    Resolve: await result
                  }
                } catch (error) {
                  result = `Reject error: ${error.message}`
                }
                expected = `Reject error: ${output.message}`
              } else if (output.type === 'reject error code') {
                try {
                  result = {
                    Resolve: await result
                  }
                } catch (error) {
                  result = `Reject error code: ${error.errorCode}`
                }
                expected = `Reject error code: ${output.code}`
              } else if (output.type === 'error') {
                result = `Error: ${result.message}`
                expected = `Error: ${output.message}`
              } else if (output.type === 'error code') {
                result = `Error code: ${result.code}`
                expected = `Error code: ${output.errorCode}`
              } else {
                expected = scopedEval(output.code)
              }
            } catch (error) {
              throw new Error(`failed to eval output \`${lines[i].code}\`: ${error.message}`)
            }
            try {
              assert.deepEqual(result, expected)
            } catch (error) {
              throw new Error(`${input} => expected ${inspect(expected, false, null)}, but got ${inspect(result, false, null)}`)
            }
          }
        }
        return [node, {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: '✅ '
            },
            {
              type: 'link',
              url: 'https://github.com/concept-not-found/spec-check',
              children: [
                {
                  type: 'inlineCode',
                  value: 'spec-check'
                }
              ]
            },
            {
              type: 'text',
              value: 'ed'
            }
          ]
        }]
      } catch (error) {
        errors.push({node, error})
        return [node, {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: '❌ '
            },
            {
              type: 'inlineCode',
              value: `Error: ${error.message}`
            }
          ]
        }]
      }
    }, root.children))
    return root
  }
}

async function main () {
  const [, , ...options] = process.argv
  const {report, requires, documentFilename} = parseOptions(Minimist(options))
  const document = await readFile(path.join(process.cwd(), documentFilename), 'utf8')
  const errors = []
  const processed = await Unified()
    .use(RemarkParse)
    .use(SpecCheck, {
      requires,
      errors
    })
    .use(RemarkStringify)
    .process(document)
  if (report) {
    await writeFile(report, processed)
  } else if (errors.length !== 0) {
    errors.forEach(({node, error}) => console.error(`Line ${node.position.start.line}: ${error.message}`))
    throw new Error('Errors present in specification')
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
