import { ENodeType } from '../types/node';
import { TRuleOptions, TRuleInputs, TRuleOutput, TStageOutputs, TRuleContext } from '../types/rule';
import RuleStage from './rule-stage';

export default class Rule {
  readonly id: string;
  readonly name: string;
  readonly stages: RuleStage[];

  constructor(options: TRuleOptions) {
    this.id = options.id;
    this.name = options.name;
    this.stages = this._sortStages(options.stages);

    const entryStages = this.stages.filter(
      stage => stage.node.type === ENodeType.ENTRY
    );
    const exitStages = this.stages.filter(
      stage => stage.node.type === ENodeType.EXIT
    );

    if (entryStages.length !== 1 || exitStages.length !== 1) {
      throw new Error('Invalid number of entry / exit RuleStages defined');
    }
  }

  get entryStage() {
    const entryStage = this.stages.find(
      stage => stage.node.type === ENodeType.ENTRY
    );
    if (!entryStage) { throw new Error(`Failed to find entry stage for rule ${this.id}`); }

    return entryStage;
  }

  get exitStage() {
    const exitStage = this.stages.find(
      stage => stage.node.type === ENodeType.EXIT
    );
    if (!exitStage) { throw new Error(`Failed to find exit stage for rule ${this.id}`); }

    return exitStage;
  }

  async execute(inputs: TRuleInputs, context: TRuleContext): Promise<TRuleOutput> {
    const stageOutputs: TStageOutputs = {};

    for (const stage of this.stages) {
      stageOutputs[stage.id] = await stage.execute(
        stageOutputs,
        stage.node.type === ENodeType.ENTRY ? inputs : {},
        context
      );
    }

    return {
      triggered: Boolean(stageOutputs[this.exitStage.id].result.value),
    };
  }

  private _sortStages(stages: RuleStage[]): RuleStage[] {
    const stagesWithoutDependencies = stages.filter(
      stage => stage.dependsOn.length === 0
    );

    const sortedStageIds = stagesWithoutDependencies.map(s => s.id);
    while (sortedStageIds.length !== stages.length) {
      const availableStages = stages.filter(
        stage => (
          !sortedStageIds.includes(stage.id)
          && stage.dependsOn.every(
            stageId => sortedStageIds.includes(stageId)
          )
        )
      );

      if (!availableStages.length) {
        throw new Error('Invalid RuleStage dependencies detected');
      }

      sortedStageIds.push(
        ...availableStages.map(stage => stage.id)
      );
    }

    return sortedStageIds.map(
      stageId => stages.find(stage => stage.id === stageId)!
    );
  }
}
