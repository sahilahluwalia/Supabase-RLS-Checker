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

// Utility function to batch tables into chunks of 10
const batchTables = (tables: DatabaseTable[], batchSize: number = 10): DatabaseTable[][] => {
  const batches: DatabaseTable[][] = []
  for (let i = 0; i < tables.length; i += batchSize) {
    batches.push(tables.slice(i, i + batchSize))
  }
  return batches
}

// Utility function to add timeout to promises
const withTimeout = function<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Interface definitions are now imported from './types'

function App() {
  // Consolidated user inputs and connection state
  const [connectionState, setConnectionState] = useState<{
    supaUrl: string
    supaKey: string
    supabase: SupabaseClient | null
  }>({
    supaUrl: '',
    supaKey: '',
    supabase: null
  })

  // Consolidated check status
  const [checkStatus, setCheckStatus] = useState<{
    isCheckInProgress: boolean
    isRetrievingSchema: boolean
    isSchemaAccessBlocked: boolean
    isCheckComplete: boolean
    isCurrentlyChecking: CheckType | null
    errorMessage: string | null
  }>({
    isCheckInProgress: false,
    isRetrievingSchema: false,
    isSchemaAccessBlocked: false,
    isCheckComplete: false,
    isCurrentlyChecking: null,
    errorMessage: null
  })

  // Progress tracking
  const [overallProgress, setOverallProgress] = useState<{
    currentOperation: CheckType | null
    completedOperations: CheckType[]
    totalOperations: number
    totalTables: number
    processedTables: number
    operationProgress: {
      read: { completed: number; total: number }
      insert: { completed: number; total: number }
      update: { completed: number; total: number }
      delete: { completed: number; total: number }
    }
  }>({
    currentOperation: null,
    completedOperations: [],
    totalOperations: 4,
    totalTables: 0,
    processedTables: 0,
    operationProgress: {
      read: { completed: 0, total: 0 },
      insert: { completed: 0, total: 0 },
      update: { completed: 0, total: 0 },
      delete: { completed: 0, total: 0 }
    }
  })

  // Data state
  const [dataState, setDataState] = useState<{
    databaseTables: DatabaseTable[]
    tablesDefinition: TableDefinition[]
    selectedTable: string | null
    showSecurityChecker: boolean
  }>({
    databaseTables: [],
    tablesDefinition: [],
    selectedTable: null,
    showSecurityChecker: true
  })

  const resetCheckStatus = () => {
    setCheckStatus({
      isCheckInProgress: false,
      isRetrievingSchema: false,
      isSchemaAccessBlocked: false,
      isCheckComplete: false,
      isCurrentlyChecking: null,
      errorMessage: null
    })
    setOverallProgress({
      currentOperation: null,
      completedOperations: [],
      totalOperations: 4,
      totalTables: 0,
      processedTables: 0,
      operationProgress: {
        read: { completed: 0, total: 0 },
        insert: { completed: 0, total: 0 },
        update: { completed: 0, total: 0 },
        delete: { completed: 0, total: 0 }
      }
    })
  }

  const doSupaCheck = async () => {
    if (checkStatus.isCheckInProgress || !connectionState.supaUrl || !connectionState.supaKey) return

    // validate URL
    const urlRegex = new RegExp('https://[a-zA-Z0-9-]+.supabase.co')
    if (!urlRegex.test(connectionState.supaUrl)) {
      setCheckStatus(prev => ({ ...prev, errorMessage: 'Invalid Supabase URL' }))
      return
    }

    const cleanUrl = connectionState.supaUrl.replace(/\/$/, '')
    const supabaseClient = createClient(cleanUrl, connectionState.supaKey)
    setConnectionState(prev => ({ ...prev, supabase: supabaseClient }))

    resetCheckStatus()
    setCheckStatus(prev => ({
      ...prev,
      isCheckInProgress: true,
      isRetrievingSchema: true
    }))
    
    const { data, error } = await getDatabaseSchema(cleanUrl, connectionState.supaKey)
    setCheckStatus(prev => ({ ...prev, isRetrievingSchema: false }))

    if (data) {
      setDataState(prev => ({ ...prev, databaseTables: data }))
      setOverallProgress(prev => ({
        ...prev,
        totalTables: data.length,
        operationProgress: {
          read: { completed: 0, total: data.length },
          insert: { completed: 0, total: data.length },
          update: { completed: 0, total: data.length },
          delete: { completed: 0, total: data.length }
        }
      }))

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
      setDataState(prev => ({ ...prev, tablesDefinition: legacyTables }))
      console.log('legacyTables', legacyTables)
      try {
        await checkReadAccess(supabaseClient, data)
        await checkInsertAccess(supabaseClient, data)
        await checkUpdateAccess(supabaseClient, data)
        await checkDeleteAccess(supabaseClient, data)
        setCheckStatus(prev => ({
          ...prev,
          isCurrentlyChecking: null,
          isCheckComplete: true
        }))
      } catch (checkError) {
        console.error('Error during security checks:', checkError)
        setCheckStatus(prev => ({
          ...prev,
          isCurrentlyChecking: null,
          isCheckInProgress: false,
          isCheckComplete: true,
          errorMessage: 'Error during security checks: ' + (checkError instanceof Error ? checkError.message : 'Unknown error')
        }))
      }
    } else {
      setCheckStatus(prev => {
        const newState = { ...prev, isCheckInProgress: false, isCheckComplete: true }
        if (error === 'OpenAPI mode disabled' || error === 'Invalid API key') {
          newState.isSchemaAccessBlocked = true
        } else {
          newState.isCheckComplete = false
        }
        newState.errorMessage = error || 'Error fetching tables'
        return newState
      })
    }
  }

  const checkReadAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setCheckStatus(prev => ({ ...prev, isCurrentlyChecking: 'read' }))
    setOverallProgress(prev => ({ ...prev, currentOperation: 'read' }))
    const updatedTables = [...tables]

    try {
      if (updatedTables.length <= 10) {
        // Sequential processing for small number of tables
        for (let i = 0; i < updatedTables.length; i++) {
          const table = updatedTables[i]
          table.read = await checkReadAccessOnTable(supabaseClient, table)
          if (table.read === null) table.read = 'unlikely'

          // Update progress for each table (within 0-25% range)
          const completedInOperation = i + 1
          setOverallProgress(prev => ({
            ...prev,
            processedTables: prev.processedTables + 1,
            operationProgress: {
              ...prev.operationProgress,
              read: { completed: completedInOperation, total: prev.totalTables }
            }
          }))
        }
      } else {
        // Batch processing for large number of tables (10 at a time)
        const batches = batchTables(updatedTables, 10)
        console.log(`Processing ${batches.length} batches of 10 tables each for read access`)

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i]
          console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} tables)`)

          const promises = batch.map(async (table) => {
            try {
              console.log(`Checking read access for table: ${table.name}`)
              const result = await withTimeout(checkReadAccessOnTable(supabaseClient, table), 15000)
              table.read = result === null ? 'unlikely' : result
              console.log(`Read access result for ${table.name}: ${table.read}`)
              return table
            } catch (tableError) {
              console.error(`Error checking read access for table ${table.name}:`, tableError)
              table.read = 'unlikely' // Set default value on error
              return table
            }
          })

          try {
            console.log(`Waiting for batch ${i + 1} promises to resolve...`)
            await Promise.all(promises)
            console.log(`Batch ${i + 1}/${batches.length} completed successfully`)

            // Update progress after each batch (within 0-25% range)
            const completedInOperation = (i + 1) * 10
            setOverallProgress(prev => ({
              ...prev,
              processedTables: prev.processedTables + batch.length,
              operationProgress: {
                ...prev.operationProgress,
                read: { completed: Math.min(completedInOperation, prev.totalTables), total: prev.totalTables }
              }
            }))
          } catch (batchError) {
            console.error(`Error in batch ${i + 1}:`, batchError)
            // Continue with next batch even if this one had errors
          }

          // Update state after each batch to ensure UI reflects progress
          console.log(`Updating UI after batch ${i + 1}`)
          setDataState(prev => ({ ...prev, databaseTables: [...updatedTables] }))
        }
        console.log('All read access batches completed')
      }

      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      setOverallProgress(prev => ({
        ...prev,
        completedOperations: [...prev.completedOperations, 'read'],
        currentOperation: null
      }))
    } catch (error) {
      console.error('Error in checkReadAccess:', error)
      // Update tables with error state
      updatedTables.forEach(table => {
        if (table.read === undefined || table.read === null) {
          table.read = 'unlikely'
        }
      })
      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      throw error // Re-throw to be caught by the main try-catch
    }
  }

  const checkInsertAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setCheckStatus(prev => ({ ...prev, isCurrentlyChecking: 'insert' }))
    setOverallProgress(prev => ({ ...prev, currentOperation: 'insert' }))
    const updatedTables = [...tables]

    try {
      if (updatedTables.length <= 10) {
        // Sequential processing for small number of tables
        for (const table of updatedTables) {
          table.insertedRecord = await checkInsertAccessOnTable(supabaseClient, table)
          table.insert = table.insertedRecord ? true : false
        }
      } else {
        // Batch processing for large number of tables (10 at a time)
        const batches = batchTables(updatedTables, 10)
        console.log(`Processing ${batches.length} batches of 10 tables each for insert access`)

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i]
          console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} tables)`)

          const promises = batch.map(async (table) => {
            try {
              console.log(`Checking insert access for table: ${table.name}`)
              table.insertedRecord = await withTimeout(checkInsertAccessOnTable(supabaseClient, table), 15000)
              table.insert = table.insertedRecord ? true : false
              console.log(`Insert access result for ${table.name}: ${table.insert}`)
              return table
            } catch (tableError) {
              console.error(`Error checking insert access for table ${table.name}:`, tableError)
              table.insert = false // Set default value on error
              return table
            }
          })

          try {
            console.log(`Waiting for batch ${i + 1} promises to resolve...`)
            await Promise.all(promises)
            console.log(`Batch ${i + 1}/${batches.length} completed successfully`)

            // Update progress after each batch (within 25-50% range)
            const completedInOperation = (i + 1) * 10
            setOverallProgress(prev => ({
              ...prev,
              processedTables: prev.processedTables + batch.length,
              operationProgress: {
                ...prev.operationProgress,
                insert: { completed: Math.min(completedInOperation, prev.totalTables), total: prev.totalTables }
              }
            }))
          } catch (batchError) {
            console.error(`Error in batch ${i + 1}:`, batchError)
            // Continue with next batch even if this one had errors
          }

          // Update state after each batch to ensure UI reflects progress
          console.log(`Updating UI after batch ${i + 1}`)
          setDataState(prev => ({ ...prev, databaseTables: [...updatedTables] }))
        }
        console.log('All insert access batches completed')
      }

      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      setOverallProgress(prev => ({
        ...prev,
        completedOperations: [...prev.completedOperations, 'insert'],
        currentOperation: null
      }))
    } catch (error) {
      console.error('Error in checkInsertAccess:', error)
      // Update tables with error state
      updatedTables.forEach(table => {
        if (table.insert === undefined || table.insert === null) {
          table.insert = false
        }
      })
      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      throw error // Re-throw to be caught by the main try-catch
    }
  }

  const checkUpdateAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setCheckStatus(prev => ({ ...prev, isCurrentlyChecking: 'update' }))
    setOverallProgress(prev => ({ ...prev, currentOperation: 'update' }))
    const updatedTables = [...tables]

    try {
      if (updatedTables.length <= 10) {
        // Sequential processing for small number of tables
        for (const table of updatedTables) {
          table.update = await checkUpdateAccessOnTable(supabaseClient, table)
        }
      } else {
        // Batch processing for large number of tables (10 at a time)
        const batches = batchTables(updatedTables, 10)
        setOverallProgress(prev => ({ ...prev, totalBatches: batches.length, isBatchProcessing: true }))

        console.log(`Processing ${batches.length} batches of 10 tables each for update access`)

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i]
          setOverallProgress(prev => ({ ...prev, currentBatch: i + 1 }))
          console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} tables)`)

          const promises = batch.map(async (table) => {
            try {
              console.log(`Checking update access for table: ${table.name}`)
              table.update = await withTimeout(checkUpdateAccessOnTable(supabaseClient, table), 15000)
              console.log(`Update access result for ${table.name}: ${table.update}`)
              return table
            } catch (tableError) {
              console.error(`Error checking update access for table ${table.name}:`, tableError)
              table.update = false // Set default value on error
              return table
            }
          })

          try {
            console.log(`Waiting for batch ${i + 1} promises to resolve...`)
            await Promise.all(promises)
            console.log(`Batch ${i + 1}/${batches.length} completed successfully`)
          } catch (batchError) {
            console.error(`Error in batch ${i + 1}:`, batchError)
            // Continue with next batch even if this one had errors
          }

          // Update state after each batch to ensure UI reflects progress
          console.log(`Updating UI after batch ${i + 1}`)
          setDataState(prev => ({ ...prev, databaseTables: [...updatedTables] }))
        }
        console.log('All update access batches completed')
      }

      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      setOverallProgress(prev => ({
        ...prev,
        completedOperations: [...prev.completedOperations, 'update'],
        currentOperation: null
      }))
    } catch (error) {
      console.error('Error in checkUpdateAccess:', error)
      // Update tables with error state
      updatedTables.forEach(table => {
        if (table.update === undefined || table.update === null) {
          table.update = false
        }
      })
      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      throw error // Re-throw to be caught by the main try-catch
    }
  }

  const checkDeleteAccess = async (supabaseClient: SupabaseClient, tables: DatabaseTable[]) => {
    setCheckStatus(prev => ({ ...prev, isCurrentlyChecking: 'delete' }))
    setOverallProgress(prev => ({ ...prev, currentOperation: 'delete' }))
    const updatedTables = [...tables]

    try {
      if (updatedTables.length <= 10) {
        // Sequential processing for small number of tables
        for (const table of updatedTables) {
          table.delete = await checkDeleteAccessOnTable(supabaseClient, table)
        }
      } else {
        // Batch processing for large number of tables (10 at a time)
        const batches = batchTables(updatedTables, 10)
        setOverallProgress(prev => ({ ...prev, totalBatches: batches.length, isBatchProcessing: true }))

        console.log(`Processing ${batches.length} batches of 10 tables each for delete access`)

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i]
          setOverallProgress(prev => ({ ...prev, currentBatch: i + 1 }))
          console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} tables)`)

          const promises = batch.map(async (table) => {
            try {
              console.log(`Checking delete access for table: ${table.name}`)
              table.delete = await withTimeout(checkDeleteAccessOnTable(supabaseClient, table), 15000)
              console.log(`Delete access result for ${table.name}: ${table.delete}`)
              return table
            } catch (tableError) {
              console.error(`Error checking delete access for table ${table.name}:`, tableError)
              table.delete = false // Set default value on error
              return table
            }
          })

          try {
            console.log(`Waiting for batch ${i + 1} promises to resolve...`)
            await Promise.all(promises)
            console.log(`Batch ${i + 1}/${batches.length} completed successfully`)
          } catch (batchError) {
            console.error(`Error in batch ${i + 1}:`, batchError)
            // Continue with next batch even if this one had errors
          }

          // Update state after each batch to ensure UI reflects progress
          console.log(`Updating UI after batch ${i + 1}`)
          setDataState(prev => ({ ...prev, databaseTables: [...updatedTables] }))
        }
        console.log('All delete access batches completed')
      }

      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      setOverallProgress(prev => ({
        ...prev,
        completedOperations: [...prev.completedOperations, 'delete'],
        currentOperation: null
      }))
    } catch (error) {
      console.error('Error in checkDeleteAccess:', error)
      // Update tables with error state
      updatedTables.forEach(table => {
        if (table.delete === undefined || table.delete === null) {
          table.delete = false
        }
      })
      setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
      throw error // Re-throw to be caught by the main try-catch
    }
  }

  const goBack = () => {
    resetCheckStatus()
  }

  const checkSingleOperation = async (table: DatabaseTable, action: CheckType) => {
    if (checkStatus.isCurrentlyChecking || !connectionState.supabase) return

    const updatedTables = dataState.databaseTables.map((t: DatabaseTable) =>
      t.name === table.name ? { ...t } : t
    )
    const targetTable = updatedTables.find(t => t.name === table.name)
    if (!targetTable) return

    if (action === 'read') {
      targetTable.read = await checkReadAccessOnTable(connectionState.supabase, targetTable)
    } else if (action === 'insert') {
      targetTable.insertedRecord = await checkInsertAccessOnTable(connectionState.supabase, targetTable)
      targetTable.insert = targetTable.insertedRecord ? true : false
    } else if (action === 'update' && targetTable.insertedRecord) {
      targetTable.update = await checkUpdateAccessOnTable(connectionState.supabase, targetTable)
    } else if (action === 'delete') {
      targetTable.delete = await checkDeleteAccessOnTable(connectionState.supabase, targetTable)
    }

    setDataState(prev => ({ ...prev, databaseTables: updatedTables }))
  }









  return dataState.showSecurityChecker ? (
    <SecurityChecker
      supaUrl={connectionState.supaUrl}
      supaKey={connectionState.supaKey}
      databaseTables={dataState.databaseTables}
      checkStatus={checkStatus}
      tablesDefinition={dataState.tablesDefinition}
      overallProgress={overallProgress}
      doSupaCheck={doSupaCheck}
      goBack={goBack}
      checkSingleOperation={checkSingleOperation}
      setShowSecurityChecker={(show) => setDataState(prev => ({ ...prev, showSecurityChecker: show }))}
      setSupaUrl={(url) => setConnectionState(prev => ({ ...prev, supaUrl: url }))}
      setSupaKey={(key) => setConnectionState(prev => ({ ...prev, supaKey: key }))}
    />
  ) : (
    <SchemaViewer
      tablesDefinition={dataState.tablesDefinition}
      selectedTable={dataState.selectedTable}
      showSecurityChecker={dataState.showSecurityChecker}
      setShowSecurityChecker={(show) => setDataState(prev => ({ ...prev, showSecurityChecker: show }))}
      setSelectedTable={(table) => setDataState(prev => ({ ...prev, selectedTable: table }))}
    />
  )
}

export default App
