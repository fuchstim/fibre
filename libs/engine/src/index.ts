// Re-Exports
export * as WrappedTypes from './common/wrapped-types';
export { BaseNode } from './common/base-node';
export { BaseConfigProvider } from './config/base-provider';
export { TEngineConfig } from './types/config';

import ConfigParser from './config/parser';
import { BaseConfigProvider } from './config/base-provider';
import { BaseNode } from './common/base-node';
import serializer from './common/serializer';
import ExitNode from './nodes/exit';
import CompareBooleansNode from './nodes/compare-booleans';
import CompareNumbersNode from './nodes/compare-numbers';
import CompareStringsNode from './nodes/compare-strings';
import StaticValueNode from './nodes/static-value';
import Rule from './rule';
import RuleSet from './rule/rule-set';
import { TRuleSetExecutionResult, TRuleSetInputs } from './types/rule-set';
import { TSerializedNode } from './types/serializer';

export type TEngineOptions = {
  configProvider: BaseConfigProvider,
  customNodes?: BaseNode<any, any, any>[]
};

export default class Engine {
  private configProvider: BaseConfigProvider;
  private nodes: BaseNode<any, any, any>[];
  private rules: Rule[] = [];
  private ruleSets: RuleSet[] = [];

  constructor(options: TEngineOptions) {
    this.configProvider = options.configProvider;
    this.nodes = [
      ...options.customNodes ?? [],
      new ExitNode(),
      new CompareBooleansNode(),
      new CompareNumbersNode(),
      new CompareStringsNode(),
      new StaticValueNode(),
    ];
  }

  async executeRuleSet(ruleSetId: string, inputs: TRuleSetInputs): Promise<TRuleSetExecutionResult> {
    const ruleSet = this.ruleSets.find(ruleSet => ruleSet.id === ruleSetId);
    if (!ruleSet) {
      throw new Error(`Cannot execute unknown RuleSet: ${ruleSetId}`);
    }

    const result = await ruleSet.execute(
      inputs,
      { rules: this.rules, }
    );

    return result;
  }

  async loadConfig(configVersion?: number): Promise<void> {
    if (!configVersion) {
      configVersion = await this.configProvider.getLatestConfigVersion();
    }

    const config = await this.configProvider.loadConfig(configVersion);
    const { rules, ruleSets, } = ConfigParser.parse(config, this.nodes);

    this.rules = rules;
    this.ruleSets = ruleSets;
  }

  async saveConfig(): Promise<void> {
    const configVersion = await this.configProvider.getLatestConfigVersion();

    const config = ConfigParser.export(
      configVersion,
      this.rules,
      this.ruleSets
    );

    await this.configProvider.saveConfig(config);
  }

  exportSerializedNodes(): TSerializedNode[] {
    const context = {
      rules: this.rules,
      nodeOptions: {},
    };

    return this.nodes.map(
      node => serializer.serializeNode(node, context)
    );
  }
}
