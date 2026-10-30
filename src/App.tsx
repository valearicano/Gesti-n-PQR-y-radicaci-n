/**
 * Plataforma Inteligente de Gestión PQR y Radicaciones Bancarias
 * Bancolima S.A. - Arquitectura de Cumplimiento Normativo SFC
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CommercialAssistant } from './components/CommercialAssistant';
import { PromoterAssistant } from './components/PromoterAssistant';
import { BatchPQRReader } from './components/BatchPQRReader';
import { CatalogAdmin } from './components/CatalogAdmin';
import { AuditBenchmark } from './components/AuditBenchmark';
import { UserRole } from './types';
import { ShieldCheck, CheckCircle2, Lock, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'commercial' | 'promoter' | 'batch' | 'admin' | 'benchmark'>('commercial');
  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserRole[]>([]);
  const [transferText, setTransferText] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setCurrentUser(data.user);
        if (data.availableUsers) setAvailableUsers(data.availableUsers);
      })
      .catch(console.error);
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error('Error al cambiar de rol:', e);
    }
  };

  const handleTransferToBatch = (text: string) => {
    setTransferText(text);
    setActiveTab('batch');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Barra de Navegación Institucional */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSwitchUser={handleSwitchUser}
      />

      {/* Contenido Principal de los Módulos */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'commercial' && (
          <CommercialAssistant onTransferToBatch={handleTransferToBatch} />
        )}

        {activeTab === 'promoter' && (
          <PromoterAssistant 
            currentUser={currentUser} 
            onOpenCatalog={() => setActiveTab('admin')} 
          />
        )}

        {activeTab === 'batch' && (
          <BatchPQRReader initialTextToBatch={transferText} />
        )}

        {activeTab === 'admin' && (
          <CatalogAdmin currentUser={currentUser} />
        )}

        {activeTab === 'benchmark' && (
          <AuditBenchmark />
        )}
      </main>

      {/* Footer Institucional de Seguridad y Cumplimiento Bancario */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">
                Plataforma Inteligente de Gestión PQR y Radicaciones • Cumplimiento Circular Externa 029 de 2014
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Catálogo APY Aprobado v3.8
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <Lock className="w-3.5 h-3.5" />
              Seguridad RLS & Auditoría Cifrada
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 font-mono">
              Perfil: {currentUser?.cargo || 'Sesión Segura'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
