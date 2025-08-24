import type { TableDefinition } from '../types'
import { getTypeColor, getRequiredBadge, getTableTypeBadge } from '../utils'
import { FloatingGitHubButton } from './FloatingGitHubButton'

interface SchemaViewerProps {
  tablesDefinition: TableDefinition[]
  selectedTable: string | null
  showSecurityChecker: boolean
  setShowSecurityChecker: (show: boolean) => void
  setSelectedTable: (table: string | null) => void
}

export const SchemaViewer = ({
  tablesDefinition,
  selectedTable,
  showSecurityChecker,
  setShowSecurityChecker,
  setSelectedTable
}: SchemaViewerProps) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="border-l-8 border-blue-600 pl-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-10">
            <button
              onClick={() => setShowSecurityChecker(true)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold uppercase tracking-wide border-2 border-blue-700 hover:bg-blue-700 transition-colors mb-4 md:mb-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Security
            </button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-3 uppercase tracking-wide text-left">Database Schema</h1>
              <p className="text-xl text-slate-600 font-medium text-left">Explore your database structure and column definitions</p>
            </div>
          </div>
        </div>

        {/* Schema Display - Fixed Width Two Column Layout */}
        {!showSecurityChecker && tablesDefinition.length > 0 && (
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-12 gap-8">
              {/* Left Panel - Tables List - Fixed Width */}
              <div className="col-span-3">
                <div className="bg-white border-2 border-slate-300 h-full flex flex-col">
                  <div className="px-6 py-5 border-b-2 border-slate-200 bg-slate-50 flex-shrink-0">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                        Tables & Views
                      </h2>
                      <p className="text-sm text-slate-600 mt-2 font-medium border-t border-slate-300 pt-2">
                        {tablesDefinition.length} objects, {" "}
                        {tablesDefinition.filter(t => t.type === 'table').length} tables, {tablesDefinition.filter(t => t.type === 'view').length} views
                      </p>
                    </div>
                  </div>


                  {/* Tables List - Scrollable */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="divide-y-2 divide-slate-300">
                      {tablesDefinition.map((table) => (
                        <div
                          key={table.name}
                          className={`group px-6 py-4 cursor-pointer transition-all duration-200 ${
                            selectedTable === table.name
                              ? 'bg-blue-50 border-r-8 border-blue-500'
                              : 'hover:bg-slate-50 border-r-8 border-transparent'
                          }`}
                          onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 min-w-0 flex-1 ">
                              <div className={`w-3 rounded-full h-3 flex-shrink-0 border-2 ${
                                table.type === 'view' ? 'border-purple-400 bg-purple-100' : 'border-blue-400 bg-blue-100'
                              }`}></div>
                              <div className="min-w-0 flex-1 ">
                                <h3 className="font-bold text-slate-900 truncate text-sm group-hover:text-blue-700 transition-colors uppercase  text-left">
                                  {table.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className={`px-3 py-1  text-xs font-bold border-2 ${
                                    table.type === 'view' ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-blue-100 text-blue-700 border-blue-300'
                                  }`}>
                                    {table.type.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-slate-500 font-medium border-l-2 border-slate-300 pl-3">
                                    {table.columns.length} columns
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Table Details - Fixed Width */}
              <div className="col-span-9">
              {!selectedTable ? (
                <div className="bg-white border-2 border-slate-300 h-full flex flex-col">
                  <div className="px-8 py-6 bg-slate-50 border-b-2 border-slate-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl text-left font-bold text-slate-900 mb-2 uppercase tracking-wide">
                          No Table Selected
                        </h3>
                        <div className="text-base text-slate-600 font-medium">
                          Select any table to examine its structure
                        </div>
                      </div>
                      <div className="w-[88px]"></div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-100 border-2 border-slate-300 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4 uppercase tracking-wide">Select an Object</h3>
                      <p className="text-slate-600 text-base max-w-md font-medium leading-relaxed">Choose a table or view from the list to examine its detailed structure and column definitions.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-slate-300 h-full flex flex-col">
                  <div className="px-8 py-6 bg-slate-50 border-b-2 border-slate-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-wide">
                          {selectedTable}
                        </h3>
                        <div className="flex items-center gap-4 text-base text-slate-600 font-medium">
                          <span className="border-r-2 border-slate-300 pr-4">{tablesDefinition.find(t => t.name === selectedTable)?.columns.length} columns</span>
                          {getTableTypeBadge(tablesDefinition.find(t => t.name === selectedTable)?.type || 'table')}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTable(null)}
                        className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-100 border-2 border-slate-300 text-slate-700 font-bold hover:bg-slate-200 transition-colors text-sm uppercase tracking-wide"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full min-w-full">
                      <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase tracking-wide border-r-2 border-slate-300 min-w-48">
                            Column Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase tracking-wide border-r-2 border-slate-300 min-w-24">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase tracking-wide border-r-2 border-slate-300 min-w-20">
                            Format
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase tracking-wide border-r-2 border-slate-300 min-w-24">
                            Required
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase tracking-wide border-r-2 border-slate-300 min-w-28">
                            Default
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase tracking-wide min-w-32">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {tablesDefinition
                          .find(t => t.name === selectedTable)
                          ?.columns.map((column, index) => (
                            <tr key={column.name} className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                              <td className="px-4 py-3 border-r-2 border-slate-300 align-top">
                                <div className="flex items-center space-x-3 min-w-48">
                                  <span className="font-bold text-slate-900 text-sm uppercase tracking-wide break-words">{column.name}</span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {column.description?.includes('Primary Key') && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300 uppercase tracking-wide">
                                        PK
                                      </span>
                                    )}
                                    {column.description?.includes('Foreign Key') && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300 uppercase tracking-wide">
                                        FK
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 border-r-2 border-slate-300 align-top min-w-24">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-bold border-2 uppercase tracking-wide ${getTypeColor(column.type)}`}>
                                  {column.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700 border-r-2 border-slate-300 font-medium align-top min-w-20">
                                {column.format || '—'}
                              </td>
                              <td className="px-4 py-3 border-r-2 border-slate-300 align-top min-w-24">
                                {getRequiredBadge(column.required || false)}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700 border-r-2 border-slate-300 align-top min-w-28">
                                {column.default ? (
                                  <span className="bg-slate-100 px-2 py-1 text-xs font-mono border-2 border-slate-300 block font-medium break-all">
                                    {typeof column.default === 'string' ? `"${column.default}"` : column.default.toString()}
                                  </span>
                                ) : (
                                  <span className="font-medium">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700 font-medium align-top min-w-32">
                                <div className="break-words" title={column.description}>
                                  {column.description ? column.description.replace(/Note:\n|\.<pk\/>|\.<fk.*?\/>/g, '') : '—'}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        <FloatingGitHubButton />
      </div>
    </div>
  )
}
