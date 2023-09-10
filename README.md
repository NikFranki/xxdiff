# xxdiff

xxdiff is a light tooltip to diff JSON

Support

1. [x] diff simple json
2. [x] diff simple array
3. [x] diff object in array
4. [x] diff complex object
5. [x] diff complex array

Keywords

- diff
- JSON
- light
- fast
- simple
- compatable

Display

```js
// use xxdiff
const xxdiff = require("xxdiff");
xxdiff.xxdiff({ a: 1, c: 1, e: [{a: 1}] }, { a: 2, d: 1, e: [{b: 1}] })

// result
{
  "before": {
    "a": 1,
    "c": 1,
    "e": [
      {
        "a": 1,
        "diff_a": "delete"
      }
    ],
    "diff_a": "update",
    "diff_c": "delete"
  },
  "after": {
    "a": 2,
    "d": 1,
    "e": [
      {
        "b": 1,
        "diff_b": "add"
      }
    ],
    "diff_a": "update",
    "diff_d": "add"
  }
}
```
