'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { Settings, Moon, Sun, Bell, BellOff, Globe, Save, CheckCircle, Palette, Shield, User, RotateCcw } from 'lucide-react'

interface User {
  email: string
  full_name: string
  role: string
  disabled: boolean
}

interface Permissions {
  permissions: string[]
}

interface ColorScheme {
  bg: string
  surface: string
  main: string
  text: string
  border: string
  selected: string
  paragraph: string
  secondary: string
  gradientStart: string
  gradientVia: string
  gradientEnd: string
  header: string
  sidebar: string
}

interface UserSettings {
  theme: string
  colors: {
    light: ColorScheme
    dark: ColorScheme
  }
  notifications: {
    email: boolean
    push: boolean
    reports: boolean
    alerts: boolean
  }
  language: string
  timezone: string
  privacy: {
    profileVisibility: string
    dataSharing: boolean
    analytics: boolean
  }
  dashboard: {
    defaultView: string
    autoRefresh: boolean
    refreshInterval: number
  }
  logo?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light', // 'light' or 'dark'
    colors: {
      light: {
        bg: '#F1F5F9',
        surface: '#FFFFFF',
        main: '#0045D6',
        text: '#1E293B',
        border: '#E2E8F0',
        selected: '#EFF6FF',
        paragraph: '#64748B',
        secondary: '#64748B',
        gradientStart: '#2563EB',
        gradientVia: '#1D4ED8',
        gradientEnd: '#4338CA',
        header: '#FFFFFF',
        sidebar: '#F8FAFC'
      },
      dark: {
        bg: '#020617',
        surface: '#1E293B',
        main: '#60A5FA',
        text: '#F1F5F9',
        border: '#0F172A',
        header: '#0B1120',
        paragraph: '#94A3B8',
        sidebar: '#0F172A',
        selected: '#1E40AF',
        secondary: '#64748B',
        gradientStart: '#1E40AF',
        gradientVia: '#1E3A8A',
        gradientEnd: '#312E81'
      }
    },
    notifications: {
      email: true,
      push: false,
      reports: true,
      alerts: true
    },
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    dashboard: {
      defaultView: 'overview',
      autoRefresh: true,
      refreshInterval: 300 // seconds
    }
  })

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
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }

        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          setPermissions(permissionsData)
        }

        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings({ ...settings, ...parsed })
          // Apply custom colors on load
          if (parsed.colors) {
            applyColors(parsed.colors)
          }
        }
      } catch (err) {
        setError('Falha ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const applyColors = (colors: any) => {
    const root = document.documentElement
    Object.keys(colors.light).forEach(key => {
      root.style.setProperty(`--primary-${key}`, colors.light[key])
    })
    Object.keys(colors.dark).forEach(key => {
      root.style.setProperty(`--dark-${key}`, colors.dark[key])
    })
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Save to backend
      const response = await fetch('http://localhost:8000/users/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar configurações no servidor')
      }

      // Also save to localStorage as backup
      localStorage.setItem('userSettings', JSON.stringify(settings))

      // Apply theme immediately
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // Apply custom colors
      applyColors(settings.colors)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Falha ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefault = () => {
    const defaultSettings: UserSettings = {
      theme: 'light',
      colors: {
        light: {
          bg: '#F1F5F9',
          surface: '#FFFFFF',
          main: '#0045D6',
          text: '#1E293B',
          border: '#E2E8F0',
          selected: '#EFF6FF',
          paragraph: '#64748B',
          secondary: '#64748B',
          gradientStart: '#2563EB',
          gradientVia: '#1D4ED8',
          gradientEnd: '#4338CA',
          header: '#FFFFFF',
          sidebar: '#F8FAFC'
        },
        dark: {
          bg: '#020617',
          surface: '#1E293B',
          main: '#60A5FA',
          text: '#F1F5F9',
          border: '#0F172A',
          header: '#0B1120',
          paragraph: '#94A3B8',
          sidebar: '#0F172A',
          selected: '#1E40AF',
          secondary: '#64748B',
          gradientStart: '#1E40AF',
          gradientVia: '#1E3A8A',
          gradientEnd: '#312E81'
        }
      },
      notifications: {
        email: true,
        push: false,
        reports: true,
        alerts: true
      },
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      privacy: {
        profileVisibility: 'private',
        dataSharing: false,
        analytics: true
      },
      dashboard: {
        defaultView: 'overview',
        autoRefresh: true,
        refreshInterval: 300
      }
    }

    setSettings(defaultSettings)

    // Apply default theme
    document.documentElement.classList.remove('dark')

    // Apply default colors
    applyColors(defaultSettings.colors)
  }

  const updateSetting = (category: string, key: string, value: any) => {
    if (category === 'colors') {
      const mode = key.split('.')[0] as 'light' | 'dark'
      const colorKey = key.split('.')[1]
      setSettings(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          [mode]: {
            ...prev.colors[mode],
            [colorKey]: value
          }
        }
      }))
    } else if (category === 'notifications' || category === 'privacy' || category === 'dashboard') {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...(prev[category as keyof typeof prev] as object),
          [key]: value
        }
      }))
    } else if (category === 'theme' || category === 'language' || category === 'timezone') {
      setSettings(prev => ({
        ...prev,
        [category]: value
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [category]: value
      }))
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
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="bg-gradient-custom dark:bg-gradient-custom-dark rounded-2xl p-8 mb-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Settings size={40} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Configurações</h1>
                    <p className="text-blue-100 text-lg">Personalize sua experiência no sistema</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border border-red-400/30 hover:bg-red-500/30"
                  >
                    <RotateCcw size={20} />
                    <span>Resetar para Padrão</span>
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : saved ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Save size={20} />
                    )}
                    <span>{saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Configurações'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Appearance Settings */}
              <div className="lg:col-span-1">
                <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-border rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-primary-text dark:text-dark-text mb-6 flex items-center">
                    <Palette size={24} className="mr-2 text-blue-500" />
                    Aparência
                  </h3>

                  <div className="space-y-6">
                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-3 flex items-center">
                        <Sun size={16} className="mr-2 text-yellow-500" />
                        Tema
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => updateSetting('theme', '', 'light')}
                          className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                            settings.theme === 'light'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Sun size={18} />
                          <span className="text-sm font-medium">Claro</span>
                        </button>
                        <button
                          onClick={() => updateSetting('theme', '', 'dark')}
                          className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                            settings.theme === 'dark'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Moon size={18} />
                          <span className="text-sm font-medium">Escuro</span>
                        </button>
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-3 flex items-center">
                        <Globe size={16} className="mr-2 text-green-500" />
                        Idioma
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => updateSetting('language', '', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-3">
                        Fuso Horário
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => updateSetting('timezone', '', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                        <option value="America/New_York">New York (GMT-5)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                        <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications & Privacy */}
              <div className="lg:col-span-2 space-y-8">
                {/* Logo Upload */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-primary-text dark:text-dark-text mb-6 flex items-center">
                    <Settings size={24} className="mr-2 text-green-500" />
                    Logo da Empresa
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-3">
                        Upload da Logo
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                const base64 = e.target?.result as string
                                updateSetting('logo', '', base64)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {settings.logo && (
                          <img
                            src={settings.logo}
                            alt="Logo Preview"
                            className="w-16 h-16 object-contain border border-gray-200 dark:border-gray-600 rounded-lg"
                          />
                        )}
                      </div>
                      <p className="text-xs text-primary-secondary mt-2">
                        Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-primary-text dark:text-dark-text mb-6 flex items-center">
                    <Bell size={24} className="mr-2 text-orange-500" />
                    Notificações
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-primary-text dark:text-dark-text">E-mail</p>
                          <p className="text-sm text-primary-secondary">Receber notificações por e-mail</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'email', !settings.notifications.email)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.email ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-primary-text dark:text-dark-text">Push</p>
                          <p className="text-sm text-primary-secondary">Notificações push no navegador</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'push', !settings.notifications.push)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.push ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-primary-text dark:text-dark-text">Relatórios</p>
                          <p className="text-sm text-primary-secondary">Relatórios automáticos por e-mail</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'reports', !settings.notifications.reports)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.reports ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.reports ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-primary-text dark:text-dark-text">Alertas</p>
                          <p className="text-sm text-primary-secondary">Alertas de sistema importantes</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'alerts', !settings.notifications.alerts)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.alerts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.alerts ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-primary-text dark:text-dark-text mb-6 flex items-center">
                    <Shield size={24} className="mr-2 text-red-500" />
                    Privacidade
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-3">
                        Visibilidade do Perfil
                      </label>
                      <select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="public">Público</option>
                        <option value="private">Privado</option>
                        <option value="team">Apenas equipe</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary-text dark:text-dark-text">Compartilhamento de Dados</p>
                        <p className="text-sm text-primary-secondary">Permitir compartilhamento de dados anônimos para melhorias</p>
                      </div>
                      <button
                        onClick={() => updateSetting('privacy', 'dataSharing', !settings.privacy.dataSharing)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.privacy.dataSharing ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.privacy.dataSharing ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary-text dark:text-dark-text">Analytics</p>
                        <p className="text-sm text-primary-secondary">Coletar dados de uso para análise</p>
                      </div>
                      <button
                        onClick={() => updateSetting('privacy', 'analytics', !settings.privacy.analytics)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.privacy.analytics ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.privacy.analytics ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dashboard Settings */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-primary-text dark:text-dark-text mb-6 flex items-center">
                    <User size={24} className="mr-2 text-purple-500" />
                    Dashboard
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-3">
                        Visualização Padrão
                      </label>
                      <select
                        value={settings.dashboard.defaultView}
                        onChange={(e) => updateSetting('dashboard', 'defaultView', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="overview">Visão Geral</option>
                        <option value="analytics">Análises</option>
                        <option value="reports">Relatórios</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-3">
                        Intervalo de Atualização (segundos)
                      </label>
                      <select
                        value={settings.dashboard.refreshInterval}
                        onChange={(e) => updateSetting('dashboard', 'refreshInterval', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value={60}>1 minuto</option>
                        <option value={300}>5 minutos</option>
                        <option value={600}>10 minutos</option>
                        <option value={1800}>30 minutos</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary-text dark:text-dark-text">Atualização Automática</p>
                      <p className="text-sm text-primary-secondary">Atualizar dados automaticamente</p>
                    </div>
                    <button
                      onClick={() => updateSetting('dashboard', 'autoRefresh', !settings.dashboard.autoRefresh)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.dashboard.autoRefresh ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.dashboard.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Color Customization */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-semibold text-primary-text dark:text-dark-text mb-6 flex items-center">
                    <Palette size={24} className="mr-2 text-indigo-500" />
                    Personalização de Cores
                  </h3>

                  <div className="space-y-8">
                    {/* Light Mode Colors */}
                    <div>
                      <h4 className="text-lg font-medium text-primary-text dark:text-dark-text mb-4 flex items-center">
                        <Sun size={20} className="mr-2 text-yellow-500" />
                        Modo Claro
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Fundo
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.bg}
                            onChange={(e) => updateSetting('colors', 'light.bg', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Superfície
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.surface}
                            onChange={(e) => updateSetting('colors', 'light.surface', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Principal
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.main}
                            onChange={(e) => updateSetting('colors', 'light.main', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Texto
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.text}
                            onChange={(e) => updateSetting('colors', 'light.text', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Borda
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.border}
                            onChange={(e) => updateSetting('colors', 'light.border', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Selecionado
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.selected}
                            onChange={(e) => updateSetting('colors', 'light.selected', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Parágrafo
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.paragraph}
                            onChange={(e) => updateSetting('colors', 'light.paragraph', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Secundário
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.secondary}
                            onChange={(e) => updateSetting('colors', 'light.secondary', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Gradiente Início
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.gradientStart}
                            onChange={(e) => updateSetting('colors', 'light.gradientStart', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Gradiente Meio
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.gradientVia}
                            onChange={(e) => updateSetting('colors', 'light.gradientVia', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Gradiente Fim
                          </label>
                          <input
                            type="color"
                            value={settings.colors.light.gradientEnd}
                            onChange={(e) => updateSetting('colors', 'light.gradientEnd', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gradient Colors */}
                    <div>
                      <h4 className="text-lg font-medium text-primary-text dark:text-dark-text mb-4 flex items-center">
                        <Palette size={20} className="mr-2 text-purple-500" />
                        Gradientes
                      </h4>
                      <div className="space-y-6">
                        {/* Light Mode Gradient */}
                        <div>
                          <h5 className="text-md font-medium text-primary-text dark:text-dark-text mb-3 flex items-center">
                            <Sun size={16} className="mr-2 text-yellow-500" />
                            Gradiente Modo Claro
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-primary-secondary mb-2">
                                Início
                              </label>
                              <input
                                type="color"
                                value={settings.colors.light.gradientStart}
                                onChange={(e) => updateSetting('colors', 'light.gradientStart', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-primary-secondary mb-2">
                                Meio
                              </label>
                              <input
                                type="color"
                                value={settings.colors.light.gradientVia}
                                onChange={(e) => updateSetting('colors', 'light.gradientVia', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-primary-secondary mb-2">
                                Fim
                              </label>
                              <input
                                type="color"
                                value={settings.colors.light.gradientEnd}
                                onChange={(e) => updateSetting('colors', 'light.gradientEnd', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dark Mode Gradient */}
                        <div>
                          <h5 className="text-md font-medium text-primary-text dark:text-dark-text mb-3 flex items-center">
                            <Moon size={16} className="mr-2 text-blue-500" />
                            Gradiente Modo Escuro
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-primary-secondary mb-2">
                                Início
                              </label>
                              <input
                                type="color"
                                value={settings.colors.dark.gradientStart}
                                onChange={(e) => updateSetting('colors', 'dark.gradientStart', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-primary-secondary mb-2">
                                Meio
                              </label>
                              <input
                                type="color"
                                value={settings.colors.dark.gradientVia}
                                onChange={(e) => updateSetting('colors', 'dark.gradientVia', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-primary-secondary mb-2">
                                Fim
                              </label>
                              <input
                                type="color"
                                value={settings.colors.dark.gradientEnd}
                                onChange={(e) => updateSetting('colors', 'dark.gradientEnd', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dark Mode Colors */}
                    <div>
                      <h4 className="text-lg font-medium text-primary-text dark:text-dark-text mb-4 flex items-center">
                        <Moon size={20} className="mr-2 text-blue-500" />
                        Modo Escuro
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Fundo
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.bg}
                            onChange={(e) => updateSetting('colors', 'dark.bg', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Superfície
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.surface}
                            onChange={(e) => updateSetting('colors', 'dark.surface', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Principal
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.main}
                            onChange={(e) => updateSetting('colors', 'dark.main', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Texto
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.text}
                            onChange={(e) => updateSetting('colors', 'dark.text', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Borda
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.border}
                            onChange={(e) => updateSetting('colors', 'dark.border', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Header
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.header}
                            onChange={(e) => updateSetting('colors', 'dark.header', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Parágrafo
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.paragraph}
                            onChange={(e) => updateSetting('colors', 'dark.paragraph', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Sidebar
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.sidebar}
                            onChange={(e) => updateSetting('colors', 'dark.sidebar', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Selecionado
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.selected}
                            onChange={(e) => updateSetting('colors', 'dark.selected', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Secundário
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.secondary}
                            onChange={(e) => updateSetting('colors', 'dark.secondary', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Gradiente Início
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.gradientStart}
                            onChange={(e) => updateSetting('colors', 'dark.gradientStart', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Gradiente Meio
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.gradientVia}
                            onChange={(e) => updateSetting('colors', 'dark.gradientVia', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-secondary mb-2">
                            Gradiente Fim
                          </label>
                          <input
                            type="color"
                            value={settings.colors.dark.gradientEnd}
                            onChange={(e) => updateSetting('colors', 'dark.gradientEnd', e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
