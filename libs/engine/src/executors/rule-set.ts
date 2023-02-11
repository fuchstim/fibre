import Executor from '../common/executor';
import { ERuleSeverity } from '../constants/rule-severities';
import { TRuleSetExecutorContext } from '../types/rule-set';
import { TRuleSetEntry, TRuleSetOptions, TRuleSetInputs, TRuleSetExecutorResult } from '../types/rule-set';

const ORDERED_RULE_SEVERITIES = [
  ERuleSeverity.INFO,
  ERuleSeverity.LOW,
  ERuleSeverity.MEDIUM,
  ERuleSeverity.HIGH,
  ERuleSeverity.VERY_HIGH,
  ERuleSeverity.CRITICAL,
];

export default class RuleSet extends Executor<TRuleSetInputs, TRuleSetExecutorResult, TRuleSetExecutorContext> {
  readonly id: string;
  readonly name: string;
  readonly entries: TRuleSetEntry[];

  constructor(options: TRuleSetOptions) {
    super('rule-set');

    this.id = options.id;
    this.name = options.name;
    this.entries = options.entries;
  }

  async execute(inputs: TRuleSetInputs, context: TRuleSetExecutorContext): Promise<TRuleSetExecutorResult> {
    const results = await Promise.all(
      this.entries.map(entry => this.executeEntry(entry, inputs, context))
    );

    const highestSeverityResult = results
      .filter(r => r.result.output.triggered)
      .sort((a, b) => ORDERED_RULE_SEVERITIES.indexOf(a.severity) - ORDERED_RULE_SEVERITIES.indexOf(b.severity))
      .pop();

    return {
      severity: highestSeverityResult?.severity ?? null,
      triggered: !!highestSeverityResult,
      ruleResults: results,
    };
  }

  private async executeEntry({ ruleId, severity, }: TRuleSetEntry, inputs: TRuleSetInputs, context: TRuleSetExecutorContext) {
    const rule = context.rules.find(rule => rule.id === ruleId);
    if (!rule) { throw new Error(`Failed to find rule for id ${ruleId}`); }

    const ruleExecutorContext = {
      ...context,
      logger: context.logger.ns(ruleId),
    };
    const result = await rule.run(inputs, ruleExecutorContext);

    return { ruleId, severity, result, };
  }
}
