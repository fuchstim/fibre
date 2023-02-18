export enum EPrimitive {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

type TTypeValidationResult = { valid: true, reason: null, } | { valid: false, reason: string };

export type TWrappedType<TNativeType, TCustomType extends Record<string, any>> = {
  id: string,
  name: string,
  fields: Record<keyof TCustomType, TWrappedType<any, any> | TWrappedPrimitive<any, any>>,
  validate: (input: TCustomType) => TTypeValidationResult,
  unwrap: (input: TCustomType) => TNativeType,
  wrap: (input: TNativeType) => TCustomType
};

export type TWrappedPrimitive<TNativeType extends (string | number | boolean), TCustomType extends Record<string, any>> = Omit<TWrappedType<TNativeType, TCustomType>, 'fields'> & {
  fields: Record<keyof TCustomType, EPrimitive>
};

function validatePrimitive(value: string | number | boolean, expected: 'string' | 'number' | 'boolean'): TTypeValidationResult {
  if (typeof value !== expected) {
    return {
      valid: false,
      reason: `\`${JSON.stringify(value)}\` is not a ${expected}`,
    };
  }

  return { valid: true, reason: null, };
}

export type TStringType = {
  value: string,
};
export const WStringType: TWrappedPrimitive<string, TStringType> = {
  id: EPrimitive.STRING,
  name: 'String',
  fields: {
    value: EPrimitive.STRING,
  },
  validate: ({ value, }) => validatePrimitive(value, 'string'),
  unwrap: ({ value, }) => String(value),
  wrap: value => ({ value, }),
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
  validate: ({ value, }) => validatePrimitive(value, 'number'),
  unwrap: ({ value, }) => Number(value),
  wrap: value => ({ value, }),
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
  validate: ({ value, }) => validatePrimitive(value, 'boolean'),
  unwrap: ({ value, }) => Boolean(value),
  wrap: value => ({ value, }),
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
  validate: wrappedDate => {
    const validationErrors: string[] = [];

    Object
      .keys(WDateType.fields)
      .forEach(key => {
        const { valid, reason, } = WDateType.fields[key as keyof TDateType].validate(wrappedDate[key as keyof TDateType]);
        if (!valid) {
          validationErrors.push(
            `Invalid ${key} (${reason})`
          );
        }
      });

    if (validationErrors.length === 0) { return { valid: true, reason: null, }; }

    return {
      valid: false,
      reason: validationErrors.join(', '),
    };
  },
  unwrap: ({ timestamp, }) => new Date(WStringType.unwrap(timestamp)),
  wrap: input => {
    const date = new Date(input);

    return {
      milliseconds: WNumberType.wrap(date.getMilliseconds()),
      seconds: WNumberType.wrap(date.getSeconds()),
      minutes: WNumberType.wrap(date.getMinutes()),
      hours: WNumberType.wrap(date.getHours()),
      days: WNumberType.wrap(date.getDate()),
      months: WNumberType.wrap(date.getMonth() + 1),
      years: WNumberType.wrap(date.getFullYear()),
      timestamp: WStringType.wrap(date.toISOString()),
    };
  },
};