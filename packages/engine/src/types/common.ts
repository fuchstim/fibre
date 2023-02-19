import type Executor from '../common/executor';
import { WrappedType } from '../common/wrapped-types';
import type Rule from '../executors/rule';
import type RuleSet from '../executors/rule-set';

export type TGetter<TContext, TReturnType> = (context: TContext) => TReturnType;
export type TOptionalGetter<TContext, TReturnType> = TReturnType | TGetter<TContext, TReturnType>;

export type TExecutorResult<TInputs, TOutputs> = {
  executionTimeMs: number,
  inputs: TInputs,
  outputs: TOutputs
};

export type TExecutorValidationResult<T> = {
  actual: T,
  expected?: Record<string, WrappedType<any, any>>,
} & ({ valid: true, reason: null } | { valid: false, reason: string });

export interface IExecutorLogger {
  ns: (...namespaces: string[]) => IExecutorLogger;
  namespace: (...namespaces: string[]) => IExecutorLogger;

  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export type TExecutorContext = {
  executionId: string,
  logger: IExecutorLogger,
  rules: Rule[],
  ruleSets: RuleSet[],
  callStack?: Executor<any, any, any>[]
};
