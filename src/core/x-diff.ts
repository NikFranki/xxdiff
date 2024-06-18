import {
  type ArrayType,
  BasicArrayType,
  GlobalOptionsType,
  ObjectArrayType,
  ObjectType,
  SignType,
} from '../types';
import {
  ADD_SIGN,
  DELETE_SIGN,
  SIGN_PREFIX,
  UPDATE_SIGN,
} from './const';
import {
  areBothArray,
  areBothObject,
  areBothObjectTypeArray,
  getDifferenceSet,
  getSameSet,
  isArray,
  isBasicType,
  isBasicTypeArray,
  isObjectType,
  isObjectTypeArray,
  isOneOfArray,
  isOneOfObject,
  isOneOfObjectTypeArray,
} from './helper';

/**
 * diff two json
 * support:
 * 1. tranform as js object, parse it if has jsonstring
 * 2. ignore some keys what you don't want to diff
 * 3. sign the inner property recursively if its parent had changed
 * 4. sign the parent property recursively if its children had changed
 * 5. diff two object's property one by one and recursively
 * 6. diff two basic type arrays according positive order
 * 7. diff two basic type arrays loosely
 * 8. diff two object type arrays according positive order
 * 9. diff two object type arrays according pointed order(set chain properties to pointer diff order)
 */
class XDiff {
  globalOptions: GlobalOptionsType = {};

  constructor(initialGlobalOptions?: GlobalOptionsType) {
    this.globalOptions = {
      basicTypeArrayStrictDiff: true,
      pointedArrayKeyDiffOrder: [],
      ignoreKeys: [],
      ...initialGlobalOptions,
    };
  }

  /**
   * parse jsonstring
   * @param value jsonstring
   * @returns object | value
   */
  private parseValue = (value: string) => {
    // resolve the jsonstring value
    let result = null;
    try {
      result = JSON.parse(value);
    } catch (e) {
      result = value;
    }
    return result;
  };

  /**
   * parse the whole object
   * @param obj primitive object
   * @returns parsed object
   */
  private traverseParseValue = (obj: ArrayType | ObjectType) => {
    if (Array.isArray(obj)) {
      if (isObjectTypeArray(obj as ObjectArrayType)) {
        for (const item of obj) {
          this.traverseParseValue(item);
        }
      }
      return;
    }
    for (const key in obj) {
      if (!isBasicType(obj[key])) {
        this.traverseParseValue(obj[key]);
        continue;
      }

      obj[key] = this.parseValue(obj[key]);
    }
  };

  /**
   * sign the current property as changed
   * @param obj primitive object
   * @param key changed key
   * @param type changed type ADD_SIGN | DELETE_SIGN | UPDATE_SIGN
   */
  private appendDiffSign = (obj: ObjectType, key: string, type: SignType) => {
    obj[`${SIGN_PREFIX}_${key}`] = type;
  };

  /**
   * sign all sub-properties corresponding to the current property
   * @param {*} obj array or object
   * @param {*} type ADD_SIGN | DELETE_SIGN
   */
  private signItsChildren = (obj: ArrayType | ObjectType, type: SignType) => {
    if (!(isArray(obj as ArrayType) || isObjectType(obj))) return;

    if (Array.isArray(obj)) {
      if (isBasicTypeArray(obj as BasicArrayType)) {
        for (const item of obj) {
          this.appendDiffSign(obj, item, type);
        }
      }
      if (isObjectTypeArray(obj as ObjectArrayType)) {
        for (const item of obj) {
          this.signItsChildren(item, type);
        }
      }
      return;
    }

    for (const key in obj) {
      this.appendDiffSign(obj, key, type);

      if (!isBasicType(obj[key])) {
        this.signItsChildren(obj[key], type);
      }
    }
  };

