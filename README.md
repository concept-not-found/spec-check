# `spec-check`
Specification check for specifications written in [Markdown][2] for [Node.js][1] libraries.

Why write a specification, then regurgitate it back into a test? `spec-check` allows one to write _executable specification_. Author the specificiation in Markdown with `` ```js `` or `` ```javascript `` code blocks and `spec-check` will execute the code blocks against an implementations to ensure it works as intended.

## [`left-pad`][3] example
Let's say we implement `leftPad` in `index.js` and write `specification.md` as
````
## `leftPad(string, length, pad = ' ')`
**when string is shorter than length, add pad on left until string reaches length**
```js
> leftPad('foo', 5)
"  foo"
```

**when string is longer or equal to length, do nothing**
```js
> leftPad('foobar', 6)
"foobar"
```

**when optional pad is provided, use it instead of space**
```js
> leftPad(1, 2, '0')
"01"
```

**when pad is not a string, it will be converted to a string**
```js
> leftPad(17, 5, 0)
"00017"
```
````
We can check `index.js` against `specification.md` using `spec-check leftPad=index.js specification.md`.

`spec-check` will load `index.js` as the variable `leftPad` for the scope of the test. `spec-check` then executes all the `` ```js `` code blocks. Think of each code block as the Node.js CLI, each `>` is input that is `eval` and the output is on the next line. `spec-check` executes the `>` lines and checks the output matches expected output in the document.

## Installation
`npm install --save-dev spec-check`

## Usage
Edit `package.json` `scripts.test` to be `spec-check foo=index.js README.md`

[1]: https://nodejs.org/en/
[2]: https://en.wikipedia.org/wiki/Markdown
[3]: https://www.npmjs.com/package/left-pad
