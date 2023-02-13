import { Request, Response } from 'express';

export enum ERequestMethod {
  FIND = 'find',
  GET = 'get',
  CREATE = 'create',
  PATCH = 'patch',
  DELETE = 'delete'
}

export type TContext = {
  req: Request,
  res: Response,
  user: TAuthenticatedUser
};

export interface IService<T> {
  [ERequestMethod.FIND]?: (context: TContext) => Promise<T[] | void> | T[] | void,
  [ERequestMethod.GET]?: (id: string, context: TContext) => Promise<T | void> | T | void,
  [ERequestMethod.CREATE]?: (data: Omit<T, 'id'>, context: TContext) => Promise<T | void> | T | void,
  [ERequestMethod.PATCH]?: (id: string, data: T, context: TContext) => Promise<T | void> | T | void,
  [ERequestMethod.DELETE]?: (id: string, context: TContext) => Promise<T | void> | T | void,
}

export type TAuthenticatedUser = {
  id: string,
  name: string,
  avatarUrl?: string,
};
