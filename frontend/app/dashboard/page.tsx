'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import FilterPanel from '../components/FilterPanel'
import ChatPanel from '../components/ChatPanel'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, TrendingUp, Target, Users, Database, Calendar, Building, User, MessageCircle, Download, Menu, X } from 'lucide-react'

interface User {
  email: string
  full_name: string
  role: string
  disabled: boolean
}

interface Permissions {
  permissions: string[]
}

// Star Schema Interfaces
interface FatoOrcamento {
  id: string
  ano: number
  mes: number
  data: string
  codigoMicroMercado: string
  codigoConta: string
  vlrOrcado: number
}

interface FatoRealizado {
  id: string
  ano: number
  mes: number
  data: string
  codigoMicroMercado: string
  codigoConta: string
  razaoSocial: string
  valorCustoTotal: number
  historicoCusto: string
}

interface TemporalData {
  mes: string
  orcado: number
  realizado: number
  forecast?: boolean
}

interface DREData {
  conta: string
  orcado: number
  realizado: number
  variacao: number
}

interface DCalendario {
  data: string
  ano: number
  mes: number
  nomeMes: string
  trimestre: number
}

interface DEstrutura {
  codigoMicroMercado: string
  nomeMicroMercado: string
  nucleo: string
  microNucleo: string
  filial: string
  mercado: string
}

interface DConta {
  codigoConta: string
  pacote: string
  subpacote: string
  contaGerencial: string
  contaContabil: string
  contaContabilNome?: string
}

interface DFornecedor {
  razaoSocial: string
  tipoFornecedor: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Filter states
  const [filters, setFilters] = useState({
    period: 'monthly',
    dateRange: { start: '', end: '' },
    suppliers: [] as string[],
    accounts: [] as string[],
    markets: [] as string[],
    showFilters: false
  })

  // Available filter options
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([])
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([])
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([])

