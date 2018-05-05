# `spec-check` specification

This is a `spec-check` report which is also an executable specification for `spec-check`. The [test](https://github.com/concept-not-found/spec-check/blob/master/test/index.js) will:

-   strip this document of ``✅ `spec-check`ed``
-   strip this document of `❌ Error: ...`
-   run `spec-check --report specification-report.md add=test/add.js specification-input.md`
-   assert the result is identical to this document

## non js/javascript code blocks

### other code blocks are ignored

    this is not a javascript code block

## js/javascript code blocks ```` ```js```` or ```` ```javascript````

### lines with `>` that eval to subsequent lines are labeled with ✅

```js
> ['Hello', 'world'].join(' ')
'Hello world'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### `>` can be continued with `...`

```js
> 'Hello ' +
..'world'
'Hello world'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### Continuations collapses all whitespace to a single newline

```js
> 'Hello ' +      
..      'world'
'Hello world'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### There can be multiple continuations

```js
> 'Hell' +
..'o ' +
..'world'
'Hello world'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### A block starting with a continuation errors

```js
..42
42
```

❌ `Error: Continuation must be preceded input or expected output. Cannot start with a continuation.`

### Expected output can be continued with `...`

```js
> 'Hello world'
'Hello ' +
..'world'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### Promise that resolve can be checked

```js
> Promise.resolve('Hello')
Resolve: 'Hello'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### Promise that resolve can be continued with `...`

```js
> Promise.resolve('Hello world')
Resolve: 'Hello ' +
..'world'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### Promise that reject a value can be checked

```js
> Promise.reject('oops')
Reject: 'oops'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### Promise that reject a value can be continued with `...`

```js
> Promise.reject('oops')
Reject: 'oops'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### Promise that are expected to resolve, but are rejected error

```js
> Promise.resolve('Hello')
Reject: 'Hello'
```

❌ `Error: Promise.resolve('Hello') => expected { Reject: 'Hello' }, but got { Resolve: 'Hello' }`

### Promise that are expected to reject, but are resolved error

```js
> Promise.reject('oops')
Resolve: 'oops'
```

❌ `Error: Promise.reject('oops') => expected { Resolve: 'oops' }, but got { Reject: 'oops' }`

### Promise that reject an error can be checked by error message

```js
> Promise.reject(new Error('oops'))
Reject error: oops
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### Promise that reject an error can be checked by error code

```js
> error = new Error('oops')
> error.code = 'ERROR_OOPS'
> Promise.reject(error)
Reject error code: ERROR_OOPS
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### requires such as `add=test/add.js` are in scope

```js
> add(1, 1)
2
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### lines that do not eval to subsequent lines are labeled with ❌

```js
> 'i hear you'
'i understand you'
```

❌ `Error: 'i hear you' => expected 'i understand you', but got 'i hear you'`

### input and output lines can be interleaved, all output lines will be checked

```js
> 'knock knock'
'knock knock'
> 'who\'s there'
'who\'s there'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### errors thrown by input lines can be checked by error message

```js
> throw new Error('oops')
Error: oops
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### errors thrown by input lines can be checked by error code

```js
> error = new Error('oops')
> error.code = 'ERROR_OOPS'
> throw error
Error code: ERROR_OOPS
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### errors thrown by output lines are rethrown

```js
> 'Everything is fine'
throw new Error('oops')
```

❌ ``Error: failed to eval output `throw new Error('oops')`: oops``

### multiple input lines can contribute to output

```js
> name = 'Bob'
> `Hi ${name}`
'Hi Bob'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### multiple input lines swallow earlier errors

```js
> throw new Error('oops')
> 'Everything is fine.'
'Everything is fine.'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### each block is not isolated from each other, be careful

```js
> name = 'Bob'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

```js
> name
undefined
```

❌ `Error: name => expected undefined, but got 'Bob'`

### missing input throws an error

```js
42
```

❌ `Error: at least one input required`

### each block finishes before the next

```js
> count = 10
> Promise.resolve().then(() => count)
Resolve: 10
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

```js
> count = 100
> Promise.resolve().then(() => count)
Resolve: 100
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed
