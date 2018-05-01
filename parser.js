module.exports = (lines) => {
  const result = []
  lines.forEach((line) => {
    if (line.startsWith('> ')) {
      result.push({
        type: 'input',
        code: line.substring('> '.length)
      })
    } else if (line.startsWith('Resolve: ')) {
      result.push({
        type: 'resolve',
        code: line.substring('Resolve: '.length)
      })
    } else if (line.startsWith('Reject: ')) {
      result.push({
        type: 'reject',
        code: line.substring('Reject: '.length)
      })
    } else if (line.startsWith('Reject error: ')) {
      result.push({
        type: 'reject error',
        message: line.substring('Reject error: '.length)
      })
    } else if (line.startsWith('Reject error code: ')) {
      result.push({
        type: 'reject error code',
        errorCode: line.substring('Reject error code: '.length)
      })
    } else if (line.startsWith('Error: ')) {
      result.push({
        type: 'error',
        message: line.substring('Error: '.length)
      })
    } else if (line.startsWith('Error code: ')) {
      result.push({
        type: 'error code',
        errorCode: line.substring('Error code: '.length)
      })
    } else if (line.startsWith('... ')) {
      if (result.length === 0) {
        throw new Error('Continuation must be preceded input or expected output. Cannot start with a continuation.')
      }
      const {type, code} = result[result.length - 1]
      if (['reject error', 'reject error code', 'error', 'error code'].includes(type)) {
        throw new Error(`Continuation is not supported for ${type}.`)
      }
      result[result.length - 1].code = `${code.trim()} ${line.substring('... '.length).trim()}`
    } else {
      result.push({
        type: 'output',
        code: line
      })
    }
  })
  return result
}
