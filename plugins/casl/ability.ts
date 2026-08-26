import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'

export type Subjects =
  | 'all'
  | 'Auth'
  | 'Dashboard'
  | 'User'
  | 'Role'
  | 'Agent'
  | 'Workflow'
  | 'Tool'
  | 'ModelProvider'
  | 'Memory'
  | 'Observability'

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
