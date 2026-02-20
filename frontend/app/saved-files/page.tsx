'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

interface User {
  email: string
  full_name: string
  role: string
  disabled: boolean
}

interface FileData {
  name: string
  file_type: string
  uploaded_by: string
  uploaded_at: string
}

export default function SavedFiles() {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<FileData[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const [userResponse, permissionsResponse, filesResponse] = await Promise.all([
          fetch('http://localhost:8000/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch('http://localhost:8000/permissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch('http://localhost:8000/files', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ])

        if (userResponse.ok && permissionsResponse.ok && filesResponse.ok) {
          const userData = await userResponse.json()
          const permissionsData = await permissionsResponse.json()
          const filesData = await filesResponse.json()
          setUser(userData)
          setPermissions(permissionsData.permissions)
          setFiles(filesData.files)
        } else {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

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
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary-text dark:text-dark-text mb-2">Arquivos Salvos</h1>
              <p className="text-lg text-primary-border dark:text-dark-text">Todos os arquivos CSV e XLSX importados no banco de dados</p>
            </div>

            <div className="bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6 text-primary-text dark:text-dark-text">Lista de Arquivos</h2>
              {files.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-primary-surface dark:bg-dark-surface border border-primary-border dark:border-dark-surface">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-left text-primary-text dark:text-dark-text font-semibold">
                          Nome do Arquivo
                        </th>
                        <th className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-left text-primary-text dark:text-dark-text font-semibold">
                          Tipo
                        </th>
                        <th className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-left text-primary-text dark:text-dark-text font-semibold">
                          Enviado por
                        </th>
                        <th className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-left text-primary-text dark:text-dark-text font-semibold">
                          Data de Upload
                        </th>
                        <th className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-left text-primary-text dark:text-dark-text font-semibold">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file, index) => (
                        <tr key={index} className="hover:bg-primary-bg dark:hover:bg-dark-bg">
                          <td className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-primary-border dark:text-dark-text">
                            {file.name}
                          </td>
                          <td className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-primary-border dark:text-dark-text">
                            {file.file_type.toUpperCase()}
                          </td>
                          <td className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-primary-border dark:text-dark-text">
                            {file.uploaded_by}
                          </td>
                          <td className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-primary-border dark:text-dark-text">
                            {new Date(file.uploaded_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 border-b border-primary-border dark:border-dark-surface text-primary-border dark:text-dark-text">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                              Carregar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-2xl font-semibold mb-4 text-primary-text dark:text-dark-text">Nenhum arquivo salvo</h3>
                  <p className="text-primary-border dark:text-dark-text">
                    Ainda não há arquivos salvos no banco de dados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
