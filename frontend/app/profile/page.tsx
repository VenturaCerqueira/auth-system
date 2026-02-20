

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { User, Mail, Shield, Save, Edit3, CheckCircle, XCircle, BarChart3, TrendingUp } from 'lucide-react'

interface User {
  email: string
  full_name: string
  role: string
  disabled: boolean
}

interface Permissions {
  permissions: string[]
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ email: '', full_name: '' })
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const [userResponse, permissionsResponse] = await Promise.all([
          fetch('http://localhost:8000/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch('http://localhost:8000/permissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        ])

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData)
          setFormData({ email: userData.email, full_name: userData.full_name })
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }

        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          setPermissions(permissionsData)
        }
      } catch (err) {
        setError('Falha ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        setIsEditing(false)
      } else {
        setError('Falha ao atualizar perfil')
      }
    } catch (err) {
      setError('Falha ao atualizar perfil')
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
                <div className="text-xl text-primary-text mb-4">Carregando...</div>
                <div className="w-16 h-16 border-4 border-primary-main border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                    <User size={40} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Perfil</h1>
                    <p className="text-blue-100 text-lg">Gerencie suas informações pessoais</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-primary-text dark:text-dark-text">Informações Pessoais</h2>
                {permissions && permissions.permissions.includes('write') && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border border-white/30"
                  >
                    {isEditing ? (
                      <>
                        <XCircle size={20} />
                        <span>Cancelar</span>
                      </>
                    ) : (
                      <>
                        <Edit3 size={20} />
                        <span>Editar Perfil</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-sm font-medium text-primary-secondary mb-3">
                      <Mail size={18} className="inline mr-2 text-primary-main" />
                      E-mail
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="seu.email@exemplo.com"
                        />
                      </div>
                    ) : (
                      <p className="text-primary-text text-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">{user?.email}</p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-primary-secondary mb-3">
                      <User size={18} className="inline mr-2 text-primary-main" />
                      Nome Completo
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Seu nome completo"
                        />
                      </div>
                    ) : (
                      <p className="text-primary-text text-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">{user?.full_name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-secondary mb-2">
                      <Shield size={16} className="inline mr-2 text-primary-main" />
                      Função
                    </label>
                    <p className="text-primary-text bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">{user?.role}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-secondary mb-2">
                      <CheckCircle size={16} className="inline mr-2 text-primary-main" />
                      Status
                    </label>
                    <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full border-2 ${
                      user?.disabled
                        ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700'
                        : 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700'
                    }`}>
                      {user?.disabled ? 'Desabilitado' : 'Ativo'}
                    </span>
                  </div>
                </div>

                {/* Permissions Section */}
                {permissions && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-primary-text dark:text-dark-text mb-4 flex items-center">
                      <Shield size={20} className="mr-2 text-primary-main" />
                      Permissões
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {permissions.permissions.map((perm, index) => (
                        <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-center space-x-3">
                          <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                      <span className="text-primary-text dark:text-dark-text font-medium capitalize">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border border-white/30"
                    >
                      <Save size={24} />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
