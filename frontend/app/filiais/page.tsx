'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { Users, Edit, Trash2, Plus, AlertCircle, CheckCircle, MapPin, Building, BarChart3, TrendingUp } from 'lucide-react'

interface Filial {
  id: string
  name: string
  code: string
}

export default function FiliaisPage() {
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newFilial, setNewFilial] = useState({ id: '', name: '', code: '' })
  const router = useRouter()

  useEffect(() => {
    fetchFiliais()
  }, [])

  const fetchFiliais = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('http://localhost:8000/filiais', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFiliais(data.filiais)
      } else if (response.status === 403) {
        setError('Você não tem permissão para acessar esta página')
      } else {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (err) {
      setError('Falha ao carregar filiais')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFilial = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/filiais', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFilial),
      })

      if (response.ok) {
        setShowModal(false)
        setNewFilial({ id: '', name: '', code: '' })
        fetchFiliais()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao criar filial')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  const handleUpdateFilial = async (filial: Filial) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/filiais/${filial.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filial),
      })

      if (response.ok) {
        setEditingFilial(null)
        fetchFiliais()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao atualizar filial')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  const handleDeleteFilial = async (filialId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta filial?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/filiais/${filialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchFiliais()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao excluir filial')
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
            <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
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
                    <MapPin size={40} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Filiais</h1>
                    <p className="text-blue-100 text-lg">Gerencie todas as filiais da sua organização</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl flex items-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/30"
                >
                  <Plus size={24} />
                  Nova Filial
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Filiais</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{filiais.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Building size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativas</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{filiais.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departamentos</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">-</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filiais.map((filial) => (
                      <tr key={filial.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingFilial?.id === filial.id ? (
                            <input
                              type="text"
                              value={editingFilial.id}
                              onChange={(e) => setEditingFilial({ ...editingFilial, id: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                            />
                          ) : (
                            filial.id
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingFilial?.id === filial.id ? (
                            <input
                              type="text"
                              value={editingFilial.name}
                              onChange={(e) => setEditingFilial({ ...editingFilial, name: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                            />
                          ) : (
                            filial.name
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingFilial?.id === filial.id ? (
                            <input
                              type="text"
                              value={editingFilial.code}
                              onChange={(e) => setEditingFilial({ ...editingFilial, code: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                            />
                          ) : (
                            filial.code
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingFilial?.id === filial.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateFilial(editingFilial)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => setEditingFilial(null)}
                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingFilial(filial)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit size={20} />
                              </button>
                              <button
                                onClick={() => handleDeleteFilial(filial.id)}
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

      {/* Modern Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Adicionar Nova Filial</h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setNewFilial({ id: '', name: '', code: '' })
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleCreateFilial} className="space-y-6">
                {/* Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Informações da Filial
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ID Field */}
                    <div className="md:col-span-2">
                      <label htmlFor="newFilialId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ID da Filial *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newFilialId"
                          value={newFilial.id}
                          onChange={(e) => setNewFilial({ ...newFilial, id: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o ID da filial"
                          required
                        />
                      </div>
                    </div>

                    {/* Name Field */}
                    <div>
                      <label htmlFor="newFilialName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome da Filial *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newFilialName"
                          value={newFilial.name}
                          onChange={(e) => setNewFilial({ ...newFilial, name: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o nome da filial"
                          required
                        />
                      </div>
                    </div>

                    {/* Code Field */}
                    <div>
                      <label htmlFor="newFilialCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Código da Filial *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newFilialCode"
                          value={newFilial.code}
                          onChange={(e) => setNewFilial({ ...newFilial, code: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o código da filial"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => {
                  setShowModal(false)
                  setNewFilial({ id: '', name: '', code: '' })
                }}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFilial}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Criar Filial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