  /**
   * sign all parent attributes corresponding to the current attribute
   * @param parentNodeCollector recorded parent nodes eg: [[beforeObject, afterObject, key], ...]
   */
  private signItsParentNode = (parentNodeCollector: [ObjectType, ObjectType, string][]) => {
    for (const parent of parentNodeCollector) {
      const [beforeObject, afterObject, key] = parent;
      // don't need to sign its parent node if its parent node has signed
      if (!beforeObject[`${SIGN_PREFIX}_${key}`]) {
        this.appendDiffSign(beforeObject, key, UPDATE_SIGN);
      }
      if (!afterObject[`${SIGN_PREFIX}_${key}`]) {
        this.appendDiffSign(afterObject, key, UPDATE_SIGN);
      }
    }
  };

  /**
   * sign the current attribute if the values of the two objects are not equal
   * @param obj1 the first object
   * @param obj2 the second object
   * @param key current key
   * @param parentNodeCollector recorded parent nodes eg: [[beforeObject, afterObject, key], ...]
   */
  private signDifferentEntity = ({
    obj1,
    obj2,
    key,
    parentNodeCollector,
  }: ObjectType) => {
    this.appendDiffSign(obj1, key, DELETE_SIGN);
    this.appendDiffSign(obj2, key, ADD_SIGN);
    this.signItsParentNode(parentNodeCollector);

    this.signItsChildren(obj1[key], DELETE_SIGN);
    this.signItsChildren(obj2[key], ADD_SIGN);
  };

  /**
   * diff two object indeed
   * @param {*} obj1
   * @param {*} obj2
   */
  private diffTwoObject = (
    obj1: ObjectType,
    obj2: ObjectType,
    parentNodeCollector: [ObjectType, ObjectType, string][] = [],
  ) => {
    const set1 = new Set(Object.keys(obj1).filter(key => !this.globalOptions.ignoreKeys?.includes(key)));
    const set2 = new Set(Object.keys(obj2).filter(key => !this.globalOptions.ignoreKeys?.includes(key)));

    // find out the keys in obj1 but not in obj2
    const obj1ExcludeObj2Set = getDifferenceSet(set1, set2);
    // patch the diff to obj1
    for (const key of obj1ExcludeObj2Set) {
      this.signDifferentEntity({
        obj1,
        obj2,
        key,
        parentNodeCollector,
      });
    }

    // find out the keys in obj2 but not in obj1
    const obj2ExcludeObj1Set = getDifferenceSet(set2, set1);
    // patch the diff to obj2
    for (const key of obj2ExcludeObj1Set) {
      this.signDifferentEntity({
        obj1,
        obj2,
        key,
        parentNodeCollector,
      });
    }

    // find out the common keys between obj1 and obj2
    const commonKeys = getSameSet(set1, set2);
    // patch the diff to obj1 and obj2
    for (const key of commonKeys) {
      // both are array
      if (areBothArray(obj1[key], obj2[key])) {
        this.diffTwoArray(obj1[key], obj2[key], [...parentNodeCollector, [obj1, obj2, key]]);
        continue;
      }
      // both are object
      if (areBothObject(obj1[key], obj2[key])) {
        this.diffTwoObject(obj1[key], obj2[key], [...parentNodeCollector, [obj1, obj2, key]]);
        continue;
      }
      // one of is array or one of is object
      if (isOneOfArray(obj1[key], obj2[key]) || isOneOfObject(obj1[key], obj2[key])) {
        this.signDifferentEntity({
          obj1,
          obj2,
          key,
          parentNodeCollector,
        });
        continue;
      }
      // both are basic type
      if (obj1[key] !== obj2[key]) {
        this.appendDiffSign(obj1, key, UPDATE_SIGN);
        this.appendDiffSign(obj2, key, UPDATE_SIGN);
        this.signItsParentNode(parentNodeCollector);
      }
    }
  };

