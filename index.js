#!/usr/bin/env node

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {inspect, promisify} = require('util')
const Unified = require('unified')
const RemarkParse = require('remark-parse')
const RemarkStringify = require('remark-stringify')
const Minimist = require('minimist')

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
async function flatmap (closure, array) {
  return [].concat(...await Promise.all(array.map(closure)))
}
function scopedEval (code) {
  return eval(code) // eslint-disable-line no-eval
}
function SpecCheck ({requires, errors}) {
  Object.keys(requires).forEach((name) => {
    eval(`${name} = require('${path.join(process.cwd(), requires[name])}')`) // eslint-disable-line no-eval
  })
  // transformer cannot be async due to https://github.com/unifiedjs/unified/issues/35
  return (root) => {
    return flatmap(async (node) => {
      if (!(node.type === 'code' && ['js', 'javascript'].includes(node.lang))) {
        return [node]
      }
      const lines = node.value.split('\n')
      let input
      let result
      let expected
      try {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('> ')) {
            input = lines[i].substr(2)
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
              if (output.startsWith('Resolve: ')) {
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
                  Resolve: scopedEval(output.substring('Resolve: '.length))
                }
              } else if (output.startsWith('Reject: ')) {
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
                  Reject: scopedEval(output.substring('Reject: '.length))
                }
              } else if (output.startsWith('Reject error: ')) {
                try {
                  result = {
                    Resolve: await result
                  }
                } catch (error) {
                  result = `Reject error: ${error.message}`
                }
                expected = output
              } else if (output.startsWith('Reject error code: ')) {
                try {
                  result = {
                    Resolve: await result
                  }
                } catch (error) {
                  result = `Reject error code: ${error.code}`
                }
                expected = output
              } else if (output.startsWith('Error: ')) {
                result = `Error: ${result.message}`
                expected = output
              } else if (output.startsWith('Error code: ')) {
                result = `Error code: ${result.code}`
                expected = output
              } else {
                expected = scopedEval(output)
              }
            } catch (error) {
              throw new Error(`failed to eval output \`${output}\`: ${error.message}`)
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
    }, root.children)
      .then((result) => {
        root.children = result
        return root
      })
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
