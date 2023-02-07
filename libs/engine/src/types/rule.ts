import Rule from '../rule/rule';
import RuleStage from '../rule/rule-stage';
import { TKeyValue } from './common';

export type TRuleOptions = {
  id: string,
  name: string,
  stages: RuleStage[]
};

export type TRuleInputs = TKeyValue<string, any>;
export type TStageOutputs = TKeyValue<string, any>;

export type TRuleContext ={
  rules: Rule[],
};

export type TRuleOutput = {
  triggered: boolean,
  // ToDo: Add more rule execution information
};