  /**
   * diff two object type arrays
   * @param {*} arr1 the first array
   * @param {*} arr2 the second array
   * @param {*} parentNodeCollector recorded parent nodes eg: [[beforeObject, afterObject, key], ...]
   * @returns
   */
  private diffBothObjectTypeArray = (
    arr1: ObjectArrayType,
    arr2: ObjectArrayType,
    parentNodeCollector: [ObjectType, ObjectType, string][] = [],
  ) => {
    // must be the same data structure's object
    let pointedPrimaryKey = '';
    const prefixKey = parentNodeCollector.reduce((acc, parent) => {
      const [beforeObject, _, key] = parent;
      if (typeof key === 'string') {
        const suffix = isArray(beforeObject[key]) ? '[{}]' : '{}';
        acc += `${acc ? '.' : ''}${key}${suffix}`;
      }
      return acc;
    }, '');
    const order = this.globalOptions.pointedArrayKeyDiffOrder;
    for (const key in arr1[0]) {
      // composedKey will be transform like: (arr[{}].id | arr[{}].arr[{}].id | arr[{}].obj{}.arr[{}].id|etc)
      const composedKey = `${prefixKey}.${key}`;
      if (order?.includes(composedKey)) {
        pointedPrimaryKey = key;
        break;
      }
    }

    // diff by pointed order
    if (pointedPrimaryKey) {
      // alternatively find out what their difference are and diff
      const map1 = arr1.reduce((acc, item) => {
        acc[item[pointedPrimaryKey]] = item;
        return acc;
      }, {});

      const map2 = arr2.reduce((acc, item) => {
        acc[item[pointedPrimaryKey]] = item;
        return acc;
      }, {});

      const set1 = new Set(Object.keys(map1));
      const set2 = new Set(Object.keys(map2));

      const commonSet = getSameSet(set1, set2);
      const arr1ExcludeArr2Set = getDifferenceSet(set1, set2);
      const arr2ExcludeArr1Set = getDifferenceSet(set2, set1);

      // arr1 exclude arr2 items
      const arr1ExcludeArr2Items = [...arr1ExcludeArr2Set].map(key => map1[key]);
      if (arr1ExcludeArr2Items.length) {
        this.signItsChildren(arr1ExcludeArr2Items, DELETE_SIGN);
      }

      // arr2 exclude arr1 items
      const arr2ExcludeArr1Items = [...arr2ExcludeArr1Set].map(key => map2[key]);
      if (arr2ExcludeArr1Items.length) {
        this.signItsChildren(arr2ExcludeArr1Items, ADD_SIGN);
      }

      // common items between arr1 and arr2
      const commonItems = [...commonSet].map(key => map1[key]);
      for (const item of commonItems) {
        this.diffTwoObject(map1[item[pointedPrimaryKey]],
          map2[item[pointedPrimaryKey]],
          [...parentNodeCollector, [map1, map2, item[pointedPrimaryKey]]]);
      }

      return;
    }

    // diff by positive order(one by one)
    const arr1GreaterThanArr2 = arr1.length > arr2.length;
    const sign = arr1GreaterThanArr2 ? DELETE_SIGN : ADD_SIGN;
    const bigerArr = arr1GreaterThanArr2 ? arr1 : arr2;

    for (let i = 0; i < bigerArr.length; i++) {
      if (areBothObject(arr1[i], arr2[i])) {
        this.diffTwoObject(arr1[i], arr2[i], [...parentNodeCollector, [arr1, arr2, `${i}`]]);
        continue;
      }

      // due to the above use continue sentence, so here add the rest parent node
      parentNodeCollector = [...parentNodeCollector, [arr1, arr2, `${i}`]];
      this.signItsParentNode(parentNodeCollector);
      this.signItsChildren(bigerArr[i], sign);
    }
  };

