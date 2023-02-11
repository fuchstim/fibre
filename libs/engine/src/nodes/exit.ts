import { BaseNode } from '../common/base-node';
import { WBooleanType, TBooleanType } from '../common/wrapped-types';
import { ENodeType } from '../types/node';

type TNodeInput = {
  result: TBooleanType,
};

export default class ExitNode extends BaseNode<TNodeInput, TNodeInput, Record<string, never>> {
  constructor() {
    super({
      id: 'exit',
      name: 'Rule Result',
      type: ENodeType.EXIT,

      defaultOptions: {},
      options: [],
      inputs: [
        { id: 'result', name: 'Rule Result', type: WBooleanType, },
      ],
      outputs: [
        { id: 'result', name: 'Rule Result', type: WBooleanType, },
      ],
    });
  }

  execute(input: TNodeInput): TNodeInput {
    return input;
  }
}
