# xxdiff

xxdiff is a light toolkit to diff two object

Support

1. [x] diff simple object
2. [x] diff simple array
3. [x] diff object in array
4. [x] diff complex object
5. [x] diff complex array

Result

```js
// use xxdiff
import xxdiff from 'xxdiff'

const { diff } = new xxdiff()
diff({ a: 1, c: 1, e: [{a: 1}] }, { a: 2, d: 1, e: [{b: 1}] })

// diff result
{
  "before": {
    "a": 1,
    "c": 1,
    "e": [
      {
        "a": 1,
        "diff_a": "delete",
        "diff_b": "delete"
      }
    ],
    "diff_c": "delete",
    "diff_d": "delete",
    "diff_a": "update",
    "diff_e": "update"
  },
  "after": {
    "a": 2,
    "d": 1,
    "e": [
      {
        "b": 1,
        "diff_a": "add",
        "diff_b": "add"
      }
    ],
    "diff_c": "add",
    "diff_d": "add",
    "diff_a": "update",
    "diff_e": "update"
  }
}
```