  /**
   * diff two basic type array
   * @param arr1 the first array
   * @param arr2 the second array
   * @param parentNodeCollector recorded parent nodes eg: [[beforeObject, afterObject, key], ...]
   */
  private diffBothBasicTypeArray = (
    arr1: BasicArrayType,
    arr2: BasicArrayType,
    parentNodeCollector: [ObjectType, ObjectType, string][] = [],
  ) => {
    if (this.globalOptions.basicTypeArrayStrictDiff) {
      // basic type array diff by positive order
      const biggerArr = arr1.length > arr2.length ? arr1 : arr2;
      for (let i = 0; i < biggerArr.length; i++) {
        const item1 = arr1[i];
        const item2 = arr2[i];
        // item1 exist and item2 doesn't exsit
        if (!!item1 && !item2) {
          this.appendDiffSign(arr1, `${i}`, DELETE_SIGN);
          this.signItsParentNode(parentNodeCollector);
          continue;
        }
        // item1 doesn't exist and item2 exsit
        if (!item1 && !!item2) {
          this.appendDiffSign(arr2, `${i}`, ADD_SIGN);
          this.signItsParentNode(parentNodeCollector);
          continue;
        }
        if (item1 !== item2) {
          parentNodeCollector = [...parentNodeCollector, [arr1, arr2, `${i}`]];
          this.signItsParentNode(parentNodeCollector);
        }
      }

      return;
    }

    // basic type array diff by loosely compare
    const set1 = new Set(arr1 as string[]);
    const set2 = new Set(arr2 as string[]);

    const arr1ExcludeArr2Set = getDifferenceSet(set1, set2);
    for (const item of arr1ExcludeArr2Set) {
      this.appendDiffSign(arr1, `${arr1.indexOf(item)}`, DELETE_SIGN);
      this.signItsParentNode(parentNodeCollector);
    }

    const arr2ExcludeArr1Set = getDifferenceSet(set2, set1);
    for (const item of arr2ExcludeArr1Set) {
      this.appendDiffSign(arr2, `${arr2.indexOf(item)}`, ADD_SIGN);
      this.signItsParentNode(parentNodeCollector);
    }
  };

  /**
   * diff two array
   * @param {*} arr1
   * @param {*} arr2
   */
  private diffTwoArray = (
    arr1: ArrayType,
    arr2: ArrayType,
    parentNodeCollector: [ObjectType, ObjectType, string][] = [],
  ) => {
    // both are object type array
    if (areBothObjectTypeArray(arr1 as ObjectArrayType, arr2 as ObjectArrayType)) {
      this.diffBothObjectTypeArray(arr1 as ObjectArrayType, arr2 as ObjectArrayType, parentNodeCollector);
      return;
    }

    // one of is object type array
    if (isOneOfObjectTypeArray(arr1 as ObjectArrayType, arr2 as ObjectArrayType)) {
      this.signItsChildren(arr1 as ObjectType, DELETE_SIGN);
      this.signItsChildren(arr2 as ObjectType, ADD_SIGN);
      return;
    }

    // both are basic type array
    this.diffBothBasicTypeArray(arr1 as BasicArrayType, arr2 as BasicArrayType, parentNodeCollector);
  };

  /**
   * diff two object
   * @param obj1 the first object
   * @param obj2 the second object
   * @returns enhanced object
   */
  public diff = (obj1: ObjectType, obj2: ObjectType) => {
    if (!areBothArray(obj1 as ArrayType, obj2 as ArrayType) && !areBothObject(obj1, obj2)) {
      return {
        before: obj1,
        after: obj2,
      };
    }

    // will change the origin data
    this.traverseParseValue(obj1); // optional
    this.traverseParseValue(obj2); // optional

    // both are array
    if (areBothArray(obj1 as ArrayType, obj2 as ArrayType)) {
      this.diffTwoArray(obj1 as ArrayType, obj2 as ArrayType);
    }

    // both are object
    if (areBothObject(obj1, obj2)) {
      this.diffTwoObject(obj1, obj2);
    }

    return {
      before: obj1,
      after: obj2,
    };
  };
}

export default XDiff;
