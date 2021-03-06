# parser specification

https://docs.google.com/drawings/d/1qdtwPuC7Izr63pw_YgeQsVBB78v3gLv8ijrnHd0o-6c/edit?usp=sharing

## a single input line
```js
> parser(['> some input'])
[{type: 'input', code: 'some input'}]
```

## a continued input line
```js
> parser(['> some', '..input'])
[{type: 'input', code: 'some\ninput'}]
```

## a single output line
```js
> parser(['some output'])
[{type: 'output', code: 'some output'}]
```

## a continued output line
```js
> parser(['some', '..output'])
[{type: 'output', code: 'some\noutput'}]
```

## a single resolve line
```js
> parser(['Resolve: some resolve'])
[{type: 'resolve', code: 'some resolve'}]
```

## a continued resolve line
```js
> parser(['Resolve: some', '..resolve'])
[{type: 'resolve', code: 'some\nresolve'}]
```

## a single reject line
```js
> parser(['Reject: some reject'])
[{type: 'reject', code: 'some reject'}]
```

## a continued reject line
```js
> parser(['Reject: some', '..reject'])
[{type: 'reject', code: 'some\nreject'}]
```

## a reject error
```js
> parser(['Reject error: some message'])
[{type: 'reject error', message: 'some message'}]
```

## cannot continue a reject error
```js
> parser(['Reject error: some', '..message'])
Error: Continuation is not supported for reject error.
```

## a reject error code
```js
> parser(['Reject error code: SOME_CODE'])
[{type: 'reject error code', errorCode: 'SOME_CODE'}]
```

## cannot continue a reject error code
```js
> parser(['Reject error code: SOME', '.._CODE'])
Error: Continuation is not supported for reject error code.
```

## an error
```js
> parser(['Error: some message'])
[{type: 'error', message: 'some message'}]
```

## cannot continue an error
```js
> parser(['Error: some', '..message'])
Error: Continuation is not supported for error.
```

## an error code
```js
> parser(['Error code: SOME_CODE'])
[{type: 'error code', errorCode: 'SOME_CODE'}]
```

## cannot continue an error code
```js
> parser(['Error code: SOME', '.._CODE'])
Error: Continuation is not supported for error code.
```

## multiple continuations
```js
> parser(['> so', '..me', '..in', '..tput'])
[{type: 'input', code: 'so\nme\nin\ntput'}]
```

## whitespace in continuation is collapsed
```js
> parser(['> some       ', '..        input'])
[{type: 'input', code: 'some\ninput'}]
```

## cannot have continuation in the first line
```js
> parser(['..please continue'])
Error: Continuation must be preceded input or expected output. Cannot start with a continuation.
```
