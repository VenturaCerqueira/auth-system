'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { Users, Edit, Trash2, Lock, Unlock, Key, AlertCircle, CheckCircle, UserPlus, Eye, EyeOff, Mail, User } from 'lucide-react'

interface User {
  email: string
  full_name: string
  role: string
  disabled: boolean
  setor_id?: string
  departamento_id?: string
  filial_id?: string
}

interface Setor {
  id: string
  name: string
  code: string
}

interface Departamento {
  id: string
  name: string
  code: string
}

interface Filial {
  id: string
  name: string
  code: string
}

interface Permissions {
  permissions: string[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    matricula: '',
    setor_id: '',
    departamento_id: '',
    filial_id: '',
    role: 'user'
  })
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const [usersResponse, permissionsResponse, setoresResponse, departamentosResponse, filiaisResponse] = await Promise.all([
          fetch('http://localhost:8000/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch('http://localhost:8000/permissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch('http://localhost:8000/setores', {
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

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users)
        } else if (usersResponse.status === 403) {
          setError('Você não tem permissão para acessar esta página')
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }

        if (permissionsResponse.ok) {
          const permissionsData: Permissions = await permissionsResponse.json()
          setPermissions(permissionsData.permissions)
        }

        if (setoresResponse.ok) {
          const setoresData = await setoresResponse.json()
          setSetores(setoresData.setores)
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

    fetchData()
  }, [router])

  const handleUpdateUser = async (email: string, updates: Partial<User>) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/users/${email}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        setUsers(users.map(user =>
          user.email === email ? { ...user, ...updates } : user
        ))
        setEditingUser(null)
      } else {
        setError('Falha ao atualizar usuário')
      }
    } catch (err) {
      setError('Falha ao atualizar usuário')
    }
  }

  const handleChangePassword = async (email: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/users/${email}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_password: newPassword }),
      })

      if (response.ok) {
        setShowPasswordModal(false)
        setNewPassword('')
        setSelectedUser(null)
        alert('Senha alterada com sucesso')
      } else {
        setError('Falha ao alterar senha')
      }
    } catch (err) {
      setError('Falha ao alterar senha')
    }
  }

  const handleDeleteUser = async (email: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/users/${email}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setUsers(users.filter(user => user.email !== email))
      } else {
        setError('Falha ao excluir usuário')
      }
    } catch (err) {
      setError('Falha ao excluir usuário')
    }
  }

  const handleAddUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          matricula: newUser.matricula || undefined,
          setor_id: newUser.setor_id || undefined,
          departamento_id: newUser.departamento_id || undefined,
          filial_id: newUser.filial_id || undefined,
          role: newUser.role,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh users list
        const usersResponse = await fetch('http://localhost:8000/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users)
        }
        setShowAddUserModal(false)
        setNewUser({
          email: '',
          password: '',
          full_name: '',
          matricula: '',
          setor_id: '',
          departamento_id: '',
          filial_id: '',
          role: 'user'
        })
        alert('Usuário adicionado com sucesso')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Falha ao adicionar usuário')
      }
    } catch (err) {
      setError('Falha ao adicionar usuário')
    }
  }

  const getSetorName = (id?: string) => {
    if (!id) return 'N/A'
    const setor = setores.find(s => s.id === id)
    return setor ? setor.name : 'N/A'
  }

  const getDepartamentoName = (id?: string) => {
    if (!id) return 'N/A'
    const dep = departamentos.find(d => d.id === id)
    return dep ? dep.name : 'N/A'
  }

  const getFilialName = (id?: string) => {
    if (!id) return 'N/A'
    const filial = filiais.find(f => f.id === id)
    return filial ? filial.name : 'N/A'
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

  if (error) {
    return (
      <div className="min-h-screen bg-primary-bg dark:bg-dark-bg transition-colors duration-300">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-red-600 dark:text-red-400">{error}</div>
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
                    <Users size={40} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Gerenciamento de Usuários</h1>
                    <p className="text-blue-100 text-lg">Gerencie todos os usuários do sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl flex items-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/30"
                >
                  <UserPlus size={24} />
                  Adicionar Usuário
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{users.filter(user => !user.disabled).length}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administradores</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{users.filter(user => user.role === 'admin').length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Lock size={24} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inativos</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{users.filter(user => user.disabled).length}</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-4 px-4 font-semibold text-primary-text dark:text-dark-text">Nome</th>
                      <th className="text-left py-4 px-4 font-semibold text-primary-text dark:text-dark-text">Email</th>
                      <th className="text-left py-4 px-4 font-semibold text-primary-text dark:text-dark-text">Função</th>
                      <th className="text-left py-4 px-4 font-semibold text-primary-text dark:text-dark-text">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-primary-text dark:text-dark-text">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.email} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4 text-primary-text dark:text-dark-text">{user.full_name}</td>
                        <td className="py-4 px-4 text-primary-text dark:text-dark-text">{user.email}</td>
                        <td className="py-4 px-4">
                          {editingUser?.email === user.email ? (
                            <select
                              value={editingUser.role}
                              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-primary-text dark:text-dark-text"
                            >
                              <option value="user">Usuário</option>
                              <option value="admin">Administrador</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                              user.role === 'admin'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            user.disabled
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {user.disabled ? 'Inativo' : 'Ativo'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {editingUser?.email === user.email ? (
                              <>
                                <button
                                  onClick={() => handleUpdateUser(user.email, editingUser)}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  <CheckCircle size={20} />
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <AlertCircle size={20} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingUser(user)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Editar"
                                >
                                  <Edit size={20} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowPasswordModal(true)
                                  }}
                                  className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                                  title="Alterar Senha"
                                >
                                  <Key size={20} />
                                </button>
                                <button
                                  onClick={() => handleUpdateUser(user.email, { disabled: !user.disabled })}
                                  className={`hover:opacity-75 ${user.disabled ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}
                                  title={user.disabled ? 'Ativar' : 'Desativar'}
                                >
                                  {user.disabled ? <Unlock size={20} /> : <Lock size={20} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.email)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  title="Excluir"
                                >
                                  <Trash2 size={20} />
                                </button>

                              </>
                            )}
                          </div>
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

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alterar Senha</h2>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setSelectedUser(null)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedUser.full_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Digite a nova senha"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setSelectedUser(null)
                }}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleChangePassword(selectedUser.email)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Key className="h-5 w-5" />
                <span>Alterar Senha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Adicionar Novo Usuário</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddUserModal(false)
                  setNewUser({
                    email: '',
                    password: '',
                    full_name: '',
                    matricula: '',
                    setor_id: '',
                    departamento_id: '',
                    filial_id: '',
                    role: 'user'
                  })
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
              <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }} className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name Field */}
                    <div className="md:col-span-2">
                      <label htmlFor="newFullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newFullName"
                          value={newUser.full_name}
                          onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o nome completo"
                          required
                        />
                      </div>
                    </div>

                    {/* Matricula Field */}
                    <div>
                      <label htmlFor="newMatricula" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Matrícula
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          id="newMatricula"
                          value={newUser.matricula}
                          onChange={(e) => setNewUser({ ...newUser, matricula: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite a matrícula"
                        />
                      </div>
                    </div>

                    {/* Role Field */}
                    <div>
                      <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Função *
                      </label>
                      <select
                        id="newRole"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="user">Usuário</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Account Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Informações da Conta
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email Field */}
                    <div className="md:col-span-2">
                      <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Endereço de Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="email"
                          id="newEmail"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite o email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="md:col-span-2">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Senha *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="newPassword"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Digite a senha"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizational Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Informações Organizacionais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Setor Field */}
                    <div>
                      <label htmlFor="newSetor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Setor
                      </label>
                      <select
                        id="newSetor"
                        value={newUser.setor_id}
                        onChange={(e) => setNewUser({ ...newUser, setor_id: e.target.value })}
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione um setor</option>
                        {setores.map((setor) => (
                          <option key={setor.id} value={setor.id}>
                            {setor.name} ({setor.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Departamento Field */}
                    <div>
                      <label htmlFor="newDepartamento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Departamento
                      </label>
                      <select
                        id="newDepartamento"
                        value={newUser.departamento_id}
                        onChange={(e) => setNewUser({ ...newUser, departamento_id: e.target.value })}
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione um departamento</option>
                        {departamentos.map((departamento) => (
                          <option key={departamento.id} value={departamento.id}>
                            {departamento.name} ({departamento.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filial Field */}
                    <div>
                      <label htmlFor="newFilial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filial
                      </label>
                      <select
                        id="newFilial"
                        value={newUser.filial_id}
                        onChange={(e) => setNewUser({ ...newUser, filial_id: e.target.value })}
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione uma filial</option>
                        {filiais.map((filial) => (
                          <option key={filial.id} value={filial.id}>
                            {filial.name} ({filial.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => {
                  setShowAddUserModal(false)
                  setNewUser({
                    email: '',
                    password: '',
                    full_name: '',
                    matricula: '',
                    setor_id: '',
                    departamento_id: '',
                    filial_id: '',
                    role: 'user'
                  })
                }}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUser}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <UserPlus className="h-5 w-5" />
                <span>Adicionar Usuário</span>
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}
