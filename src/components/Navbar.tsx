import React from 'react';
import { ShieldCheck, Layers, FileSpreadsheet, Headset, BookOpen, UserCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: 'commercial' | 'promoter' | 'batch' | 'admin' | 'benchmark';
  setActiveTab: (tab: 'commercial' | 'promoter' | 'batch' | 'admin' | 'benchmark') => void;
  currentUser: UserRole | null;
  availableUsers: UserRole[];
  onSwitchUser: (userId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  availableUsers,
  onSwitchUser
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Top Banner Institucional */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-4 py-1.5 border-b border-slate-800/80 text-xs flex justify-between items-center text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400">Sistema Central de Operaciones & Gestión PQR</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-400">
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Normativa SFC Circular Básica Jurídica CE 029/2014
          </span>
          <span className="text-xs text-emerald-400 font-mono">Motor v3.8.4 ACTIVO</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>PQR & RADICACIONES</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full">
                  Bancario
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Orientación Comercial, Asistencia APY y Clasificación IA
              </p>
            </div>
          </div>

          {/* Module Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('commercial')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'commercial'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Headset className="w-4 h-4" />
              <span>1. Asistente Comercial</span>
            </button>

            <button
              onClick={() => setActiveTab('promoter')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'promoter'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>2. Asistente Promotores</span>
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'batch'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>3. Lector Masivo PQR</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>4. Catálogos y Admin</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'benchmark'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Banco de Pruebas de Reglas Críticas (Golden Test Cases)"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span className="hidden lg:inline">Auditoría & Casos de Oro</span>
              <span className="lg:hidden">Auditoría</span>
            </button>
          </nav>

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-left transition"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                {currentUser?.nombre?.charAt(0) || 'U'}
              </div>
              <div className="hidden xl:block">
                <div className="text-white font-medium truncate max-w-[140px]">
                  {currentUser?.nombre}
                </div>
                <div className="text-slate-400 text-[10px] truncate max-w-[140px]">
                  {currentUser?.cargo}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Conmutador de Rol (RBAC)
                  </p>
                  <p className="text-xs text-slate-500">
                    Cambie de perfil para validar permisos institucionales
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-start space-x-2 text-xs hover:bg-slate-800 transition ${
                        currentUser?.id === u.id ? 'bg-blue-950/60 text-blue-300' : 'text-slate-300'
                      }`}
                    >
                      <UserCircle className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{u.nombre}</span>
                          {currentUser?.id === u.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.cargo}</div>
                        <div className="text-[10px] text-blue-400 font-mono mt-0.5">{u.rol}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
