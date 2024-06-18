import type { ArrayType, BaiscType, BasicArrayType, ObjectArrayType, ObjectType } from '../types';

export const isObjectType = (obj: ObjectType) => {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

export const isBasicType = (value: BaiscType) => {
  return ['number', 'string', 'boolean'].includes(typeof value) || [null, undefined].includes(value as null | undefined);
};

export const isBasicTypeArray = (arr: BasicArrayType) => {
  return Array.isArray(arr) && arr.every((item) => isBasicType(item as BaiscType));
};

export const isObjectTypeArray = (arr: ObjectArrayType) => {
  return Array.isArray(arr) && arr.every(item => isObjectType(item as ObjectType));
};

export const isArray = (arr: ArrayType) => {
  return isBasicTypeArray(arr as BasicArrayType) || isObjectTypeArray(arr as ObjectArrayType);
};

export const areBothObject = (obj1: ObjectType, obj2: ObjectType) => {
  return isObjectType(obj1) && isObjectType(obj2);
};

export const areBothArray = (arr1: ArrayType, arr2: ArrayType) => {
  return Array.isArray(arr1) && Array.isArray(arr2);
};

export const isOneOfObjectTypeArray = (arr1: ObjectArrayType, arr2: ObjectArrayType) => {
  return [isObjectTypeArray(arr1), isObjectTypeArray(arr2)].filter(item => item).length === 1;
};

export const areBothObjectTypeArray = (arr1: ObjectArrayType, arr2: ObjectArrayType) => {
  return isObjectTypeArray(arr1) && isObjectTypeArray(arr2);
};

export const isOneOfArray = (arr1: ArrayType, arr2: ArrayType) => {
  return [Array.isArray(arr1), Array.isArray(arr2)].filter(item => item).length === 1;
};

export const isOneOfObject = (obj1: ObjectType, obj2: ObjectType) => {
  return [isObjectType(obj1), isObjectType(obj2)].filter(item => item).length === 1;
};

export const getSameSet = (set1: Set<string>, set2: Set<string>) => {
  return new Set(
    [...set1].filter(item => set2.has(item)),
  );
};

export const getDifferenceSet = (set1: Set<string>, set2: Set<string>) => {
  return new Set(
    [...set1].filter(item => !set2.has(item)),
  );
};
