const xxdiff = require("../../dist/xxdiff.cjs.js");

// not valid source
console.log(xxdiff.xxdiff({ a: 1 }, null));

// diff two simple object
console.log(xxdiff.xxdiff({ a: 1, c: 1 }, { a: 2, d: 1 }));

// diff two complex object
console.log(JSON.stringify(xxdiff.xxdiff({ a: 1, c: 1, e: [{a: 1}] }, { a: 2, d: 1, e: [{b: 1}] }), null, 2));