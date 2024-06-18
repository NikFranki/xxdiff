import { BasicArrayType, ObjectType } from 'src/types';
import XXdiff from '../index';

describe('diff two object in default diff config', () => {
  const { diff } = new XXdiff();

  it('diff two object but data source is unvalid', () => {
    const before = null;
    const after = null;
    const result = diff(before as unknown as ObjectType, after as unknown as ObjectType);
    expect(result).toStrictEqual({
      "before": null,
      "after": null
    });
  });

  it('diff two object but before is empty object', () => {
    const before = {};
    const after = { b: 2 };
    const result = diff(before, after);
    expect(result).toStrictEqual({ before: { diff_b: 'delete' }, after: { b: 2, diff_b: 'add' } });
  });

  it('diff two object but after is empty object', () => {
    const before = { a: 1 };
    const after = {};
    const result = diff(before, after);
    expect(result).toStrictEqual({ before: { a: 1, diff_a: 'delete' }, after: { diff_a: 'add' } });
  });

  it('diff two two-dimensional complex object', () => {
    const before = {
      a: { c: 1 }
    };
    const after = {
      a: { c: 2 }
    };
    const result = diff(before, after);
    expect(result).toStrictEqual({
      before: { a: { c: 1, diff_c: 'update' }, diff_a: 'update' },
      after: { a: { c: 2, diff_c: 'update' }, diff_a: 'update' }
    });
  });

  it('diff two basic type array strictly', () => {
    const before = [1];
    const after = [] as BasicArrayType;
    const result = diff(before, after);
    const reference = { before: [1], after: [] };
    (reference.before as ObjectType).diff_1 = 'delete';
    expect(result).toStrictEqual(reference);
  });

  it('diff two object that contains jsonstring but after is empty string', () => {
    const before = { a: JSON.stringify({ b: 1, c: [{ d: 1 }] }), d: [{ d: 1 }] };
    const after = { a: '' };
    const result = diff(before, after);
    expect(result).toStrictEqual({
      "before": {
        "a": {
          "b": 1,
          "c": [
            {
              "d": 1,
              "diff_d": "delete"
            }
          ],
          "diff_b": "delete",
          "diff_c": "delete"
        },
        "d": [
          {
            "d": 1,
            "diff_d": "delete"
          }
        ],
        "diff_d": "delete",
        "diff_a": "delete"
      },
      "after": {
        "a": "",
        "diff_d": "add",
        "diff_a": "add"
      }
    });
  });

  it('diff two object that comtains multi type data', () => {
    const before = { a: [{ b: 1 }, { b: 3 }], c: [1, 4, 9], d: [1] };
    const after = { a: [{ b: 2 }], c: [1, 3], d: [1, 3] };
    const result = diff(before, after);
    const reference = {
      "before": {
        "a": [
          {
            "b": 1,
            "diff_b": "update"
          },
          {
            "b": 3,
            "diff_b": "delete"
          }
        ],
        "c": [
          1,
          4,
          9
        ],
        "d": [
          1
        ],
        "diff_a": "update",
        "diff_c": "update",
        "diff_d": "update"
      },
      "after": {
        "a": [
          {
            "b": 2,
            "diff_b": "update"
          }
        ],
        "c": [
          1,
          3
        ],
        "d": [
          1,
          3
        ],
        "diff_a": "update",
        "diff_c": "update",
        "diff_d": "update"
      }
    };
    (reference.before.a as ObjectType).diff_0 = 'update';
    (reference.before.a as ObjectType).diff_1 = 'update';
    (reference.before.c as ObjectType).diff_1 = 'update';
    (reference.before.c as ObjectType).diff_2 = 'delete';

    (reference.after.a as ObjectType).diff_0 = 'update';
    (reference.after.a as ObjectType).diff_1 = 'update';
    (reference.after.c as ObjectType).diff_1 = 'update';
    (reference.after.d as ObjectType).diff_1 = 'add';
    expect(result).toStrictEqual(reference);
  });

  it('diff two object array but the value of after\'s property a is empty array', () => {
    const before = { a: [{ id: 1, b: 1 }] };
    const after = { a: [] };
    const result = diff(before, after);
    const reference = {
      "before": {
        "a": [
          {
            "id": 1,
            "b": 1,
            "diff_id": "delete",
            "diff_b": "delete"
          }
        ],
        "diff_a": "update",
      },
      "after": {
        "a": [],
        "diff_a": "update",
      }
    };
    (reference.before.a as ObjectType).diff_0 = 'update';
    (reference.after.a as ObjectType).diff_0 = 'update';


    expect(result).toStrictEqual(reference);
  });

  it('diff two object array but the value of after\'s property a is null', () => {
    const before = { a: [{ id: 1, b: 1 }] };
    const after = { a: null };
    const result = diff(before, after);
    expect(result).toStrictEqual({
      "before": {
        "a": [
          {
            "id": 1,
            "b": 1,
            "diff_id": "delete",
            "diff_b": "delete"
          }
        ],
        "diff_a": "delete",
      },
      "after": {
        "a": null,
        "diff_a": "add",
      }
    });
  });

  it('diff two object that contains jsonstring', () => {
    const before = {
      "name": 'xx',
      "rule_detail": [
        {
          "multiplier_list": [
            {
              "detail": "[{\"multiplier\":12, \"primary_key\": \"pig\"}, {\"multiplier\":1, \"primary_key\": \"bird\"}, {\"multiplier\":12, \"primary_key\": \"cat\"}]",
            }
          ]
        }
      ],
    };
    const after = {
      "name": 'xx1',
      "rule_detail": [
        {
          "multiplier_list": [
            {
              "detail": "[{\"multiplier\":12, \"primary_key\": \"monkey\"}, {\"multiplier\":12, \"primary_key\": \"cat\"}, {\"multiplier\":13, \"primary_key\": \"bird\"}]",
            }
          ]
        }
      ],
    };
    const result = diff(before, after);
    const reference = {
      "after": {
        "diff_name": "update",
        "diff_rule_detail": "update",
        "name": "xx1",
        "rule_detail": [
          {
            "diff_multiplier_list": "update",
            "multiplier_list": [
              {
                "detail": [
                  {
                    "diff_primary_key": "update",
                    "multiplier": 12,
                    "primary_key": "monkey"
                  },
                  {
                    "diff_multiplier": "update",
                    "diff_primary_key": "update",
                    "multiplier": 12,
                    "primary_key": "cat"
                  },
                  {
                    "diff_multiplier": "update",
                    "diff_primary_key": "update",
                    "multiplier": 13,
                    "primary_key": "bird"
                  }
                ],
                "diff_detail": "update"
              }
            ]
          }
        ]
      },
      "before": {
        "diff_name": "update",
        "diff_rule_detail": "update",
        "name": "xx",
        "rule_detail": [
          {
            "diff_multiplier_list": "update",
            "multiplier_list": [
              {
                "detail": [
                  {
                    "diff_primary_key": "update",
                    "multiplier": 12,
                    "primary_key": "pig"
                  },
                  {
                    "diff_multiplier": "update",
                    "diff_primary_key": "update",
                    "multiplier": 1,
                    "primary_key": "bird"
                  },
                  {
                    "diff_multiplier": "update",
                    "diff_primary_key": "update",
                    "multiplier": 12,
                    "primary_key": "cat"
                  }
                ],
                "diff_detail": "update"
              }
            ]
          }
        ]
      }
    };
    (reference.before.rule_detail as ObjectType).diff_0 = 'update';
    (reference.before.rule_detail as ObjectType)[0].multiplier_list.diff_0 = 'update';
    (reference.before.rule_detail as ObjectType)[0].multiplier_list[0].detail.diff_0 = 'update';
    (reference.before.rule_detail as ObjectType)[0].multiplier_list[0].detail.diff_1 = 'update';
    (reference.before.rule_detail as ObjectType)[0].multiplier_list[0].detail.diff_2 = 'update';
    (reference.after.rule_detail as ObjectType).diff_0 = 'update';
    (reference.after.rule_detail as ObjectType)[0].multiplier_list.diff_0 = 'update';
    (reference.after.rule_detail as ObjectType)[0].multiplier_list[0].detail.diff_0 = 'update';
    (reference.after.rule_detail as ObjectType)[0].multiplier_list[0].detail.diff_1 = 'update';
    (reference.after.rule_detail as ObjectType)[0].multiplier_list[0].detail.diff_2 = 'update';
    expect(result).toStrictEqual(reference);
  });
});

