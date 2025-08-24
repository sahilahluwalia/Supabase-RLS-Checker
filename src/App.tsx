import { useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import './App.css'
import type { DatabaseTable, CheckType, TableDefinition, TableProperty } from './types'
import {
  getDatabaseSchema,
  checkReadAccessOnTable,
  checkInsertAccessOnTable,
  checkUpdateAccessOnTable,
  checkDeleteAccessOnTable
} from './utils'
import { SecurityChecker } from './components/SecurityChecker'
import { SchemaViewer } from './components/SchemaViewer'

// Interface definitions are now imported from './types'

function App() {
  // User Inputs
  const [supaUrl, setSupaUrl] = useState<string>('')
  const [supaKey, setSupaKey] = useState<string>('')

  // Server Check
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([])

  // Server Check Status
  const [isCheckInProgress, setIsCheckInProgress] = useState<boolean>(false)
  const [isRetrievingSchema, setIsRetrievingSchema] = useState<boolean>(false)
  const [isSchemaAccessBlocked, setIsSchemaAccessBlocked] = useState<boolean>(false)
  const [isCheckComplete, setIsCheckComplete] = useState<boolean>(false)
  const [isCurrentlyChecking, setIsCurrentlyChecking] = useState<CheckType | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Legacy state for schema viewer compatibility
  const [tablesDefinition, setTablesDefinition] = useState<TableDefinition[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showSecurityChecker, setShowSecurityChecker] = useState(true)

  const resetCheckStatus = () => {
    setIsCheckInProgress(false)
    setIsRetrievingSchema(false)
    setIsSchemaAccessBlocked(false)
    setIsCheckComplete(false)
    setIsCurrentlyChecking(null)
    setErrorMessage(null)
  }

  const doSupaCheck = async () => {
    if (isCheckInProgress || !supaUrl || !supaKey) return
    
    // validate URL
    const urlRegex = new RegExp('https://[a-zA-Z0-9-]+.supabase.co')
    if (!urlRegex.test(supaUrl)) {
      setErrorMessage('Invalid Supabase URL')
      return
    }
    
    const cleanUrl = supaUrl.replace(/\/$/, '')
    const supabaseClient = createClient(cleanUrl, supaKey)
    setSupabase(supabaseClient)
    
    resetCheckStatus()
    setIsCheckInProgress(true)
    setIsRetrievingSchema(true)
    
    const { data, error } = await getDatabaseSchema(cleanUrl, supaKey)
    console.log('error is', error)
    console.log('data is', data)
    setIsRetrievingSchema(false)
    
    if (data) {
      setDatabaseTables(data)
      console.log('database tables are', data)
      
    

      // Also set legacy tables for schema viewer compatibility
      const legacyTables = data.map(table => ({
        name: table.name,
        type: (table.name.toLowerCase().includes('view') ? 'view' : 'table') as 'view' | 'table',
        columns: Object.entries(table.properties).map(([name, prop]) => ({
          name,
          format: (prop as TableProperty).format,
          type: (prop as TableProperty).type,
          description: (prop as TableProperty).description,
          required: table.required?.includes(name) || false
        })),
        required: table.required
      }))
      setTablesDefinition(legacyTables)
      
      await checkReadAccess(supabaseClient, data)
      await checkInsertAccess(supabaseClient, data)
      await checkUpdateAccess(supabaseClient, data)
      await checkDeleteAccess(supabaseClient, data)
      setIsCurrentlyChecking(null)
      setIsCheckComplete(true)
    } else {
      setIsCheckInProgress(false)
      setIsCheckComplete(true)
      if (error === 'OpenAPI mode disabled' || error === 'Invalid API key') {
        setIsSchemaAccessBlocked(true)
      } else {
        setIsCheckComplete(false)
      }
      setErrorMessage(error || 'Error fetching tables')
    }
  }

  const checkReadAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setIsCurrentlyChecking('read')
    const updatedTables = [...tables]
    for (const table of updatedTables) {
      table.read = await checkReadAccessOnTable(supabaseClient, table)
      if (table.read === null) table.read = 'unlikely'
    }
    setDatabaseTables(updatedTables)
  }

  const checkInsertAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setIsCurrentlyChecking('insert')
    const updatedTables = [...tables]
    for (const table of updatedTables) {
      table.insertedRecord = await checkInsertAccessOnTable(supabaseClient, table)
      table.insert = table.insertedRecord ? true : false
    }
    setDatabaseTables(updatedTables)
  }

  const checkUpdateAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setIsCurrentlyChecking('update')
    const updatedTables = [...tables]
    for (const table of updatedTables) {
      table.update = await checkUpdateAccessOnTable(supabaseClient, table)
    }
    setDatabaseTables(updatedTables)
  }

  const checkDeleteAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setIsCurrentlyChecking('delete')
    const updatedTables = [...tables]
    for (const table of updatedTables) {
      table.delete = await checkDeleteAccessOnTable(supabaseClient, table)
    }
    setDatabaseTables(updatedTables)
  }

  const goBack = () => {
    resetCheckStatus()
  }

  const checkSingleOperation = async (table: DatabaseTable, action: CheckType) => {
    if (isCurrentlyChecking || !supabase) return
    
    const updatedTables = databaseTables.map(t => 
      t.name === table.name ? { ...t } : t
    )
    const targetTable = updatedTables.find(t => t.name === table.name)
    if (!targetTable) return

    if (action === 'read') {
      targetTable.read = await checkReadAccessOnTable(supabase, targetTable)
    } else if (action === 'insert') {
      targetTable.insertedRecord = await checkInsertAccessOnTable(supabase, targetTable)
      targetTable.insert = targetTable.insertedRecord ? true : false
    } else if (action === 'update' && targetTable.insertedRecord) {
      targetTable.update = await checkUpdateAccessOnTable(supabase, targetTable)
    } else if (action === 'delete') {
      targetTable.delete = await checkDeleteAccessOnTable(supabase, targetTable)
    }
    
    setDatabaseTables(updatedTables)
  }









  return showSecurityChecker ? (
    <SecurityChecker
      supaUrl={supaUrl}
      supaKey={supaKey}
      databaseTables={databaseTables}
      isCheckInProgress={isCheckInProgress}
      isRetrievingSchema={isRetrievingSchema}
      isSchemaAccessBlocked={isSchemaAccessBlocked}
      isCheckComplete={isCheckComplete}
      isCurrentlyChecking={isCurrentlyChecking}
      errorMessage={errorMessage}
      tablesDefinition={tablesDefinition}
      doSupaCheck={doSupaCheck}
      goBack={goBack}
      checkSingleOperation={checkSingleOperation}
      setShowSecurityChecker={setShowSecurityChecker}
      setSupaUrl={setSupaUrl}
      setSupaKey={setSupaKey}
    />
  ) : (
    <SchemaViewer
      tablesDefinition={tablesDefinition}
      selectedTable={selectedTable}
      showSecurityChecker={showSecurityChecker}
      setShowSecurityChecker={setShowSecurityChecker}
      setSelectedTable={setSelectedTable}
    />
  )
}

export default App
