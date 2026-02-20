'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut, User, MapPin, Clock, Cloud, Bell, Settings, Menu, ChevronDown, MessageCircle, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [weather, setWeather] = useState('')
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get location and weather using browser Geolocation API
    const fetchLocationAndWeather = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            setLocation('Salvador, BA')
            
            try {
              const weatherRes = await fetch(`${apiUrl}/weather?latitude=${latitude}&longitude=${longitude}`)
              if (weatherRes.ok) {
                const weatherData = await weatherRes.json()
                if (weatherData.temperature !== undefined) {
                  setWeather(`${weatherData.temperature}°C`)
                }
              }
            } catch (err) {
              console.log('Weather fetch error:', err)
              setWeather('28°C') // Default Salvador temperature
            }
          },
          async (error) => {
            // If browser geolocation fails, try IP-based location
            console.log('Browser geolocation failed, trying IP-based location:', error.message)
            try {
              const locationRes = await fetch(`${apiUrl}/location`)
              if (!locationRes.ok) throw new Error('Location fetch failed')
              
              const data = await locationRes.json()
              if (data.latitude && data.longitude) {
                setLocation(`${data.city}, ${data.region}`)
                
                const weatherRes = await fetch(`${apiUrl}/weather?latitude=${data.latitude}&longitude=${data.longitude}`)
                if (weatherRes.ok) {
                  const weatherData = await weatherRes.json()
                  if (weatherData.temperature !== undefined) {
                    setWeather(`${weatherData.temperature}°C`)
                  }
                }
              }
            } catch (err) {
              console.log('Location/Weather error:', err)
              setLocation('Salvador, BA')
              setWeather('28°C')
            }
          }
        )
      } else {
        // Browser doesn't support geolocation, try IP-based
        try {
          const locationRes = await fetch(`${apiUrl}/location`)
          if (!locationRes.ok) throw new Error('Location fetch failed')
          
          const data = await locationRes.json()
          if (data.latitude && data.longitude) {
            setLocation(`${data.city}, ${data.region}`)
            
            const weatherRes = await fetch(`${apiUrl}/weather?latitude=${data.latitude}&longitude=${data.longitude}`)
            if (weatherRes.ok) {
              const weatherData = await weatherRes.json()
              if (weatherData.temperature !== undefined) {
                setWeather(`${weatherData.temperature}°C`)
              }
            }
          }
        } catch (err) {
          console.log('Location/Weather error:', err)
          setLocation('Salvador, BA')
          setWeather('28°C')
        }
      }
    }

    fetchLocationAndWeather()

    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const infoItems = [
    { icon: MapPin, label: location || 'Loading...', color: 'rose' },
    { icon: Clock, label: time, color: 'blue' },
    { icon: Cloud, label: weather || 'Loading...', color: 'amber' },
  ]

  return (
    <header className="bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-sans sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 dark:shadow-blue-500/30">
                <Image
                  src="/fotos/infologo.png"
                  alt="Logo"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl blur opacity-30 animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Sistema de Controle
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">de Custos</p>
            </div>
          </div>

          {/* Info Bar - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            {infoItems.map((item, index) => {
              const Icon = item.icon
              const colorClasses = {
                rose: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20',
                blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
                amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
              }
              return (
                <div
                  key={index}
                  className={`
                    flex items-center space-x-2 px-3 py-1.5 rounded-full
                    backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50
                    ${colorClasses[item.color as keyof typeof colorClasses]}
                  `}
                >
                  <Icon size={14} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Chat Button */}
            <button
              onClick={() => {
                localStorage.setItem('chatOpen', 'true')
                window.dispatchEvent(new CustomEvent('chatToggle'))
              }}
              className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-900/20 dark:hover:to-slate-800/50 rounded-xl transition-all duration-200 group hover:shadow-lg hover:shadow-blue-500/20"
              title="Chat com IA"
            >
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            </button>

            {/* Notifications */}
            <button className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group">
              <Bell size={20} className="group-hover:scale-110 transition-transform" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <User size={16} className="text-white" />
                </div>
                <span className="hidden md:inline font-medium text-sm">Perfil</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white">Usuário</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">usuario@exemplo.com</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false)
                        router.push('/profile')
                      }}
                      className="flex items-center space-x-3 w-full px-3 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      <User size={18} />
                      <span className="text-sm font-medium">Ver Perfil</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false)
                        router.push('/settings')
                      }}
                      className="flex items-center space-x-3 w-full px-3 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      <Settings size={18} />
                      <span className="text-sm font-medium">Configurações</span>
                    </button>
                  </div>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-3 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-medium">Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3">
              {/* Info Items */}
              <div className="flex flex-wrap gap-2">
                {infoItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl"
                    >
                      <Icon size={14} className="text-blue-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 pt-2">
                <button className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <Bell size={20} />
                  <span className="font-medium">Notificações</span>
                </button>
                <button 
                  onClick={() => router.push('/settings')}
                  className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Settings size={20} />
                  <span className="font-medium">Configurações</span>
                </button>
                <button 
                  onClick={() => router.push('/profile')}
                  className="flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <User size={20} />
                  <span className="font-medium">Perfil</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                >
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
