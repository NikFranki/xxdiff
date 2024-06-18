export type SignType = 'add' | 'delete' | 'update';

export type BaiscType = string | number | boolean | null | undefined;

export type ObjectType = Record<string, any>;

export type BasicArrayType = BaiscType[];

export type ObjectArrayType = ObjectType[];

export type ArrayType = BasicArrayType | ObjectArrayType;

export type GlobalOptionsType = {
  basicTypeArrayStrictDiff?: boolean;
  pointedArrayKeyDiffOrder?: string[];
  ignoreKeys?: string[];
};
