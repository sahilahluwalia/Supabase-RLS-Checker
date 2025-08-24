
import type { DatabaseTable, CheckType, TableDefinition, SecurityStatus } from '../types'
import { getSecurityBorderColor, getSecurityIcon } from '../utils'
import { AccessStatus } from './AccessStatus'

interface SecurityCheckerProps {
  // User Inputs
  supaUrl: string
  supaKey: string

  // Server Check Status
  databaseTables: DatabaseTable[]
  isCheckInProgress: boolean
  isRetrievingSchema: boolean
  isSchemaAccessBlocked: boolean
  isCheckComplete: boolean
  isCurrentlyChecking: CheckType | null
  errorMessage: string | null

  // Legacy state for schema viewer compatibility
  tablesDefinition: TableDefinition[]

  // Functions
  doSupaCheck: () => void
  goBack: () => void
  checkSingleOperation: (table: DatabaseTable, action: CheckType) => void
  setShowSecurityChecker: (show: boolean) => void
  setSupaUrl: (url: string) => void
  setSupaKey: (key: string) => void
}

export const SecurityChecker = ({
  supaUrl,
  supaKey,
  databaseTables,
  isCheckInProgress,
  isRetrievingSchema,
  isSchemaAccessBlocked,
  isCheckComplete,
  isCurrentlyChecking,
  errorMessage,
  tablesDefinition,
  doSupaCheck,
  goBack,
  checkSingleOperation,
  setShowSecurityChecker,
  setSupaUrl,
  setSupaKey
}: SecurityCheckerProps) => {
  // Helper function to convert DatabaseTable security status to SecurityStatus
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

  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="border-l-8 border-blue-600 pl-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 uppercase tracking-wide">Supabase Security Checker</h1>
            <p className="text-xl text-gray-700 font-medium">Check your Supabase RLS policy settings</p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 ">
              <p className="text-sm text-blue-800 font-medium">
                <strong>Note:</strong> This is completely frontend code, no backend is used. All requests are sent via your browser only.
                Nothing is saved on our server. Click on the bottom GitHub code link to see the code of this app.
              </p>
            </div>
          </div>

          {/* Top Action Buttons - Only show after check is complete */}
          {isCheckComplete && (
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={goBack}
                disabled={!!isCurrentlyChecking}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold uppercase tracking-wide border-2 border-blue-700 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Configuration
              </button>
              {tablesDefinition.length > 0 && (
                <button
                  onClick={() => setShowSecurityChecker(false)}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-700 text-white font-bold uppercase tracking-wide border-2 border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  View Database Schema
                </button>
              )}
            </div>
          )}
        </div>

        {/* Not Checking - Input Form */}
        {!isCheckInProgress && !isCheckComplete && (
          <div className="bg-white border-2 border-gray-400 p-8 mb-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide border-b-2 border-gray-300 pb-2">Database Configuration</h2>
              <p className="text-sm text-gray-700 font-medium">Connect to your Supabase instance to analyze security policies</p>
            </div>
            <div className="grid md:grid-cols-1 gap-8 mb-8">
              <div className="space-y-3">
                <label htmlFor="supabase-url" className="block text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1">
                  Supabase URL
                </label>
                <input
                  id="supabase-url"
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supaUrl}
                  onChange={e => setSupaUrl(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-400 bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-blue-50 transition-colors font-mono text-sm"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="supabase-key" className="block text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1">
                  Supabase Anon Key
                </label>
                <textarea
                  id="supabase-key"
                  placeholder="Enter your anon key"
                  value={supaKey}
                  rows={3}
                  // size locked to 3 rows
                  style={{ resize: 'none' }}
                  onChange={e => setSupaKey(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-400 bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-blue-50 transition-colors font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={doSupaCheck}
                disabled={isCheckInProgress || !supaUrl || !supaKey}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold uppercase tracking-wide border-2 border-blue-700 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Check Security
              </button>
            </div>
            {errorMessage && (
              <div className="mt-6 p-4 bg-red-100 border-2 border-red-500 text-red-900 font-medium">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorMessage}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checking in Progress */}
        {(isCheckInProgress || isCheckComplete) && (
          <div>
            {/* If Schema Access was Blocked */}
            {isSchemaAccessBlocked && (
              <div className="bg-yellow-50 border-2 border-yellow-400 p-8 mb-8">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-yellow-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-yellow-800 mb-4 uppercase tracking-wide">Schema Access Blocked</h3>
                  <p className="text-base text-yellow-700 mb-8 font-medium leading-relaxed">
                    Your Supabase project has OpenAPI mode disabled or the API key is invalid.
                    Enable it in your project settings to use this tool.
                  </p>
                  <button
                    onClick={goBack}
                    disabled={isCheckInProgress}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold uppercase tracking-wide border-2 border-blue-700 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Configuration
                  </button>
                </div>
              </div>
            )}

            {/* Getting Tables / Checking */}
            {!isSchemaAccessBlocked && (
              <>
                {!isCheckComplete && (
                  <div className="w-full flex flex-row items-center justify-center mb-12 p-8 bg-white border-2 border-gray-300">
                    <div className="flex-shrink-0 flex items-center justify-center h-full">
                      <svg className="animate-spin h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col items-center justify-center ml-8">
                      <div className="text-xl font-bold text-gray-900 uppercase tracking-wide text-center">
                        {isRetrievingSchema && 'Retrieving Database Tables...'}
                        {isCurrentlyChecking && `Testing ${isCurrentlyChecking} Access...`}
                      </div>
                      <div className="mt-4 text-base text-gray-600 font-medium text-center">
                        This may take a few moments
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Legend */}
                {databaseTables.length > 0 && (
                  <div className="bg-white border-2 border-gray-400 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wide border-b-2 border-gray-300 pb-2">Security Status Reference</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="flex items-start space-x-4 p-4 border-2 border-red-500 bg-red-100">
                        <div className="text-red-700 mt-1">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-red-900 text-sm uppercase tracking-wide border-b border-red-400 pb-1 mb-2">Not Secured</div>
                          <div className="text-sm text-red-800 font-medium">Anonymous users can access this operation</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4 p-4 border-2 border-green-500 bg-green-100">
                        <div className="text-green-700 mt-1">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-green-900 text-sm uppercase tracking-wide border-b border-green-400 pb-1 mb-2">Secured</div>
                          <div className="text-sm text-green-800 font-medium">Anonymous users cannot access this operation</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4 p-4 border-2 border-blue-500 bg-blue-100">
                        <div className="text-blue-700 mt-1">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8" fill="#3b82f6" />
          <path d="M10 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" fill="#ffffff" />

                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-blue-900 text-sm uppercase tracking-wide border-b border-blue-400 pb-1 mb-2">Probably Secured</div>
                          <div className="text-sm text-blue-800 font-medium">Likely protected but requires verification</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4 p-4 border-2 border-gray-500 bg-gray-100">
                        <div className="text-gray-700 mt-1">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-400 pb-1 mb-2">Unknown</div>
                          <div className="text-sm text-gray-700 font-medium">Security status not yet analyzed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Table */}
                {databaseTables.length > 0 && (
                  <div className="bg-white border-2 border-gray-400 overflow-hidden mb-8">
                    <div className="px-8 py-6 border-b-2 border-gray-300 bg-gray-100 flex justify-between">
                      <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Security Analysis Results</h2>
                      {/* <p className="text-sm text-slate-600 mt-2 font-medium border-t border-slate-300 pt-2"> */}
                      <p>
                      <p className="text-gray-700 font-medium">
                        {tablesDefinition.length} objects, {" "}
                        {tablesDefinition.filter(t => t.type === 'table').length} tables, {tablesDefinition.filter(t => t.type === 'view').length} views {" "} analyzed
                      </p>
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-200 border-b-2 border-gray-400">
                          <tr>
                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wide border-r border-gray-300">
                              Table Name
                            </th>
                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wide border-r border-gray-300">
                              Read Access
                            </th>
                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wide border-r border-gray-300">
                              Insert Access
                            </th>
                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wide border-r border-gray-300">
                              Update Access
                            </th>
                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-800 uppercase tracking-wide">
                              Delete Access
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {databaseTables.map((table, index) => (
                            <tr key={table.name} className={`border-b-2 border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-4 py-3 whitespace-nowrap border-r border-gray-300">
                                <div className="text-sm font-bold text-gray-900 uppercase tracking-wide">{table.name}</div>
                              </td>
                              <td className="px-4 py-3  whitespace-nowrap text-center border-r border-gray-300">
                                <AccessStatus
                                  table={table}
                                  action="read"
                                  onClick={() => checkSingleOperation(table, 'read')}
                                />
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap text-center border-r border-gray-300">
                                <AccessStatus
                                  table={table}
                                  action="insert"
                                  onClick={() => checkSingleOperation(table, 'insert')}
                                />
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap text-center border-r border-gray-300">
                                <AccessStatus
                                  table={table}
                                  action="update"
                                  onClick={() => checkSingleOperation(table, 'update')}
                                />
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap text-center">
                                <div className={`inline-flex items-center  justify-center w-12 h-12 border-2 ${getSecurityBorderColor(convertToSecurityStatus(table).delete)} bg-gray-50`}>
                                  {getSecurityIcon(convertToSecurityStatus(table).delete)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}


              </>
            )}
          </div>
        )}

        {/* Floating GitHub Button */}
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900 p-4 rounded-full shadow-xl hover:shadow-2xl border-2 border-gray-300 transition-all duration-300 z-50 group"
          aria-label="View on GitHub"
        >
          <svg className="w-6 h-6" viewBox="0 0 17 16" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M8.5 2.22168C5.23312 2.22168 2.58496 4.87398 2.58496 8.14677C2.58496 10.7642 4.27962 12.9853 6.63026 13.7684C6.92601 13.8228 7.03366 13.6401 7.03366 13.4827C7.03366 13.3425 7.02893 12.9693 7.02597 12.4754C5.38041 12.8333 5.0332 11.681 5.0332 11.681C4.76465 10.996 4.37663 10.8139 4.37663 10.8139C3.83954 10.4471 4.41744 10.4542 4.41744 10.4542C5.01072 10.4956 5.32303 11.0647 5.32303 11.0647C5.85065 11.9697 6.70774 11.7082 7.04431 11.5568C7.09873 11.1741 7.25134 10.9132 7.42051 10.7654C6.10737 10.6157 4.72621 10.107 4.72621 7.83683C4.72621 7.19031 4.95689 6.66092 5.33486 6.24686C5.27394 6.09721 5.07105 5.49447 5.39283 4.67938C5.39283 4.67938 5.88969 4.51967 7.01947 5.28626C7.502 5.15466 7.99985 5.08763 8.5 5.08692C9.00278 5.08929 9.50851 5.15495 9.98113 5.28626C11.1103 4.51967 11.606 4.67879 11.606 4.67879C11.9289 5.49447 11.7255 6.09721 11.6651 6.24686C12.0437 6.66092 12.2732 7.19031 12.2732 7.83683C12.2732 10.1129 10.8897 10.6139 9.5724 10.7606C9.78475 10.9434 9.97344 11.3048 9.97344 11.8579C9.97344 12.6493 9.96634 13.2887 9.96634 13.4827C9.96634 13.6413 10.0728 13.8258 10.3733 13.7678C11.5512 13.3728 12.5751 12.6175 13.3003 11.6089C14.0256 10.6002 14.4155 9.38912 14.415 8.14677C14.415 4.87398 11.7663 2.22168 8.5 2.22168Z"/>
          </svg>
          {/* Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            View on GitHub
          </span>
        </a>
      </div>
    </div>
  )
}
