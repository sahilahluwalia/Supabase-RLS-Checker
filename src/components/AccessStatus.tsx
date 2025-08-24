import type { CheckType, DatabaseTable, SecurityStatus } from '../types'
import { getSecurityBorderColor, getSecurityIcon } from '../utils'

interface AccessStatusProps {
  table: DatabaseTable
  action: CheckType
  onClick: () => void
}

export const AccessStatus = ({ table, action, onClick }: AccessStatusProps) => {
  const isLoading = table.checking === action

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <button className="flex items-center justify-center w-12 h-12 border-2 border-gray-400 bg-gray-50" disabled>
          <svg className="animate-spin h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    )
  }

  // Convert DatabaseTable security status to SecurityStatus
  const convertToSecurityStatus = (table: DatabaseTable): SecurityStatus => {
    const convertStatus = (status: boolean | null | 'unlikely') => {
      if (status === true) return 'not_secured'
      if (status === false) return 'secured'
      if (status === 'unlikely') return 'probably_secured'
      return 'unknown'
    }

    return {
      read: convertStatus(table.read),
      insert: convertStatus(table.insert),
      update: convertStatus(table.update),
      delete: convertStatus(table.delete)
    }
  }

  const securityStatus = convertToSecurityStatus(table)

  return (
    <button
      onClick={onClick}
      disabled={!!table.checking}
      className={`inline-flex items-center justify-center w-12 h-12 border-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getSecurityBorderColor(securityStatus[action])}`}
    >
      {getSecurityIcon(securityStatus[action])}
    </button>
  )
}
