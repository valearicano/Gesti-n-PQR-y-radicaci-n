import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  History, 
  ListOrdered, 
  AlertTriangle, 
  Send, 
  Search, 
  FileCheck,
  Check
} from 'lucide-react';
import { BenchmarkResultItem, AuditLog, RuleVersion } from '../types';

export const AuditBenchmark: React.FC = () => {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResultItem[]>([]);
  const [benchmarking, setBenchmarking] = useState(false);
  const [stats, setStats] = useState<{ total: number; aprobados: number; tasaExito: number } | null>(null);

  // Quick Test Bench state
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testingInput, setTestingInput] = useState(false);

  // Audit Logs & Versions
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [ruleVersions, setRuleVersions] = useState<RuleVersion[]>([]);
  const [logSearch, setLogSearch] = useState('');

  const loadAuditData = () => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        if (data.logs) setAuditLogs(data.logs);
      })
      .catch(console.error);

    fetch('/api/catalog/rules')
      .then(res => res.json())
      .then(data => {
        if (data.versions) setRuleVersions(data.versions);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const runGoldenBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch('/api/benchmarks/run', { method: 'POST' });
      const data = await res.json();
      if (data.results) {
        setBenchmarkResults(data.results);
        setStats({
          total: data.total,
          aprobados: data.aprobados,
          tasaExito: data.tasaExito
        });
      }
      loadAuditData();
    } catch (err) {
      console.error(err);
      alert('Error ejecutando banco de pruebas');
    } finally {
      setBenchmarking(false);
    }
  };

  const handleTestSingleInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    setTestingInput(true);
    try {
      const res = await fetch('/api/pqr/process-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{
            id: 'TEST-LAB-01',
            descripcionDetallada: testInput,
            resumenCliente: 'Prueba en vivo laboratorio',
            subcategoriaInicial: 'Sin clasificar'
          }]
        })
      });
      const data = await res.json();
      if (data.rows && data.rows.length > 0) {
        setTestResult(data.rows[0]);
      }
      loadAuditData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setTestingInput(false);
    }
  };

  const filteredLogs = auditLogs.filter(l => 
    l.accion.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.usuario.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.detalle.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.entidad.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Verificación Institucional y Cumplimiento Normativo</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Banco de Pruebas de Oro y Bitácora de Auditoría
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Valide de forma exhaustiva la efectividad del motor frente a casos críticos, ambiguos y trampas lingüísticas (conector &quot;sin embargo&quot;, cuotas de crédito vs manejo, mención incidental de cuenta vs CDT, GMF, PSE, Fraude y Cancelación).
            </p>
          </div>

          <button
            onClick={runGoldenBenchmark}
            disabled={benchmarking}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {benchmarking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Ejecutando 8 Casos de Oro...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Ejecutar Banco de Pruebas de Oro (Benchmark)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultados del Benchmark de Oro */}
      {stats && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-700">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400">
                Resultado de Certificación de Reglas Críticas
              </span>
              <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{stats.aprobados} de {stats.total} Casos Aprobados</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {stats.tasaExito}% Cumplimiento
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Cero tolerancia a trampas sintácticas y falsos positivos
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benchmarkResults.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                  item.passed 
                    ? 'bg-slate-900/90 border-emerald-800/80' 
                    : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="font-bold text-white text-xs">{item.testCase.titulo}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    item.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {item.passed ? 'PASÓ (100%)' : 'FALLÓ'}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 text-[11px] italic">
                  &quot;{item.testCase.descripcionDetallada}&quot;
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Subcategoría Inicial Errónea:</span>
                    <span className="text-rose-400 line-through">
                      {item.testCase.subcategoriaInicialErronea}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Categoría y APY Esperado:</span>
                    <span className="text-emerald-400 font-bold">
                      {item.testCase.categoriaEsperada} (APY {item.testCase.codigoApyEsperado})
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-blue-400 block mb-0.5">Regla Verificada:</strong>
                  <span>{item.testCase.reglaVerificada}</span>
                  <p className="text-slate-400 mt-1">{item.detalleVerificacion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Laboratorio de Pruebas Rápidas (Test Bench) */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue-400" />
          Laboratorio Interactivo de Pruebas de Reglas (Test Bench en Vivo)
        </h2>
        <p className="text-xs text-slate-400">
          Escriba o pegue cualquier texto de reclamación bancaria para observar en tiempo real cómo reacciona el motor de reglas críticas frente al conector &quot;sin embargo&quot;, préstamos vs cuotas de manejo, cuentas vs CDT, etc.
        </p>

        <form onSubmit={handleTestSingleInput} className="space-y-3">
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Ejemplo: Pagué la cuota de mi préstamo puntual, sin embargo me llamaron a cobrar intereses moratorios indebidos..."
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setTestInput('Pagué a tiempo mi tarjeta de crédito, sin embargo me suspendieron el plástico.')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
              >
                Probar &quot;sin embargo&quot;
              </button>
              <button
                type="button"
                onClick={() => setTestInput('La cuota de mi crédito de vehículo subió de valor sin informarme en el extracto.')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
              >
                Probar cuota de crédito
              </button>
              <button
                type="button"
                onClick={() => setTestInput('Hice una transferencia desde mi cuenta de ahorros a otro banco y no se reflejó.')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
              >
                Probar cuenta no es CDT
              </button>
              <button
                type="button"
                onClick={() => setTestInput('Solicité la devolución de la fianza FGA porque pagué la totalidad del crédito anticipado.')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
              >
                Probar FGA APY 267
              </button>
            </div>

            <button
              type="submit"
              disabled={testingInput || !testInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {testingInput ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Evaluar Texto</span>
            </button>
          </div>
        </form>

        {testResult && (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3 text-xs mt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">
                Resultado del Motor de Reglas en Vivo
              </span>
              <span className="font-mono text-xs px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-900 rounded font-bold">
                APY {testResult._codigoApySugerido}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Categoría Normalizada:</span>
                <span className="text-emerald-400 font-bold">{testResult._categoriaNormalizada}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Área Responsable:</span>
                <span className="text-white font-medium">{testResult._areaResponsable}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Nivel de Confianza:</span>
                <span className="text-blue-400 font-mono font-bold">{testResult._confianza}%</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Regla Crítica Aplicada:</span>
              <span className="text-amber-300 font-semibold">{testResult._reglaAplicada}</span>
            </div>

            <p className="text-slate-300 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
              {testResult._justificacionTecnica}
            </p>

            {testResult._alertasReglas && testResult._alertasReglas.length > 0 && (
              <div className="p-2.5 bg-amber-950/40 border border-amber-800 rounded-lg text-amber-200 text-[11px]">
                {testResult._alertasReglas.map((a: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trazabilidad: Versiones de Reglas y Bitácora de Auditoría */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Historial de Versiones de Reglas */}
        <div className="lg:col-span-5 bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            Historial de Versiones de Reglas (Changelog)
          </h2>

          <div className="space-y-3">
            {ruleVersions.map((v) => (
              <div
                key={v.id}
                className="bg-slate-900 p-3 rounded-xl border border-slate-700/70 text-xs space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900 text-[11px]">
                    Versión {v.version}.0
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{v.fecha}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Por: {v.usuario}</div>
                <p className="text-slate-200 text-xs">{v.cambios}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bitácora de Auditoría en Tiempo Real */}
        <div className="lg:col-span-7 bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-400" />
              Bitácora de Trazabilidad y Auditoría en Vivo
            </h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filtrar eventos de auditoría..."
                className="bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-96 rounded-xl border border-slate-700 divide-y divide-slate-700/60 bg-slate-900/60 text-xs">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 space-y-1 hover:bg-slate-850 transition">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                    {log.accion}
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                </div>
                <div className="text-slate-300">{log.detalle}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                  <span>Usuario: <strong className="text-slate-300">{log.usuario}</strong></span>
                  <span>•</span>
                  <span>Rol: <strong className="text-blue-300">{log.rol}</strong></span>
                  <span>•</span>
                  <span>Entidad: <strong className="text-slate-300">{log.entidad}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
