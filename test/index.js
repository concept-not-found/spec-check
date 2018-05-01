const {promisify} = require('util')
const fs = require('fs')
const {spawn} = require('child_process')
const Unified = require('unified')
const RemarkParse = require('remark-parse')
const RemarkStringify = require('remark-stringify')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

function RemoveLinesAddedBySpecCheckReport () {
  return (root) => {
    root.children = root.children.filter(({type, children: [{type: childType, value: childValue}] = [{}]}) =>
      !(type === 'paragraph' && childType === 'text' && ['✅ ', '❌ '].includes(childValue))
    )
    return root
  }
}

function runSpecCheck (...args) {
  const specCheckProcess = spawn(require.resolve('../index.js'), args, {
    stdio: 'inherit'
  })
  return new Promise((resolve, reject) => {
    let closed = false
    specCheckProcess.on('exit', (code, signal) => {
      if (!closed) {
        closed = true
        return resolve(code)
      }
    })
    specCheckProcess.on('error', (error) => {
      if (!closed) {
        closed = true
        return reject(error)
      }
    })
  })
}

async function assertSpecification () {
  const expected = await readFile('specification.md', 'utf8')
  const input = await Unified()
    .use(RemarkParse)
    .use(RemoveLinesAddedBySpecCheckReport)
    .use(RemarkStringify)
    .process(expected)
  await writeFile('test/specification-input.md', input)

  const exitCode = await runSpecCheck(
    '--report',
    'test/specification-report.md',
    'add=test/add.js',
    'test/specification-input.md'
  )
  if (exitCode !== 0) {
    throw new Error(`expected --report option to always exit 0, but was ${exitCode}`)
  }
  const result = await readFile('test/specification-report.md', 'utf8')
  if (expected !== result) {
    throw new Error('expected specification.md to be the same as test/specification-report.md')
  }
}

async function assertParser () {
  const exitCode = await runSpecCheck(
    'test/parser.spec.md'
  )
  if (exitCode !== 0) {
    throw new Error(`expected exit 0, but was ${exitCode}`)
  }
}

async function assertNoErrorsTest () {
  const exitCode = await runSpecCheck(
    'test/no-errors.md'
  )
  if (exitCode !== 0) {
    throw new Error(`expected exit 0, but was ${exitCode}`)
  }
}

async function assertMultipleErrorsTest () {
  const exitCode = await runSpecCheck(
    'test/multiple-errors.md'
  )
  if (exitCode === 0) {
    throw new Error(`expected exit to be not 0`)
  }
}

async function main () {
  await assertParser()
  await assertSpecification()
  await assertNoErrorsTest()
  await assertMultipleErrorsTest()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
