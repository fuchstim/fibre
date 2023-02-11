import { BaseNode } from '../common/base-node';
import Executor from '../common/executor';
import { TExecutorResult } from '../types/common';
import { TNodeExecutorContext, TNodeOptions } from '../types/node';
import { TRuleStageExecutorContext, TRuleStageInput, TRuleStageInputs, TRuleStageOptions } from '../types/rule-stage';

export default class RuleStage extends Executor<TRuleStageInputs, TExecutorResult<any>, TRuleStageExecutorContext> {
  readonly id: string;
  readonly node: BaseNode<any, any, any>;
  readonly inputs: TRuleStageInput[];
  readonly nodeOptions: TNodeOptions;

  constructor(options: TRuleStageOptions) {
    super(options.id, 'rule-stage');

    this.id = options.id;
    this.node = options.node;
    this.inputs = options.inputs;
    this.nodeOptions = options.nodeOptions;
  }

  get dependsOn() {
    return this.inputs.map(input => input.ruleStageId);
  }

  createNodeContext(context: TRuleStageExecutorContext): TNodeExecutorContext<TNodeOptions> {
    return {
      ...context,
      nodeOptions: this.nodeOptions,
    };
  }

  async execute({ previousResults, additionalNodeInputs, }: TRuleStageInputs, context: TRuleStageExecutorContext) {
    const nodeInputs = this.inputs.reduce(
      (acc, { ruleStageId, inputId, outputId, }) => ({
        ...acc,
        [inputId]: this.getOutputByKey(previousResults[ruleStageId], outputId),
      }),
      additionalNodeInputs ?? {}
    );

    const result = await this.node.run(
      nodeInputs,
      this.createNodeContext(context)
    );

    return result.output;
  }

  private getOutputByKey({ output, }: TExecutorResult<any>, key: string): any {
    const pathParts = key.split('.');
    const value = pathParts.reduce(
      (acc, pathPart) => acc[pathPart],
      output
    );

    return value;
  }
}
