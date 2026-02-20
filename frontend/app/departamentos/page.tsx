'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { Users, Edit, Trash2, Plus, AlertCircle, CheckCircle, Building2, Building, BarChart3, TrendingUp } from 'lucide-react'

interface Departamento {
  id: string
  name: string
  code: string
  filial_id: string
}

interface Filial {
  id: string
  name: string
  code: string
}

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newDepartamento, setNewDepartamento] = useState({ id: '', name: '', code: '', filial_id: '' })
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const [departamentosResponse, filiaisResponse] = await Promise.all([
        fetch('http://localhost:8000/departamentos', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('http://localhost:8000/filiais', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ])

      if (departamentosResponse.ok) {
        const data = await departamentosResponse.json()
        setDepartamentos(data.departamentos)
      } else if (departamentosResponse.status === 403) {
        setError('Você não tem permissão para acessar esta página')
      } else {
        localStorage.removeItem('token')
        router.push('/login')
      }

      if (filiaisResponse.ok) {
        const filiaisData = await filiaisResponse.json()
        setFiliais(filiaisData.filiais)
      }
    } catch (err) {
      setError('Falha ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartamentos = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/departamentos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDepartamentos(data.departamentos)
      }
    } catch (err) {
      console.error('Error fetching departamentos:', err)
    }
  }

  const handleCreateDepartamento = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/departamentos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDepartamento),
      })

      if (response.ok) {
        setShowModal(false)
        setNewDepartamento({ id: '', name: '', code: '', filial_id: '' })
        fetchDepartamentos()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao criar departamento')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  const handleUpdateDepartamento = async (departamento: Departamento) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/departamentos/${departamento.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departamento),
      })

      if (response.ok) {
        setEditingDepartamento(null)
        fetchDepartamentos()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao atualizar departamento')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  const handleDeleteDepartamento = async (departamentoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este departamento?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/departamentos/${departamentoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchDepartamentos()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao excluir departamento')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-bg dark:bg-dark-bg transition-colors duration-300">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-900 rounded-2xl p-8 mb-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Building2 size={40} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Departamentos</h1>
                    <p className="text-blue-100 text-lg">Organize os departamentos da sua organização</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl flex items-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/30"
                >
                  <Plus size={24} />
                  Novo Departamento
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Departamentos</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{departamentos.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Building size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{departamentos.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Setores</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">-</p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <BarChart3 size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Filial</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {departamentos.map((departamento) => (
                      <tr key={departamento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingDepartamento?.id === departamento.id ? (
                            <input
                              type="text"
                              value={editingDepartamento.id}
                              onChange={(e) => setEditingDepartamento({ ...editingDepartamento, id: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                            />
                          ) : (
                            departamento.id
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingDepartamento?.id === departamento.id ? (
                            <input
                              type="text"
                              value={editingDepartamento.name}
                              onChange={(e) => setEditingDepartamento({ ...editingDepartamento, name: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                            />
                          ) : (
                            departamento.name
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingDepartamento?.id === departamento.id ? (
                            <input
                              type="text"
                              value={editingDepartamento.code}
                              onChange={(e) => setEditingDepartamento({ ...editingDepartamento, code: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                            />
                          ) : (
                            departamento.code
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {departamento.filial_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingDepartamento?.id === departamento.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateDepartamento(editingDepartamento)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => setEditingDepartamento(null)}
                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingDepartamento(departamento)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit size={20} />
                              </button>
                              <button
                                onClick={() => handleDeleteDepartamento(departamento.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Novo Departamento</h2>
            <form onSubmit={handleCreateDepartamento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID</label>
                <input
                  type="text"
                  value={newDepartamento.id}
                  onChange={(e) => setNewDepartamento({ ...newDepartamento, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={newDepartamento.name}
                  onChange={(e) => setNewDepartamento({ ...newDepartamento, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                <input
                  type="text"
                  value={newDepartamento.code}
                  onChange={(e) => setNewDepartamento({ ...newDepartamento, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filial ID</label>
                <input
                  type="text"
                  value={newDepartamento.filial_id}
                  onChange={(e) => setNewDepartamento({ ...newDepartamento, filial_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setNewDepartamento({ id: '', name: '', code: '', filial_id: '' })
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
