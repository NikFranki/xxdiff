/**
 * write a function called xxdiff to implement diff all properties recursively.
 */

const ADD_SIGN = 'add';
const DELETE_SIGN = 'delete';
const UPDATE_SIGN = 'update';

let globalOptions = {};
let parentKey = ''; // the key point to an array, distinguish whether use pointed order when diffing two object type array

function initConfig(
  options = {
    pointedArrayKeyDiffOrder: {},
  }
) {
  globalOptions = { ...globalOptions, ...options };
}

function isBasicType(value) {
  return !isObjectType(value) && !Array.isArray(value);
}

function isObjectType(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function isBasicTypeArray(arr) {
  return arr.every(item => isBasicType(item));
}

function isObjectTypeArray(arr) {
  return arr.length && arr.every(item => isObjectType(item));
}

function areBothObject(obj1, obj2) {
  return isObjectType(obj1) && isObjectType(obj2);
}

function areBothArray(arr1, arr2) {
  return Array.isArray(arr1) && Array.isArray(arr2);
}

// function areBothBasicTypeArray(arr1, arr2) {
//   return arr1.every(item => isBasicType(item)) && arr2.every(item => isBasicType(item));
// }

function isOneOfObjectTypeArray(arr1, arr2) {
  return isObjectTypeArray(arr1) || isObjectTypeArray(arr2);
}

function areBothObjectTypeArray(arr1, arr2) {
  return isObjectTypeArray(arr1) && isObjectTypeArray(arr2);
}

function isOneOfArray(arr1, arr2) {
  Array.isArray(arr1) || Array.isArray(arr2);
}

function isOneOfObject(arr1, arr2) {
  Array.isArray(arr1) || Array.isArray(arr2);
}

function addArrayUniqueKey(obj, uk) {
  if (Array.isArray(obj)) {
    if (isObjectTypeArray(obj)) {
      for (const item of obj) {
        addArrayUniqueKey(item, uk);
      }
    }
    return;
  }

  if (isObjectType(obj)) {
    for (const key in obj) {
      obj[key] = parseValue(obj[key]);
      if (!isBasicType(obj[key])) {
        addArrayUniqueKey(obj[key], uk);
      }
    }

    const uks = uk.split('.');
    const newKey = uk.replace(/\./, '_');
    let target = obj;
    while (uks.length) {
      target = target[uks.shift()];
      if (!target) {
        break;
      }
    }

    if (target) {
      obj[`${newKey}`] = target;
    }
  }
}

function parseValue(value) {
  // resolve the jsonstring value
  let result = null;
  try {
    result = JSON.parse(value);
  } catch (e) {
    result = value;
  }
  return result;
}

function traverseParseValue(obj) {
  if (Array.isArray(obj)) {
    if (isObjectTypeArray(obj)) {
      for (const item of obj) {
        traverseParseValue(item);
      }
    }
    return;
  }
  for (const key in obj) {
    obj[key] = parseValue(obj[key]);
    if (Array.isArray(obj[key])) {
      obj[`${key}_is_empty_array`] = obj[key].length === 0;
    }
    if (!isBasicType(obj[key])) {
      traverseParseValue(obj[key]);
    }
  }
}

function appendDiffSign(obj, key, type) {
  if (Array.isArray(globalOptions.ignoreKeys) && globalOptions.ignoreKeys.includes(key)) return;
  obj[`diff_${key}`] = type;
}

/**
 * make all the properties whenever the depth is changed
 * @param {*} obj array or object
 * @param {*} type ADD_SIGN | DELETE_SIGN
 */
function traverseChange(obj, type = DELETE_SIGN) {
  // not support array embedding array like [[bla, bla]]
  if (Array.isArray(obj)) {
    if (isBasicTypeArray(obj)) {
      for (const item of obj) {
        appendDiffSign(obj, item, type);
      }
    }
    if (isObjectTypeArray(obj)) {
      for (const item of obj) {
        traverseChange(item, type);
      }
    }
    return;
  }

  for (const key in obj) {
    appendDiffSign(obj, key, type);

    if (!isBasicType(obj[key])) {
      traverseChange(obj[key], type);
    }
  }
}

/**
 * deal with obj diff
 * @param {*} obj1
 * @param {*} obj2
 */
function diffTwoObject(obj1, obj2) {
  const recordSet = new Set();
  for (const key in obj1) {
    if (recordSet.has(key)) continue;

    recordSet.add(key);
    if (!(key in obj2)) {
      appendDiffSign(obj1, key, DELETE_SIGN);
      if (isBasicType(obj1[key])) continue;

      // TODO: traverse all the children keys of obj1, to find out its changes
      traverseChange(obj1[key], DELETE_SIGN);
    } else {
      // both are array
      if (areBothArray(obj1[key], obj2[key])) {
        parentKey = key;
        xxdiff(obj1[key], obj2[key]);
        continue;
      }
      // one of is array
      if (isOneOfArray(obj1[key], obj2[key])) {
        obj1[key] = obj1[key] || [];
        obj2[key] = obj2[key] || [];
        parentKey = key;
        xxdiff(obj1[key], obj2[key]);
        continue;
      }
      // both are object
      if (areBothObject(obj1[key], obj2[key])) {
        diffTwoObject(obj1[key], obj2[key]);
        continue;
      }
      // one of is object
      if (isOneOfObject(obj1[key], obj2[key])) {
        if (isObjectType(obj1[key])) {
          appendDiffSign(obj1, key, DELETE_SIGN);
          if (isBasicType(obj1[key])) continue;

          // TODO: traverse all the children keys of obj1, to find out its changes
          traverseChange(obj1[key], DELETE_SIGN);
        } else {
          appendDiffSign(obj2, key, ADD_SIGN);
          if (isBasicType(obj2[key])) continue;

          // TODO: traverse all the children keys of obj1, to find out its changes
          traverseChange(obj2[key], ADD_SIGN);
        }
        continue;
      }
      if (obj1[key] !== obj2[key]) {
        appendDiffSign(obj1, key, UPDATE_SIGN);
        appendDiffSign(obj2, key, UPDATE_SIGN);
      }
    }
  }

  for (const key in obj2) {
    if (recordSet.has(key)) continue;

    recordSet.add(key);
    if (!(key in obj1)) {
      appendDiffSign(obj2, key, ADD_SIGN);
      if (isBasicType(obj1[key])) continue;

      // TODO: traverse all the children keys of obj1, to find out its changes
      traverseChange(obj2[key], ADD_SIGN);
    } else {
      // both are array
      if (areBothArray(obj1[key], obj2[key])) {
        parentKey = key;
        xxdiff(obj1[key], obj2[key]);
        continue;
      }
      // one of is array
      if (isOneOfArray(obj1[key], obj2[key])) {
        obj1[key] = obj1[key] || [];
        obj2[key] = obj2[key] || [];
        parentKey = key;
        xxdiff(obj1[key], obj2[key]);
        continue;
      }
      // both are object
      if (areBothObject(obj1[key], obj2[key])) {
        diffTwoObject(obj1[key], obj2[key]);
        continue;
      }
      // one of is object
      if (isOneOfObject(obj1[key], obj2[key])) {
        if (isObjectType(obj1[key])) {
          appendDiffSign(obj1, key, DELETE_SIGN);
          if (isBasicType(obj1[key])) continue;

          // TODO: traverse all the children keys of obj1, to find out its changes
          traverseChange(obj1[key], DELETE_SIGN);
        } else {
          appendDiffSign(obj2, key, ADD_SIGN);
          if (isBasicType(obj2[key])) continue;

          // TODO: traverse all the children keys of obj1, to find out its changes
          traverseChange(obj2[key], ADD_SIGN);
        }
        continue;
      }
      if (obj1[key] !== obj2[key]) {
        appendDiffSign(obj1, key, UPDATE_SIGN);
        appendDiffSign(obj2, key, UPDATE_SIGN);
      }
    }
  }
}

/**
 * diff two arrays of object type
 * @param {*} arr1
 * @param {*} arr2
 * @param {*} order order by main key in object type array
 * {
 *  detail: 'id',
 * }
 * @returns
 */
function diffBothObjectTypeArray(
  arr1,
  arr2,
  order = globalOptions.pointedArrayKeyDiffOrder || {}
) {
  // must the same data structure's object
  let pointedMainKey;
  for (const key in order) {
    if (parentKey === key && order[key] in arr1[0]) {
      pointedMainKey = order[key];
      break;
    }
  }

  // diff by pointed order
  if (pointedMainKey) {
    // alternative find out what their difference are and diff
    const map1 = arr1.reduce((acc, item) => {
      acc[item[pointedMainKey]] = item;
      return acc;
    }, {});

    const map2 = arr2.reduce((acc, item) => {
      acc[item[pointedMainKey]] = item;
      return acc;
    }, {});

    // 1 arr1 greater than arr2 items
    const arr1GTArr2Items = Object.keys(map1).filter(key => !map2[key]).map(key => map1[key]);
    // TODO: traverse all the children keys of arr1, to find out its changes
    if (arr1GTArr2Items.length) {
      traverseChange(arr1GTArr2Items, DELETE_SIGN);
    }

    // 2 arr2 greater than arr1 items
    const arr2GTArr1Items = Object.keys(map2).filter(key => !map1[key]).map(key => map2[key]);
    // TODO: traverse all the children keys of arr1, to find out its changes
    if (arr2GTArr1Items.length) {
      traverseChange(arr2GTArr1Items, ADD_SIGN);
    }

    // 3 common items
    const arr1EQ2Items = Object.keys(map1).filter(key => map2[key]).map(key => map1[key]);
    for (const item of arr1EQ2Items) {
      diffTwoObject(map1[item[pointedMainKey]], map2[item[pointedMainKey]]);
    }

    return;
  }

  // diff by positive order(one by one)
  // arr1 diff arr2
  for (let i = 0; i < arr1.length; i++) {
    if (areBothObject(arr1[i], arr2[i])) {
      diffTwoObject(arr1[i], arr2[i]);
      continue;
    }

    // TODO: traverse all the children keys of obj1, to find out its changes
    if (isObjectType(arr1[i])) {
      traverseChange(arr1[i], DELETE_SIGN);
    }
  }

  // arr2 diff arr1
  for (let i = arr1.length; i < arr2.length; i++) {
    if (areBothObject(arr1[i], arr2[i])) {
      diffTwoObject(arr1[i], arr2[i]);
      continue;
    }

    // TODO: traverse all the children keys of obj1, to find out its changes
    if (isObjectType(arr2[i])) {
      traverseChange(arr2[i], ADD_SIGN);
    }
  }
}

function diffBothBasicTypeArray(arr1, arr2) {
  const map1 = arr1.reduce((acc, item) => {
    acc[item] = true;
    return acc;
  }, {});
  const map2 = arr2.reduce((acc, item) => {
    acc[item] = true;
    return acc;
  }, {});
  // arr1 diff arr2
  for (let i = 0; i < arr1.length; i++) {
    if (!map2[arr1[i]]) {
      appendDiffSign(arr1, arr1[i], DELETE_SIGN);
    } else if (arr1[i] !== arr2[i]) {
      appendDiffSign(arr1, arr1[i], UPDATE_SIGN);
      appendDiffSign(arr2, arr2[i], UPDATE_SIGN);
    }
  }

  // arr2 diff arr1
  for (let i = 0; i < arr2.length; i++) {
    if (!map1[arr2[i]]) {
      appendDiffSign(arr2, arr2[i], ADD_SIGN);
    } else if (arr1[i] !== arr2[i]) {
      appendDiffSign(arr1, arr1[i], UPDATE_SIGN);
      appendDiffSign(arr2, arr2[i], UPDATE_SIGN);
    }
  }
}

/**
 * deal with array diff
 * @param {*} arr1
 * @param {*} arr2
 */
function diffTwoArray(arr1, arr2) {
  // TODO: distinguish array (obj type array | basic type array), only arrow type unique, not suppoert mixed type array like [1, {}, true, null, Function, Date]
  // both are object type array
  if (areBothObjectTypeArray(arr1, arr2)) {
    diffBothObjectTypeArray(arr1, arr2);
    return;
  }

  // one of is object type array
  if (isOneOfObjectTypeArray(arr1, arr2)) {
    // TODO: traverse all the children keys of arr1, to find out its changes
    traverseChange(arr1, DELETE_SIGN);
    // TODO: traverse all the children keys of arr2, to find out its changes
    traverseChange(arr2, ADD_SIGN);
    return;
  }

  // both are basic type array
  diffBothBasicTypeArray(arr1, arr2);
}

function xxdiff(obj1, obj2) {
  if (!areBothArray(obj1, obj2) && !areBothObject(obj1, obj2)) {
    console.error('Invalid input, can not diff!');
    return {
      before: obj1,
      after: obj2,
    };
  }

  if (areBothArray(obj1, obj2)) { // both are array
    diffTwoArray(obj1, obj2);
  }

  if (areBothObject(obj1, obj2)) { // both are object
    diffTwoObject(obj1, obj2);
  }

  return {
    before: obj1,
    after: obj2,
  };
}

export default {
  traverseParseValue,
  initConfig,
  addArrayUniqueKey,
  xxdiff,
};

