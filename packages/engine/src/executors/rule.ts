import Executor from '../common/executor';
import { TExecutorResult, TExecutorValidationResult } from '../types/common';
import { ENodeType } from '../types/node';
import { TRuleOptions, TRuleInputs, TRuleOutputs, TRuleExecutorContext } from '../types/rule';
import { ERuleStageReservedId, TRuleStageResults } from '../types/rule-stage';
import RuleStage from './rule-stage';

export default class Rule extends Executor<TRuleInputs, TRuleOutputs, TRuleExecutorContext> {
  readonly id: string;
  readonly name: string;
  readonly sortedStages: RuleStage[][];

  constructor(options: TRuleOptions) {
    super(options.id, 'rule');

    this.id = options.id;
    this.name = options.name;
    this.sortedStages = this.sortStages(options.stages);

    const entryStages = this.sortedStages.flat().filter(stage => stage.node.type === ENodeType.ENTRY);
    const exitStages = this.sortedStages.flat().filter(stage => stage.node.type === ENodeType.EXIT);

    if (entryStages.length > 1 || exitStages.length > 1) {
      throw new Error('Invalid number of entry / exit stages defined');
    }
  }

  get entryStage() {
    return this.sortedStages.flat().find(stage => stage.node.type === ENodeType.ENTRY);
  }

  get exitStage() {
    return this.sortedStages.flat().find(stage => stage.node.type === ENodeType.EXIT);
  }

  async execute(unwrappedRuleInputs: TRuleInputs, context: TRuleExecutorContext): Promise<TRuleOutputs> {
    const ruleStageResults: TRuleStageResults = {};

    if (this.entryStage) {
      ruleStageResults[ERuleStageReservedId.ENTRY] = this.wrapRuleInputs(unwrappedRuleInputs, context);
    }

    for (const stages of this.sortedStages) {
      await Promise.all(
        stages.map(
          async stage => {
            const stageInputs = this.getStageInputs(stage, ruleStageResults);

            ruleStageResults[stage.id] = await stage.run(
              stageInputs,
              { ...context, rule: this, }
            );
          }
        )
      );
    }

    if (this.exitStage) {
      ruleStageResults[ERuleStageReservedId.EXIT] = ruleStageResults[this.exitStage.id];
    }

    return ruleStageResults;
  }

  override validateContext(context: TRuleExecutorContext): TExecutorValidationResult<TRuleExecutorContext> {
    const invalidStages = this.sortedStages
      .flat()
      .map(
        stage => ({ stage, result: stage.validateContext({ ...context, rule: this, }), })
      )
      .filter(r => r.result.valid === false);

    if (invalidStages.length) {
      return {
        valid: false,
        reason: `Invalid stages: ${invalidStages.map(e => `${e.stage.id} (${e.result.reason})`).join(', ')}`,
        actual: context,
      };
    }

    return {
      valid: true,
      reason: null,
      actual: context,
    };
  }

  override validateInputs(inputs: TRuleInputs, context: TRuleExecutorContext): TExecutorValidationResult<TRuleInputs> {
    if (!this.entryStage) {
      return {
        valid: true,
        reason: null,
        actual: inputs,
      };
    }

    const { inputs: requiredInputs, } = this.entryStage.node.getMetadata(
      this.entryStage.createNodeContext(context)
    );

    const invalidInputs = requiredInputs
      .map(requiredInput => {
        if (inputs[requiredInput.id] == null) {
          return { input: requiredInput, valid: false, reason: 'Missing', };
        }

        try {
          requiredInput.type.validate(
            requiredInput.type.wrap(inputs[requiredInput.id])
          );

          return { input: requiredInput, valid: true, };
        } catch (e) {
          const { message, } = e as Error;

          return { input: requiredInput, valid: false, reason: `Invalid (${message})`, };
        }
      })
      .filter(r => !r.valid);

    if (invalidInputs.length) {
      return {
        valid: false,
        reason: `One or more inputs is invalid: ${invalidInputs.map(i => `${i.input.id} (${i.reason})`).join(', ')}`,
        actual: inputs,
      };
    }

    return {
      valid: true,
      reason: null,
      actual: inputs,
    };
  }

  private sortStages(stages: RuleStage[]): RuleStage[][] {
    const stagesWithoutDependencies = stages.filter(
      stage => stage.dependsOn.length === 0
    );

    const sortedStageIds = [ stagesWithoutDependencies.map(s => s.id), ];
    while (sortedStageIds.flat().length !== stages.length) {
      const flatSortedStageIds = sortedStageIds.flat();

      const availableStages = stages.filter(
        stage => (
          !flatSortedStageIds.includes(stage.id)
          && stage.dependsOn.every(
            stageId => flatSortedStageIds.includes(stageId)
          )
        )
      );

      if (!availableStages.length) {
        throw new Error('Invalid rule stage dependencies detected');
      }

      sortedStageIds.push(
        availableStages.map(stage => stage.id)
      );
    }

    return sortedStageIds.map(
      stageIds => stages.filter(stage => stageIds.includes(stage.id))
    );
  }

  private wrapRuleInputs(ruleInputs: TRuleInputs, context: TRuleExecutorContext): TExecutorResult<any, any> {
    if (!this.entryStage) {
      throw new Error('Cannot wrap inputs for a rule without entry stage');
    }

    const wrappedInputs = this.entryStage.node
      .getMetadata(this.entryStage.createNodeContext(context))
      .inputs
      .reduce(
        (acc, input) => ({
          ...acc,
          [input.id]: input.type.wrap(ruleInputs[input.id]),
        }),
        {}
      );

    return {
      executionTimeMs: 0,
      inputs: wrappedInputs,
      outputs: wrappedInputs,
    };
  }

  private getStageInputs(stage: RuleStage, previousStageResults: TRuleStageResults) {
    if (stage.node.type === ENodeType.ENTRY) {
      return previousStageResults[ERuleStageReservedId.ENTRY].outputs;
    }

    return stage.inputs.reduce(
      (acc, { ruleStageId, inputId, outputId, }) => ({
        ...acc,
        [inputId]: this.getOutputById(previousStageResults[ruleStageId].outputs, outputId),
      }),
      {}
    );
  }

  private getOutputById(outputs: Record<string, any>, id: string): any {
    const pathParts = id.split('.');
    const value = pathParts.reduce(
      (acc, pathPart) => acc?.[pathPart],
      outputs
    );

    return value;
  }
}
