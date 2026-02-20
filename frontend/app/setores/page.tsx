'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { Users, Edit, Trash2, Plus, AlertCircle, CheckCircle, Building, BarChart3, TrendingUp, Building2 } from 'lucide-react'

interface Setor {
  id: string
  name: string
  code: string
  departamento_id: string
}

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

interface User {
  email: string
  full_name: string
  role: string
  disabled: boolean
  setor_id?: string
  departamento_id?: string
  filial_id?: string
}

export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newSetor, setNewSetor] = useState({ id: '', name: '', code: '', departamento_id: '' })
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
      const [setoresResponse, usersResponse, departamentosResponse, filiaisResponse] = await Promise.all([
        fetch('http://localhost:8000/setores', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('http://localhost:8000/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
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

      if (setoresResponse.ok) {
        const setoresData = await setoresResponse.json()
        setSetores(setoresData.setores)
      } else if (setoresResponse.status === 403) {
        setError('Você não tem permissão para acessar esta página')
      } else {
        localStorage.removeItem('token')
        router.push('/login')
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }

      if (departamentosResponse.ok) {
        const departamentosData = await departamentosResponse.json()
        setDepartamentos(departamentosData.departamentos)
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

  const fetchSetores = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('http://localhost:8000/setores', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSetores(data.setores)
      } else if (response.status === 403) {
        setError('Você não tem permissão para acessar esta página')
      } else {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (err) {
      setError('Falha ao carregar setores')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSetor = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/setores', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSetor),
      })

      if (response.ok) {
        setShowModal(false)
        setNewSetor({ id: '', name: '', code: '', departamento_id: '' })
        fetchSetores()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao criar setor')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  const handleUpdateSetor = async (setor: Setor) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/setores/${setor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setor),
      })

      if (response.ok) {
        setEditingSetor(null)
        fetchSetores()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao atualizar setor')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  const handleDeleteSetor = async (setorId: string) => {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/setores/${setorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchSetores()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao excluir setor')
      }
    } catch (err) {
      setError('Erro de rede')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg dark:bg-dark-bg transition-colors duration-300">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-pulse">
                <div className="text-xl text-primary-text dark:text-dark-text mb-4">Carregando...</div>
                <div className="w-16 h-16 border-4 border-primary-main dark:border-dark-main border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
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
                    <Building size={40} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Gerenciamento de Setores</h1>
                    <p className="text-blue-100 text-lg">Organize os setores da sua organização</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl flex items-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/30"
                >
                  <Plus size={24} />
                  Novo Setor
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Setores</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{setores.length}</p>
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
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{setores.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuários</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{users.filter(user => user.setor_id).length}</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {setores.map((setor) => (
                <div key={setor.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{setor.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {setor.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Código:</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {setor.code}
                      </span>
                    </div>
                  </div>

                  {editingSetor?.id === setor.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingSetor.id}
                        onChange={(e) => setEditingSetor({ ...editingSetor, id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ID"
                      />
                      <input
                        type="text"
                        value={editingSetor.name}
                        onChange={(e) => setEditingSetor({ ...editingSetor, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Nome"
                      />
                      <input
                        type="text"
                        value={editingSetor.code}
                        onChange={(e) => setEditingSetor({ ...editingSetor, code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Código"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateSetor(editingSetor)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <CheckCircle size={16} />
                          <span>Salvar</span>
                        </button>
                        <button
                          onClick={() => setEditingSetor(null)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingSetor(setor)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteSetor(setor.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Setor</h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setNewSetor({ id: '', name: '', code: '', departamento_id: '' })
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
              <form onSubmit={handleCreateSetor} className="space-y-6">
                {/* Setor Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Informações do Setor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ID Field */}
                    <div>
                      <label htmlFor="newSetorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ID *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newSetorId"
                          value={newSetor.id}
                          onChange={(e) => setNewSetor({ ...newSetor, id: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o ID do setor"
                          required
                        />
                      </div>
                    </div>

                    {/* Code Field */}
                    <div>
                      <label htmlFor="newSetorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Código *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newSetorCode"
                          value={newSetor.code}
                          onChange={(e) => setNewSetor({ ...newSetor, code: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o código do setor"
                          required
                        />
                      </div>
                    </div>

                    {/* Name Field */}
                    <div className="md:col-span-2">
                      <label htmlFor="newSetorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome do Setor *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newSetorName"
                          value={newSetor.name}
                          onChange={(e) => setNewSetor({ ...newSetor, name: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o nome do setor"
                          required
                        />
                      </div>
                    </div>

                    {/* Departamento Field */}
                    <div className="md:col-span-2">
                      <label htmlFor="newSetorDepartamento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Departamento *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <select
                          id="newSetorDepartamento"
                          value={newSetor.departamento_id}
                          onChange={(e) => setNewSetor({ ...newSetor, departamento_id: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Selecione um departamento</option>
                          {departamentos.map((departamento) => (
                            <option key={departamento.id} value={departamento.id}>
                              {departamento.name} ({departamento.code})
                            </option>
                          ))}
                        </select>
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
                  setNewSetor({ id: '', name: '', code: '', departamento_id: '' })
                }}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSetor}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Criar Setor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
