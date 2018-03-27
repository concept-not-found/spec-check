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
async function main () {
  const expected = await readFile('specification.md', 'utf8')
  const input = await Unified()
    .use(RemarkParse)
    .use(RemoveLinesAddedBySpecCheckReport)
    .use(RemarkStringify)
    .process(expected)
  await writeFile('specification-input.md', input)

  const specCheckProcess = spawn(require.resolve('./index.js'), ['--report', 'specification-report.md', 'specification-input.md'], {
    stdio: 'inherit'
  })
  const exitCode = await new Promise((resolve, reject) => {
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
  if (exitCode !== 0) {
    return
  }
  const result = await readFile('specification-report.md', 'utf8')
  if (expected !== result) {
    throw new Error('expected specification.md to be the same as specification-report.md')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
