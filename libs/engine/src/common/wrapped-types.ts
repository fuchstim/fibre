export enum EPrimitive {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

export type TWrappedType<TNativeType, TCustomType extends Record<string, any>> = {
  id: string,
  name: string,
  fields: Record<string, TWrappedType<any, any> | TWrappedPrimitive<any, any>>,
  validate: (input: TCustomType) => boolean,
  toNative: (input: TCustomType) => TNativeType,
  fromNative: (input: TNativeType) => TCustomType
};

export type TWrappedPrimitive<TNativeType extends (string | number | boolean), TCustomType extends Record<string, any>> = Omit<TWrappedType<TNativeType, TCustomType>, 'fields'> & {
  fields: Record<string, EPrimitive>
};

export type TStringType = {
  value: string,
};
export const WStringType: TWrappedPrimitive<string, TStringType> = {
  id: EPrimitive.STRING,
  name: 'String',
  fields: {
    value: EPrimitive.STRING,
  },
  validate: ({ value, }) => typeof value === 'string',
  toNative: ({ value, }) => String(value),
  fromNative: value => ({ value, }),
};

export type TNumberType = {
  value: number,
};
export const WNumberType: TWrappedPrimitive<number, TNumberType> = {
  id: EPrimitive.NUMBER,
  name: 'Number',
  fields: {
    value: EPrimitive.NUMBER,
  },
  validate: ({ value, }) => typeof value === 'number',
  toNative: ({ value, }) => Number(value),
  fromNative: value => ({ value, }),
};

export type TBooleanType = {
  value: boolean,
};
export const WBooleanType: TWrappedPrimitive<boolean, TBooleanType> = {
  id: EPrimitive.BOOLEAN,
  name: 'Boolean',
  fields: {
    value: EPrimitive.BOOLEAN,
  },
  validate: ({ value, }) => typeof value === 'boolean',
  toNative: ({ value, }) => Boolean(value),
  fromNative: value => ({ value, }),
};

export type TDateType = {
  milliseconds: TNumberType,
  seconds: TNumberType,
  minutes: TNumberType,
  hours: TNumberType,
  days: TNumberType,
  months: TNumberType,
  years: TNumberType,
  timestamp: TStringType,
};
export const WDateType: TWrappedType<Date, TDateType> = {
  id: 'DATE',
  name: 'Date',
  fields: {
    milliseconds: WNumberType,
    seconds: WNumberType,
    minutes: WNumberType,
    hours: WNumberType,
    days: WNumberType,
    months: WNumberType,
    years: WNumberType,
    timestamp: WStringType,
  },
  validate: wrappedDate => (
    Object
      .entries(wrappedDate)
      .every(([ key, value, ]) => WDateType.fields[key].validate(value))
  ),
  toNative: ({ timestamp, }) => new Date(WStringType.toNative(timestamp)),
  fromNative: date => ({
    milliseconds: WNumberType.fromNative(date.getMilliseconds()),
    seconds: WNumberType.fromNative(date.getSeconds()),
    minutes: WNumberType.fromNative(date.getMinutes()),
    hours: WNumberType.fromNative(date.getHours()),
    days: WNumberType.fromNative(date.getDate()),
    months: WNumberType.fromNative(date.getMonth() + 1),
    years: WNumberType.fromNative(date.getFullYear()),
    timestamp: WStringType.fromNative(date.toISOString()),
  }),
};
