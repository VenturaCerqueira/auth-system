import React from 'react'

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary-bg dark:bg-dark-bg transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="bg-primary-surface dark:bg-dark-surface border-b border-primary-border dark:border-dark-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-primary-surface dark:bg-dark-surface border-r border-primary-border dark:border-dark-border p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Title Skeleton */}
            <div className="mb-8">
              <div className="w-64 h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
              <div className="w-96 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8 bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-48 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <div className="mt-2 text-sm text-primary-border dark:text-dark-text">Processando dados...</div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface p-6 rounded-lg shadow-md">
                  <div className="w-32 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                  <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface rounded-lg shadow-md p-6">
                  <div className="w-64 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-4"></div>
                  <div className="w-full h-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* DRE Table Skeleton */}
            <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface rounded-lg shadow-md p-6 mb-8">
              <div className="w-64 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-4"></div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-primary-bg dark:bg-dark-bg border border-primary-border dark:border-dark-border">
                  <thead>
                    <tr className="bg-primary-surface dark:bg-dark-surface">
                      {[...Array(4)].map((_, i) => (
                        <th key={i} className="px-4 py-3 border-b border-primary-border dark:border-dark-border">
                          <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        {[...Array(4)].map((_, colIndex) => (
                          <td key={colIndex} className="px-4 py-3 border-b border-primary-border dark:border-dark-border">
                            <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface p-4 rounded-lg">
                  <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                  <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Footer Skeleton */}
      <div className="bg-primary-surface dark:bg-dark-surface border-t border-primary-border dark:border-dark-border p-4">
        <div className="flex justify-center">
          <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton
