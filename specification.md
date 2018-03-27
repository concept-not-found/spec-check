# `spec-check` specification

This is a `spec-check` report which is also an executable specification for `spec-check`. The test will strip this document of ``✅ `spec-check`ed`` and `❌ Error: ...`, then run `spec-check --report specification-report.md specification-input.md`. The result should be identical to this document.

## non js/javascript code blocks

### other code blocks are ignored

    this is not a javascript code block

## js/javascript code blocks ```` ```js```` or ```` ```javascript````

### lines with `>` that eval to subsequent lines are labeled with :white_check_mark:

```js
> ['Hello', 'world'].join(' ')
'Hello world'
```

✅ [`spec-check`](https://github.com/concept-not-found/spec-check)ed

### lines that do not eval to subsequent lines are labeled with :x:

```js
> 'i hear you'
'i understand you'
```

❌ `Error: 'i hear you' => expected 'i understand you', but got 'i hear you'`
