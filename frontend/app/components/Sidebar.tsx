'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  Folder, 
  Settings, 
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (savedState !== null) {
      setCollapsed(savedState === 'true')
    }
    setIsInitialized(true)
  }, [])

  // Save to localStorage whenever collapsed state changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
    }
  }, [collapsed, isInitialized])

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/users', icon: Users, label: 'Usuários' },
    { href: '/filiais', icon: Building2, label: 'Filiais' },
    { href: '/departamentos', icon: Home, label: 'Departamentos' },
    { href: '/setores', icon: Briefcase, label: 'Setores' },
    { href: '/saved-files', icon: Folder, label: 'Arquivos Salvos' },
    { href: '/settings', icon: Settings, label: 'Configurações' },
  ]

  const isActive = (href: string) => pathname === href

  // Handle mobile close
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  // Don't render on mobile unless open
  if (isMobile && !isOpen) {
    return null
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`
          relative flex flex-col h-screen bg-gradient-to-b from-primary-surface to-primary-bg 
          dark:from-dark-sidebar dark:to-dark-bg 
          border-r border-primary-border dark:border-dark-border
          shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50
          transition-all duration-300 ease-in-out
          z-50
          ${isMobile 
            ? `fixed top-0 left-0 w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'}` 
            : `${collapsed ? 'w-20' : 'w-64'}`
          }
        `}
      >
          {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      {/* Header Section */}
      <div className="p-4 border-b border-primary-border dark:border-dark-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 dark:shadow-blue-500/30">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-primary-text dark:text-dark-text text-lg leading-tight">
                  Metric
                </span>
                <span className="text-xs text-primary-paragraph dark:text-dark-paragraph">
                  Gestão
                </span>
              </div>
            </div>
          )}
          
          {collapsed && (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 dark:shadow-blue-500/30">
              <span className="text-white font-bold text-lg">M</span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`
          absolute -right-3 top-20 z-10
          w-6 h-6 rounded-full
          bg-primary-surface dark:bg-dark-surface
          border-2 border-primary-border dark:border-dark-border
          shadow-md
          flex items-center justify-center
          text-primary-paragraph dark:text-dark-paragraph
          hover:text-blue-600 dark:hover:text-blue-400
          hover:border-blue-600 dark:hover:border-blue-400
          hover:scale-110
          transition-all duration-200
          ${collapsed ? 'rotate-180' : ''}
        `}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-3 rounded-xl
                  transition-all duration-200 ease-out
                  ${active 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg shadow-blue-600/30 dark:shadow-blue-600/40' 
                    : 'text-primary-paragraph dark:text-dark-paragraph hover:bg-primary-bg dark:hover:bg-dark-bg hover:text-blue-600 dark:hover:text-blue-400'
                  }
                  ${collapsed ? 'justify-center' : ''}
                  ${collapsed ? 'hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-50 dark:hover:from-blue-900/40 dark:hover:to-blue-800/30 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon 
                  size={22} 
                  className={`
                    flex-shrink-0 transition-transform duration-200
                    ${active ? '' : 'group-hover:scale-110'}
                  `} 
                />
                {!collapsed && (
                  <span className="font-medium text-sm truncate">
                    {item.label}
                  </span>
                )}
                
                {/* Active indicator dot when collapsed */}
                {active && collapsed && (
                  <span className="absolute left-2 w-1.5 h-1.5 rounded-full bg-white"></span>
                )}
              </Link>
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="
                  absolute left-full ml-2 px-3 py-2 
                  bg-dark-surface dark:bg-dark-header 
                  text-white text-sm rounded-lg
                  shadow-xl
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200
                  whitespace-nowrap
                  z-50
                ">
                  {item.label}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-dark-surface dark:bg-dark-header rotate-45"></div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className={`
        p-3 border-t border-primary-border dark:border-dark-border
        transition-all duration-300
        ${collapsed ? 'space-y-2' : ''}
      `}>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}
          className={`
            flex items-center space-x-3 px-3 py-3 w-full rounded-xl
            text-red-600 dark:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20
            hover:text-red-700 dark:hover:text-red-300
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
            ${collapsed ? 'hover:bg-gradient-to-r hover:from-red-100 hover:to-red-50 dark:hover:from-red-900/40 dark:hover:to-red-800/30 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20' : ''}
          `}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={22} className="flex-shrink-0" />
          {!collapsed && (
            <span className="font-medium text-sm">Sair</span>
          )}
        </button>
      </div>
    </aside>
    </>
  )
}
