import { BaseNode } from '../common/base-node';
import { CBooleanType, TBooleanType } from '../common/types';

type TNodeInput = {
  result: TBooleanType,
};

export default class ExitNode extends BaseNode<TNodeInput, TNodeInput, never> {
  constructor() {
    super({
      id: 'exit',
      name: 'Rule Result',

      options: [],
      inputs: [
        { id: 'result', name: 'Rule Result', type: CBooleanType, },
      ],
      outputs: [],
    });
  }

  execute(input: TNodeInput): TNodeInput {
    return input;
  }
}
