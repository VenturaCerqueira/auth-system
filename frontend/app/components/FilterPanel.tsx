'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Calendar, Users, Building, MapPin, X, Clock } from 'lucide-react'

interface FilterPanelProps {
  filters: {
    period: string
    dateRange: { start: string; end: string }
    suppliers: string[]
    accounts: string[]
    markets: string[]
    showFilters: boolean
  }
  setFilters: React.Dispatch<React.SetStateAction<{
    period: string
    dateRange: { start: string; end: string }
    suppliers: string[]
    accounts: string[]
    markets: string[]
    showFilters: boolean
  }>>
  availableSuppliers: string[]
  availableAccounts: string[]
  availableMarkets: string[]
  availablePeriods?: string[]
  onFiltersChange?: (filters: any) => void
}

export default function FilterPanel({
  filters,
  setFilters,
  availableSuppliers,
  availableAccounts,
  availableMarkets,
  onFiltersChange
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const periodOptions = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'annual', label: 'Anual' },
    { value: 'daily', label: 'Diário' },
    { value: 'custom', label: 'Personalizado' }
  ]

  const handlePeriodChange = (period: string) => {
    setFilters(prev => ({
      ...prev,
      period,
      dateRange: period === 'custom' ? prev.dateRange : { start: '', end: '' }
    }))
    if (onFiltersChange) {
      onFiltersChange({ ...filters, period, dateRange: period === 'custom' ? filters.dateRange : { start: '', end: '' } })
    }
  }

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newDateRange = { ...filters.dateRange, [type]: value }
    setFilters(prev => ({
      ...prev,
      dateRange: newDateRange
    }))
    if (onFiltersChange) {
      onFiltersChange({ ...filters, dateRange: newDateRange })
    }
  }

  const toggleFilter = (type: 'suppliers' | 'accounts' | 'markets', value: string) => {
    const newFilters = {
      ...filters,
      [type]: filters[type].includes(value)
        ? filters[type].filter(item => item !== value)
        : [...filters[type], value]
    }
    setFilters(newFilters)
    if (onFiltersChange) {
      onFiltersChange(newFilters)
    }
  }

  const clearFilters = () => {
    const clearedFilters = {
      ...filters,
      dateRange: { start: '', end: '' },
      suppliers: [],
      accounts: [],
      markets: []
    }
    setFilters(clearedFilters)
    if (onFiltersChange) {
      onFiltersChange(clearedFilters)
    }
  }

  return (
    <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-border rounded-lg shadow-md mb-6 transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-primary-selected dark:hover:bg-dark-surface transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Calendar size={20} className="text-primary-main dark:text-dark-main" />
          <span className="text-lg font-semibold text-primary-text dark:text-dark-text">Filtros</span>
          {(filters.dateRange.start || filters.dateRange.end || filters.suppliers.length > 0 || filters.accounts.length > 0 || filters.markets.length > 0) && (
            <span className="bg-primary-main dark:bg-dark-main text-primary-surface dark:text-dark-bg text-xs px-2 py-1 rounded-full">
              {filters.suppliers.length + filters.accounts.length + filters.markets.length + (filters.dateRange.start || filters.dateRange.end ? 1 : 0)}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-primary-border dark:border-dark-border space-y-4">
          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-primary-text dark:text-dark-text mb-2 flex items-center">
              <Clock size={16} className="mr-1" />
              Tipo de Período
            </label>
            <select
              value={filters.period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-3 py-2 border border-primary-border dark:border-dark-border rounded-lg bg-primary-bg dark:bg-dark-bg text-primary-text dark:text-dark-text focus:ring-2 focus:ring-primary-main dark:focus:ring-dark-main"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range - Only show for custom period */}
          {filters.period === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-primary-text dark:text-dark-text mb-2">
                Período Personalizado
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="flex-1 px-3 py-2 border border-primary-border dark:border-dark-border rounded-lg bg-primary-bg dark:bg-dark-bg text-primary-text dark:text-dark-text focus:ring-2 focus:ring-primary-main dark:focus:ring-dark-main"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="flex-1 px-3 py-2 border border-primary-border dark:border-dark-border rounded-lg bg-primary-bg dark:bg-dark-bg text-primary-text dark:text-dark-text focus:ring-2 focus:ring-primary-main dark:focus:ring-dark-main"
                />
              </div>
            </div>
          )}

          {/* Suppliers */}
          <div>
            <label className="block text-sm font-medium text-primary-text dark:text-dark-text mb-2">
              Fornecedores
            </label>
            <div className="max-h-32 overflow-y-auto border border-primary-border dark:border-dark-border rounded-lg p-2">
              {availableSuppliers.map(supplier => (
                <label key={supplier} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={filters.suppliers.includes(supplier)}
                    onChange={() => toggleFilter('suppliers', supplier)}
                    className="rounded border-primary-border dark:border-dark-border text-primary-main dark:text-dark-main focus:ring-primary-main dark:focus:ring-dark-main"
                  />
                  <span className="text-sm text-primary-text dark:text-dark-text">{supplier}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accounts */}
          <div>
            <label className="block text-sm font-medium text-primary-text dark:text-dark-text mb-2">
              Contas
            </label>
            <div className="max-h-32 overflow-y-auto border border-primary-border dark:border-dark-border rounded-lg p-2">
              {availableAccounts.map(account => (
                <label key={account} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={filters.accounts.includes(account)}
                    onChange={() => toggleFilter('accounts', account)}
                    className="rounded border-primary-border dark:border-dark-border text-primary-main dark:text-dark-main focus:ring-primary-main dark:focus:ring-dark-main"
                  />
                  <span className="text-sm text-primary-text dark:text-dark-text">{account}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Markets */}
          <div>
            <label className="block text-sm font-medium text-primary-text dark:text-dark-text mb-2">
              Mercados
            </label>
            <div className="max-h-32 overflow-y-auto border border-primary-border dark:border-dark-border rounded-lg p-2">
              {availableMarkets.map(market => (
                <label key={market} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={filters.markets.includes(market)}
                    onChange={() => toggleFilter('markets', market)}
                    className="rounded border-primary-border dark:border-dark-border text-primary-main dark:text-dark-main focus:ring-primary-main dark:focus:ring-dark-main"
                  />
                  <span className="text-sm text-primary-text dark:text-dark-text">{market}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <X size={16} />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
