import type { SchemaDefinition, TableDefinition, ColumnDefinition, SecurityStatus, DatabaseTable, TableProperty } from './types'
import { SupabaseClient } from '@supabase/supabase-js'

export const fetcher = async (url: string, key: string) => {
  try {
    const response = await fetch(`${url}/rest/v1/?apikey=${key}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch schema')
    }
    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const parseSchemaData = (definitions: Record<string, SchemaDefinition>): TableDefinition[] => {
  const tables: TableDefinition[] = []
  
  Object.entries(definitions).forEach(([tableName, tableData]) => {
    const columns: ColumnDefinition[] = []
    
    if (tableData.properties) {
      Object.entries(tableData.properties).forEach(([columnName, columnData]) => {
        const column: ColumnDefinition = {
          name: columnName,
          format: (columnData as TableProperty)?.format || '',
          type: (columnData as TableProperty)?.type || '',
          description: (columnData as TableProperty)?.description || '',
          default: (columnData as TableProperty)?.default,
          maxLength: (columnData as TableProperty)?.maxLength
        }
        
        // Check if column is required
        if (tableData.required && tableData.required.includes(columnName)) {
          column.required = true
        }
        
        columns.push(column)
      })
    }
    
    // Determine if it's a table or view based on name pattern
    const isView = tableName.includes('_view') || tableName.includes('admin_')
    
    tables.push({
      name: tableName,
      type: isView ? 'view' : 'table',
      columns,
      required: tableData.required
    })
  })
  
  return tables
}

export const getSecurityIcon = (status: SecurityStatus[keyof SecurityStatus]) => {
  switch (status) {
    case 'secured':
      return (
        <svg className="w-8 h-8" fill="#059669" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      )
    case 'not_secured':
      return (
        <svg className="w-8 h-8" fill="#dc2626" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    case 'probably_secured':
      return (
        <svg className="w-8 h-8" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="#3b82f6" />
          <path d="M10 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" fill="#ffffff" />
        </svg>
      )
    case 'unknown':
      return (
        <svg className="w-8 h-8" fill="#6b7280" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )
    default:
      return (
        <svg className="w-8 h-8" fill="#6b7280" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )
  }
}

export const getSecurityColor = (status: SecurityStatus[keyof SecurityStatus]) => {
  switch (status) {
    case 'secured':
      return 'text-green-700'
    case 'not_secured':
      return 'text-red-700'
    case 'probably_secured':
      return 'text-blue-700'
    case 'unknown':
      return 'text-gray-700'
    default:
      return 'text-gray-700'
  }
}

export const getSecurityBorderColor = (status: SecurityStatus[keyof SecurityStatus]) => {
  switch (status) {
    case 'secured':
      return 'border-green-700'
    case 'not_secured':
      return 'border-red-700'
    case 'probably_secured':
      return 'border-blue-700'
    case 'unknown':
      return 'border-gray-600'
    default:
      return 'border-gray-600'
  }
}

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'string': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'integer': return 'bg-green-100 text-green-800 border-green-300'
    case 'number': return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'boolean': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export const getRequiredBadge = (required: boolean) => {
  return required ? (
    <span className="inline-flex items-center px-3 py-1 text-xs font-bold bg-red-100 text-red-800 border-2 border-red-300 min-w-[70px] justify-center uppercase tracking-wide">
      Required
    </span>
  ) : (
    <span className="inline-flex items-center px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 border-2 border-gray-300 min-w-[70px] justify-center uppercase tracking-wide">
      Optional
    </span>
  )
}

export const getTableTypeBadge = (type: 'table' | 'view') => {
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold border-2 uppercase tracking-wide ${
      type === 'view' ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-blue-50 text-blue-700 border-blue-300'
    }`}>
      {type === 'view' ? 'VIEW' : 'TABLE'}
    </span>
  )
}

// New functions ported from Vue.js implementation

export async function getDatabaseSchema(supabaseURL: string, supabaseKey: string): Promise<{ data?: DatabaseTable[], error?: string }> {
  const result: DatabaseTable[] = []
  try {
    const res = await fetch(`${supabaseURL}/rest/v1/?apikey=${supabaseKey}`)
    if (!res.ok) {
      const e = await res.json()
      return { error: e.message }
    }
    const data = await res.json()
    Object.keys(data.definitions).forEach((k) => {
      const propertyKeys = Object.keys(data.definitions[k].properties || {})
      const foundPKProp = propertyKeys.map((pk) => {
        const prop = data.definitions[k].properties?.[pk]
        if (prop?.description?.includes('<pk/>')) {
          return { name: pk, description: prop.description }
        }
        return undefined
      }).find((p) => p)
      result.push({
        name: k,
        read: null,
        insert: null,
        update: null,
        delete: null,
        required: data.definitions[k].required,
        properties: data.definitions[k].properties || {},
        primaryKey: foundPKProp?.name,
        insertedRecord: null,
        checking: null
      })
    })
    return { data: result }
  } catch {
    return { error: 'Error fetching schema.' }
  }
}

export function generateDatabaseTableRandomData(databaseTable: DatabaseTable): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (databaseTable.required) {
    databaseTable.required.forEach((requiredProperty: string) => {
      const propertyDefinition = databaseTable.properties[requiredProperty] as TableProperty
      if (propertyDefinition.description?.includes('<pk/>')) {
        // skip this property
        return
      }
      if (propertyDefinition) {
        result[requiredProperty] = generateRandomValue(propertyDefinition)
      }
    })
  }
  return result
}

export function generateRandomValue(property: TableProperty): string | number | boolean | null | unknown[] {
  switch (property.type) {
    case 'string':
      if (property.enum && property.enum.length > 0) {
        return property.enum[Math.floor(Math.random() * property.enum.length)]
      } else if (property.format.includes('timestamp')) {
        return new Date().toISOString()
      } else {
        return Math.random().toString(36).substring(7)
      }
    case 'integer':
      return Math.floor(Math.random() * 100)
    case 'boolean':
      return Math.random() < 0.5
    case 'number':
      return Math.random() * 100
    case 'array':
      return [generateRandomValue({ ...property.items, type: property.items!.type } as TableProperty)]
    default:
      return null
  }
}

/** Attempts to insert a record into `table`. Returns the inserted `object` if able to insert, `null` if not able to insert */
export async function checkInsertAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<object | null> {
  table.checking = 'insert'
  const recordToInsert = generateDatabaseTableRandomData(table)
  const { data, error } = await supabaseClient.from(table.name).insert(recordToInsert).select().single()
  table.checking = null
  if (error) return null
  else return data
}

/** Attempts to read records from `table`. Returns `true` if able to read, `false` if not able to read, `null` if unable to determine */
export async function checkReadAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<boolean | null> {
  table.checking = 'read'
  const { data, error } = await supabaseClient.from(table.name).select('*')
  table.checking = null
  if (error) return false
  if (data && data.length === 0) return null
  else return true
}

/** Attempts to update the given `record` on `table`. Returns `true` if able to update, `false` if not able to update, and `null` if unable to determine the primary key */
export async function checkUpdateAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<boolean | null> {
  if (!table.primaryKey) return false
  if (!table.insertedRecord) return null
  table.checking = 'update'
  const { error } = await supabaseClient.from(table.name).update(table.insertedRecord).eq(table.primaryKey, table.insertedRecord[table.primaryKey as keyof typeof table.insertedRecord])
  table.checking = null
  if (error) return false
  else return true
}

/** Attempts to delete the given `record` on `table`. Returns `true` if able to delete, `false` if not able to delete, and `null` if unable to determine the primary key */
export async function checkDeleteAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<boolean | null> {
  if (!table.primaryKey) return false
  if (!table.insertedRecord) return null
  table.checking = 'delete'
  const { error } = await supabaseClient.from(table.name).delete().eq(table.primaryKey, table.insertedRecord[table.primaryKey as keyof typeof table.insertedRecord])
  table.checking = null
  if (error) return false
  else return true
}