  // Star Schema state
  const [fatoOrcamento, setFatoOrcamento] = useState<FatoOrcamento[]>([])
  const [fatoRealizado, setFatoRealizado] = useState<FatoRealizado[]>([])
  const [dCalendario, setDCalendario] = useState<DCalendario[]>([])
  const [dEstrutura, setDEstrutura] = useState<DEstrutura[]>([])
  const [dConta, setDConta] = useState<DConta[]>([])
  const [dFornecedor, setDFornecedor] = useState<DFornecedor[]>([])

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-nine-ochre-18.vercel.app'

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setLoadingStep('Enviando arquivo para processamento...')
    setLoadingProgress(20)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${apiUrl}/upload-raw-excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Upload successful:', result.message)
        setLoadingStep('Arquivo processado com sucesso! Carregando dados...')
        setLoadingProgress(80)
        // Load the processed data from backend
        await loadDataFromBackend()
        setLoadingStep('Dados carregados com sucesso!')
        setLoadingProgress(100)
        setDataLoaded(true)
        setSelectedFile(null)
        setIsImportModalOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erro ao fazer upload do arquivo')
      }
    } catch (error: unknown) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert(`Erro ao fazer upload do arquivo: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const handleLoadFromDatabase = async () => {
    setUploading(true)
    setLoadingStep('Carregando dados do banco...')
    setLoadingProgress(50)

    try {
      await loadDataFromBackend()
      setLoadingStep('Dados carregados com sucesso!')
      setLoadingProgress(100)
      setDataLoaded(true)
      setIsImportModalOpen(false)
    } catch (error) {
      console.error('Failed to load data from database:', error)
      alert('Erro ao carregar dados do banco. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }





  const loadDataFromBackend = async () => {
    try {
      const token = localStorage.getItem('token')
      const [orcamentoRes, realizadoRes, calendarioRes, estruturaRes, contaRes, fornecedorRes] = await Promise.all([
        fetch(`${apiUrl}/get-fato-orcamento`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/get-fato-realizado`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/get-d-calendario`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/get-d-estrutura`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/get-d-conta`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/get-d-fornecedor`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ])

      if (orcamentoRes.ok && realizadoRes.ok && calendarioRes.ok && estruturaRes.ok && contaRes.ok && fornecedorRes.ok) {
        const [orcamentoData, realizadoData, calendarioData, estruturaData, contaData, fornecedorData] = await Promise.all([
          orcamentoRes.json(),
          realizadoRes.json(),
          calendarioRes.json(),
          estruturaRes.json(),
          contaRes.json(),
          fornecedorRes.json(),
        ])

        console.log('Backend data loaded:', {
          orcamento: orcamentoData.data?.length || 0,
          realizado: realizadoData.data?.length || 0,
          calendario: calendarioData.data?.length || 0,
          estrutura: estruturaData.data?.length || 0,
          conta: contaData.data?.length || 0,
          fornecedor: fornecedorData.data?.length || 0
        })

        setFatoOrcamento(orcamentoData.data || [])
        setFatoRealizado(realizadoData.data || [])
        setDCalendario(calendarioData.data || [])
        setDEstrutura(estruturaData.data || [])
        setDConta(contaData.data || [])
        setDFornecedor(fornecedorData.data || [])

        // Set available filter options
        const fornecedores = (fornecedorData.data || []).map((f: any) => f.razaoSocial).filter(Boolean)
        const contas = (contaData.data || []).map((c: any) => c.codigoConta).filter(Boolean)
        const mercados = (estruturaData.data || []).map((e: any) => e.codigoMicroMercado).filter(Boolean)

        setAvailableSuppliers(fornecedores.sort())
        setAvailableAccounts(contas.sort())
        setAvailableMarkets(mercados.sort())

        // Set data loaded to true after processing
        setDataLoaded(true)
        // Fetch initial metrics
        fetchMetrics(filters)
      } else {
        console.error('Backend responses not OK:', {
          orcamento: orcamentoRes.status,
          realizado: realizadoRes.status,
          calendario: calendarioRes.status,
          estrutura: estruturaRes.status,
          conta: contaRes.status,
          fornecedor: fornecedorRes.status
        })
      }
    } catch (error) {
      console.error('Failed to load data from backend:', error)
    }
  }

  // Filter helper function
  const filterFacts = (facts: any[], filters: any) => {
    return facts.filter(fact => {
      // Date filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const factDate = `${fact.ano}-${fact.mes.toString().padStart(2, '0')}`
        if (filters.dateRange.start && factDate < filters.dateRange.start) return false
        if (filters.dateRange.end && factDate > filters.dateRange.end) return false
      }
      // Suppliers filter (only for fatoRealizado)
      if (filters.suppliers.length > 0 && fact.razaoSocial && !filters.suppliers.includes(fact.razaoSocial)) return false
      // Accounts filter
      if (filters.accounts.length > 0 && fact.codigoConta && !filters.accounts.includes(fact.codigoConta)) return false
      // Markets filter
      if (filters.markets.length > 0 && fact.codigoMicroMercado && !filters.markets.includes(fact.codigoMicroMercado)) return false
      return true
    })
  }

  // BI Helper Functions - Now using backend metrics endpoint
  const [metricsData, setMetricsData] = useState<any>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  const fetchMetrics = async (currentFilters: any) => {
    setLoadingMetrics(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        period: currentFilters.period,
        ...(currentFilters.dateRange.start && { start_date: currentFilters.dateRange.start }),
        ...(currentFilters.dateRange.end && { end_date: currentFilters.dateRange.end }),
        ...(currentFilters.suppliers.length > 0 && { suppliers: currentFilters.suppliers.join(',') }),
        ...(currentFilters.accounts.length > 0 && { accounts: currentFilters.accounts.join(',') }),
        ...(currentFilters.markets.length > 0 && { markets: currentFilters.markets.join(',') })
      })

      const response = await fetch(`${apiUrl}/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetricsData(data)
      } else {
        console.error('Failed to fetch metrics')
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoadingMetrics(false)
    }
  }

  const getTemporalData = () => {
    if (!metricsData?.temporal_data) return []
    return metricsData.temporal_data.map((item: any) => ({
      mes: item.period,
      orcado: item.orcado,
      realizado: item.realizado
    }))
  }

  const getTopSuppliers = () => {
    const supplierTotals: { [key: string]: number } = {}

    fatoRealizado.forEach(item => {
      if (item.razaoSocial) {
        supplierTotals[item.razaoSocial] = (supplierTotals[item.razaoSocial] || 0) + item.valorCustoTotal
      }
    })

    return Object.entries(supplierTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([fornecedor, valor]) => ({ fornecedor, valor }))
  }

  const getAdherenceData = () => {
    const totalOrcado = fatoOrcamento.reduce((sum, item) => sum + item.vlrOrcado, 0)
    const totalRealizado = fatoRealizado.reduce((sum, item) => sum + item.valorCustoTotal, 0)
    const adherence = totalOrcado > 0 ? ((totalRealizado / totalOrcado) * 100) : 0
    return { totalOrcado, totalRealizado, adherence }
  }

  const getDREData = () => {
    const dreData: { [key: string]: { orcado: number; realizado: number; variacao: number } } = {}

    // Aggregate by account (simplified DRE)
    fatoOrcamento.forEach(item => {
      const key = item.codigoConta || 'Outros'
      if (!dreData[key]) dreData[key] = { orcado: 0, realizado: 0, variacao: 0 }
      dreData[key].orcado += item.vlrOrcado
    })

    fatoRealizado.forEach(item => {
      const key = item.codigoConta || 'Outros'
      if (!dreData[key]) dreData[key] = { orcado: 0, realizado: 0, variacao: 0 }
      dreData[key].realizado += item.valorCustoTotal
    })

    // Calculate variation
    Object.keys(dreData).forEach(key => {
      const item = dreData[key]
      item.variacao = item.orcado > 0 ? ((item.realizado - item.orcado) / item.orcado) * 100 : 0
    })

    return Object.entries(dreData)
      .sort(([, a], [, b]) => Math.abs(b.variacao) - Math.abs(a.variacao))
      .slice(0, 10)
      .map(([conta, values]) => ({ conta, ...values }))
  }

  const getForecastData = () => {
    const temporalData = getTemporalData()
    if (temporalData.length < 3) return []

    // Simple linear regression for forecasting
    const n = temporalData.length
    const x = temporalData.map((_: any, i: number) => i) // Time index
    const y = temporalData.map((d: any) => d.realizado) // Values

    // Calculate means
    const xMean = x.reduce((sum: number, val: number) => sum + val, 0) / n
    const yMean = y.reduce((sum: number, val: number) => sum + val, 0) / n

    // Calculate slope (m) and intercept (b)
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean)
      denominator += Math.pow(x[i] - xMean, 2)
    }

    const slope = denominator !== 0 ? numerator / denominator : 0
    const intercept = yMean - slope * xMean

    // Generate forecast for next 3 periods
    const forecastData = [...temporalData]
    for (let i = 1; i <= 3; i++) {
      const nextX = n - 1 + i
      const forecastValue = slope * nextX + intercept
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + i)
      const mesKey = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`

      forecastData.push({
        mes: mesKey,
        orcado: 0, // No budget forecast
        realizado: Math.max(0, forecastValue), // Ensure non-negative
      })
    }

    return forecastData
  }






  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const [userResponse, permissionsResponse] = await Promise.all([
          fetch(`${apiUrl}/users/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch(`${apiUrl}/permissions`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ])

        if (userResponse.ok && permissionsResponse.ok) {
          const userData = await userResponse.json()
          const permissionsData: Permissions = await permissionsResponse.json()
          setUser(userData)
          setPermissions(permissionsData.permissions)

          // Data will be loaded via modal when user chooses to import Excel or load from database
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (err) {
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // Fetch metrics when filters change
  useEffect(() => {
    if (dataLoaded) {
      fetchMetrics(filters)
    }
  }, [filters, dataLoaded])

  // Removed automatic loading of saved file - now always imported via upload

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-bg dark:bg-dark-bg transition-colors duration-300">
      <Header />
      <div className="flex">
        <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-primary-text dark:text-dark-text mb-2 flex items-center">
                  📊 Dashboard BI
                </h1>
                <p className="text-lg text-primary-border dark:text-dark-text">Análise Gráfica e Business Intelligence</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <MessageCircle size={20} />
                  </button>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Chat com IA
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => window.location.reload()}
                    className="p-2 bg-primary-main dark:bg-dark-main text-primary-surface dark:text-dark-bg rounded-lg hover:bg-primary-main/90 dark:hover:bg-dark-main/90 hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <TrendingUp size={20} />
                  </button>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Atualizar dados
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Database size={20} />
                  </button>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Importar Excel
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => {
                      // Export functionality placeholder
                      alert('Funcionalidade de exportação será implementada em breve!')
                    }}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Download size={20} />
                  </button>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Exportar dados
                  </span>
                </div>
              </div>
            </div>

            {!dataLoaded && (
              <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-48 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: `${loadingProgress}%` }}></div>
                </div>
                <div className="text-sm text-primary-border dark:text-dark-text">{loadingStep || 'Carregando dados...'}</div>
              </div>
            )}

            {dataLoaded && (
              <>
                {/* Filter Panel */}
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  availableSuppliers={availableSuppliers}
                  availableAccounts={availableAccounts}
                  availableMarkets={availableMarkets}
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2 text-primary-text dark:text-dark-text">Total Orçado</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      R$ {getAdherenceData().totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2 text-primary-text dark:text-dark-text">Total Realizado</h3>
                    <p className="text-3xl font-bold text-red-600">
                      R$ {getAdherenceData().totalRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2 text-primary-text dark:text-dark-text">Aderência Orçamentária</h3>
                    <p className={`text-3xl font-bold ${getAdherenceData().adherence > 100 ? 'text-red-600' : getAdherenceData().adherence > 90 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {getAdherenceData().adherence.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2 text-primary-text dark:text-dark-text">Total Fornecedores</h3>
                    <p className="text-3xl font-bold text-purple-600">{dFornecedor.length}</p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Temporal Evolution - Bar Chart */}
                  <div className="bg-gradient-to-br from-primary-surface to-primary-bg dark:from-dark-surface dark:to-dark-bg border border-primary-border dark:border-dark-border rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-4 text-primary-text dark:text-dark-text flex items-center">
                      <TrendingUp className="mr-2 text-blue-500" size={24} />
                      Evolução Temporal: Orçado vs Realizado
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getTemporalData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mes" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            name
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="orcado"
                          fill="url(#orcadoGradient)"
                          name="Orçado"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="realizado"
                          fill="url(#realizadoGradient)"
                          name="Realizado"
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="orcadoGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.6}/>
                          </linearGradient>
                          <linearGradient id="realizadoGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Temporal Evolution - Line Chart */}
                  <div className="bg-gradient-to-br from-primary-surface to-primary-bg dark:from-dark-surface dark:to-dark-bg border border-primary-border dark:border-dark-border rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-4 text-primary-text dark:text-dark-text flex items-center">
                      <TrendingUp className="mr-2 text-green-500" size={24} />
                      Tendência Temporal (Linha)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getTemporalData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mes" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            name
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="orcado"
                          stroke="#3b82f6"
                          strokeWidth={4}
                          name="Orçado"
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="realizado"
                          stroke="#ef4444"
                          strokeWidth={4}
                          name="Realizado"
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Suppliers */}
                  <div className="bg-gradient-to-br from-primary-surface to-primary-bg dark:from-dark-surface dark:to-dark-bg border border-primary-border dark:border-dark-border rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-4 text-primary-text dark:text-dark-text flex items-center">
                      <Users className="mr-2 text-purple-500" size={24} />
                      Top 10 Fornecedores por Valor
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getTopSuppliers()} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" />
                        <YAxis dataKey="fornecedor" type="category" width={150} stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            'Valor Total'
                          ]}
                        />
                        <Bar
                          dataKey="valor"
                          fill="url(#supplierGradient)"
                          radius={[0, 4, 4, 0]}
                        />
                        <defs>
                          <linearGradient id="supplierGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Forecast Chart */}
                  <div className="bg-gradient-to-br from-primary-surface to-primary-bg dark:from-dark-surface dark:to-dark-bg border border-primary-border dark:border-dark-border rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-4 text-primary-text dark:text-dark-text flex items-center">
                      <Target className="mr-2 text-orange-500" size={24} />
                      Previsão de Realizado
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={getForecastData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mes" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            name
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="realizado"
                          stackId="1"
                          stroke="#ef4444"
                          fill="url(#forecastRealizado)"
                          name="Histórico"
                        />
                        <Area
                          type="monotone"
                          dataKey="orcado"
                          stackId="2"
                          stroke="#3b82f6"
                          fill="url(#forecastOrcado)"
                          name="Orçado"
                        />
                        <defs>
                          <linearGradient id="forecastRealizado" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="forecastOrcado" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* DRE Table */}
                <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface rounded-lg shadow-md p-6 mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-primary-text dark:text-dark-text">DRE Gerencial - Principais Contas</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-primary-bg dark:bg-dark-bg border border-primary-border dark:border-dark-border">
                      <thead>
                        <tr className="bg-primary-surface dark:bg-dark-surface">
                          <th className="px-4 py-3 border-b border-primary-border dark:border-dark-border text-left text-primary-text dark:text-dark-text font-semibold">Conta</th>
                          <th className="px-4 py-3 border-b border-primary-border dark:border-dark-border text-right text-primary-text dark:text-dark-text font-semibold">Orçado</th>
                          <th className="px-4 py-3 border-b border-primary-border dark:border-dark-border text-right text-primary-text dark:text-dark-text font-semibold">Realizado</th>
                          <th className="px-4 py-3 border-b border-primary-border dark:border-dark-border text-right text-primary-text dark:text-dark-text font-semibold">Variação (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDREData().map((item, index) => (
                          <tr key={index} className="hover:bg-primary-surface dark:hover:bg-dark-surface">
                            <td className="px-4 py-3 border-b border-primary-border dark:border-dark-border text-primary-text dark:text-dark-text font-medium">
                              {item.conta}
                            </td>
                            <td className="px-4 py-3 border-b border-primary-border dark:border-dark-border text-right text-primary-text dark:text-dark-text">
                              R$ {item.orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 border-b border-primary-border dark:border-dark-border text-right text-primary-text dark:text-dark-text">
                              R$ {item.realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`px-4 py-3 border-b border-primary-border dark:border-dark-border text-right font-semibold ${
                              item.variacao > 0 ? 'text-red-600' : item.variacao < 0 ? 'text-green-600' : 'text-primary-text dark:text-dark-text'
                            }`}>
                              {item.variacao > 0 ? '+' : ''}{item.variacao.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <Database className="text-blue-600 dark:text-blue-400" size={24} />
                      <span className="text-lg">📊</span>
                    </div>
                    <h4 className="font-semibold text-primary-text dark:text-dark-text mb-1">Fato Orçamento</h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 animate-pulse">{fatoOrcamento.length}</p>
                    <p className="text-sm text-primary-border dark:text-dark-text">registros</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="text-red-600 dark:text-red-400" size={24} />
                      <span className="text-lg">📈</span>
                    </div>
                    <h4 className="font-semibold text-primary-text dark:text-dark-text mb-1">Fato Realizado</h4>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 animate-pulse">{fatoRealizado.length}</p>
                    <p className="text-sm text-primary-border dark:text-dark-text">registros</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="text-green-600 dark:text-green-400" size={24} />
                      <span className="text-lg">📅</span>
                    </div>
                    <h4 className="font-semibold text-primary-text dark:text-dark-text mb-1">Dimensão Calendário</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 animate-pulse">{dCalendario.length}</p>
                    <p className="text-sm text-primary-border dark:text-dark-text">períodos</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <Building className="text-purple-600 dark:text-purple-400" size={24} />
                      <span className="text-lg">🏢</span>
                    </div>
                    <h4 className="font-semibold text-primary-text dark:text-dark-text mb-1">Dimensão Fornecedor</h4>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 animate-pulse">{dFornecedor.length}</p>
                    <p className="text-sm text-primary-border dark:text-dark-text">fornecedores</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <Footer />
      <ChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-primary-surface dark:bg-dark-surface rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-primary-text dark:text-dark-text mb-4">Importar Dados</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text dark:text-dark-text mb-2">
                  Selecionar Arquivo Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-primary-border dark:border-dark-border rounded-md bg-primary-bg dark:bg-dark-bg text-primary-text dark:text-dark-text"
                />
                {selectedFile && (
                  <p className="text-sm text-primary-border dark:text-dark-text mt-1">
                    Arquivo selecionado: {selectedFile.name}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Importando...' : 'Importar Excel'}
                </button>
                <button
                  onClick={handleLoadFromDatabase}
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Carregando...' : 'Carregar do Banco'}
                </button>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
