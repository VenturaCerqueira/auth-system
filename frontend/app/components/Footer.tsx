'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: Github, label: 'GitHub', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
  ]

  return (
    <footer className="bg-primary-surface dark:bg-dark-sidebar border-t border-primary-border dark:border-dark-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-3">
          {/* Copyright */}
          <div className="flex items-center space-x-2 text-sm text-primary-paragraph dark:text-dark-paragraph">
            <span>© {currentYear} <span className="font-semibold text-primary-text dark:text-dark-text">Metric</span>. Todos os direitos reservados.</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="text-primary-paragraph dark:text-dark-paragraph hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label={social.label}
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm mt-2 md:mt-0">
            <Link href="/dashboard" className="text-primary-paragraph dark:text-dark-paragraph hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Início
            </Link>
            <Link href="/settings" className="text-primary-paragraph dark:text-dark-paragraph hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Configurações
            </Link>
            <a href="#" className="text-primary-paragraph dark:text-dark-paragraph hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Ajuda
            </a>
          </div>

          {/* Version */}
          <div className="text-xs text-primary-secondary dark:text-dark-secondary mt-2 md:mt-0">
            v1.0.0
          </div>
        </div>
      </div>
    </footer>
  )
}
