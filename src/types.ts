// Types from Vue.js implementation - ported to TypeScript
export type CheckType = 'read' | 'insert' | 'update' | 'delete'

export type TableProperty = {
  enum?: string[]
  description: string
  format: string
  type: string
  default?: string | number | boolean
  maxLength?: number
  items?: {
    type: string
  }
}

export type DatabaseTable = {
  name: string
  read: boolean | null | 'unlikely'
  insert: boolean | null
  update: boolean | null
  delete: boolean | null
  required?: string[]
  properties: Record<string, TableProperty>
  primaryKey?: string
  insertedRecord?: object | null
  checking: CheckType | null
}

// Existing types - keeping for compatibility
export interface ColumnDefinition {
  name: string
  format: string
  type: string
  description?: string
  default?: string | number | boolean
  required?: boolean
  maxLength?: number
}

export interface TableDefinition {
  name: string
  type: 'table' | 'view'
  columns: ColumnDefinition[]
  required?: string[]
}

export interface SupabaseDetails {
  url: string
  key: string
}

export interface SecurityStatus {
  read: 'secured' | 'not_secured' | 'probably_secured' | 'unknown'
  insert: 'secured' | 'not_secured' | 'probably_secured' | 'unknown'
  update: 'secured' | 'not_secured' | 'probably_secured' | 'unknown'
  delete: 'secured' | 'not_secured' | 'probably_secured' | 'unknown'
}

export interface SchemaDefinition {
  properties?: Record<string, {
    format?: string
    type?: string
    description?: string
    default?: string | number | boolean
    maxLength?: number
    enum?: string[]
    items?: {
      type: string
    }
  }>
  required?: string[]
}
