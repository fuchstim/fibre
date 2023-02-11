import { BaseNode } from '../common/base-node';
import { WBooleanType, WNumberType, WStringType, EPrimitive, TWrappedPrimitive, TStringType, TNumberType, TBooleanType } from '../common/wrapped-types';
import { ENodeMetadataOptionType, TNodeExecutorContext } from '../types/node';

type TNodeOutput = {
  value: TStringType | TNumberType | TBooleanType,
};

type TNodeOptions = {
  valueType: EPrimitive,
  value: string | number | boolean,
};

export default class StaticValueNode extends BaseNode<never, TNodeOutput, TNodeOptions> {
  constructor() {
    super({
      id: 'staticValue',
      name: 'Static Value',

      options: context => ([
        {
          id: 'valueType',
          name: 'Value Type',
          type: ENodeMetadataOptionType.DROP_DOWN,
          dropDownOptions: [
            { id: EPrimitive.STRING, name: 'String', },
            { id: EPrimitive.NUMBER, name: 'Number', },
            { id: EPrimitive.BOOLEAN, name: 'Boolean', },
          ],
          validate: v => Object.values(EPrimitive).includes(v),
        },
        {
          id: 'value',
          name: 'Value',
          type: ENodeMetadataOptionType.INPUT,
          inputOptions: {
            type: context.nodeOptions.valueType as EPrimitive ?? EPrimitive.STRING,
          },
          validate: value => (
            typeof value === this.getNativeValueType(context.nodeOptions.valueType as EPrimitive)
          ),
        },
      ]),
      inputs: [],
      outputs: context => ([
        { id: 'value', name: 'Value', type: this.getWrappedValueType(context.nodeOptions.valueType as EPrimitive), },
      ]),
    });
  }

  private getNativeValueType(type: EPrimitive): string {
    const nativeValueType = {
      [EPrimitive.STRING]: 'string',
      [EPrimitive.NUMBER]: 'number',
      [EPrimitive.BOOLEAN]: 'boolean',
    }[type];

    return nativeValueType ?? 'string';
  }

  private getWrappedValueType(type: EPrimitive): TWrappedPrimitive<any, any> {
    const wrappedValueType = {
      [EPrimitive.STRING]: WStringType,
      [EPrimitive.NUMBER]: WNumberType,
      [EPrimitive.BOOLEAN]: WBooleanType,
    }[type];

    return wrappedValueType ?? WStringType;
  }

  execute(_: never, context: TNodeExecutorContext<TNodeOptions>) {
    const { valueType, value, } = context.nodeOptions;

    const wrappedType = {
      [EPrimitive.STRING]: WStringType.fromNative(value as string),
      [EPrimitive.NUMBER]: WNumberType.fromNative(value as number),
      [EPrimitive.BOOLEAN]: WBooleanType.fromNative(value as boolean),
    }[valueType];
    if (!wrappedType) {
      throw new Error(`Invalid valueType specified: ${valueType}`);
    }

    return { value: wrappedType, };
  }
}