describe('diff two object in custom diff config', () => {
  const { diff } = new XXdiff({
    basicTypeArrayStrictDiff: false,
    pointedArrayKeyDiffOrder: ['a[{}].id', 'rule_detail[{}].multiplier_list[{}].detail[{}].primary_key'],
    ignoreKeys: ['name'],
  });

  it('diff two array loosely', () => {
    const before = { a: [1, 3] };
    const after = { a: [2, 1] };
    const result = diff(before, after);
    const reference = {
      "before": {
        "a": [1, 3],
        "diff_a": "update"
      },
      "after": {
        "a": [2, 1],
        "diff_a": "update"
      }
    };
    (reference.before.a as ObjectType).diff_1 = 'delete';
    (reference.after.a as ObjectType).diff_0 = 'add';
    expect(result).toStrictEqual(reference);
  });

  it('diff two object array by primary key', () => {
    const before = { a: [{ id: 3, b: 3 }, { id: 1, b: 1 }] };
    const after = { a: [{ id: 1, b: 2 }, { id: 4, b: 4 }] };
    const result = diff(before, after);
    expect(result).toStrictEqual({
      "before": {
        "a": [
          {
            "id": 3,
            "b": 3,
            "diff_id": "delete",
            "diff_b": "delete"
          },
          {
            "id": 1,
            "b": 1,
            "diff_b": "update"
          }
        ],
        "diff_a": "update"
      },
      "after": {
        "a": [
          {
            "id": 1,
            "b": 2,
            "diff_b": "update"
          },
          {
            "id": 4,
            "b": 4,
            "diff_id": "add",
            "diff_b": "add"
          }
        ],
        "diff_a": "update"
      }
    });
  });
});