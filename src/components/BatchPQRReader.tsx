import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  FileCheck, 
  Eye, 
  Sparkles,
  Info
} from 'lucide-react';
import { BatchProcessingStats, ProcessedPQRRow } from '../types';

interface BatchPQRReaderProps {
  initialTextToBatch?: string;
}

export const BatchPQRReader: React.FC<BatchPQRReaderProps> = () => {
  const [fileData, setFileData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [processedRows, setProcessedRows] = useState<ProcessedPQRRow[]>([]);
  const [stats, setStats] = useState<BatchProcessingStats | null>(null);

  // Column mapping
  const [colDescription, setColDescription] = useState<string>('Descripcion_Detallada');
  const [colSummary, setColSummary] = useState<string>('Resumen_Cliente');
  const [colLegacyCat, setColLegacyCat] = useState<string>('Subcategoria_Inicial');
  const [colId, setColId] = useState<string>('ID_Expediente');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ruleAlertFilter, setRuleAlertFilter] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ProcessedPQRRow | null>(null);

  // Dataset oficial bancario con las trampas y casos críticos especificados
  const officialSampleCases = [
    {
      ID_Expediente: 'RAD-2026-001',
      Fecha_Radicacion: '2026-10-24',
      Tipo_Documento: 'CC',
      Numero_Documento: '1020455890',
      Resumen_Cliente: 'Embargo de fondos en cuenta',
      Subcategoria_Inicial: 'Embargo Judicial',
      Descripcion_Detallada: 'Pagué puntualmente mi cuota de la tarjeta de crédito el día 15, sin embargo me suspendieron la tarjeta y me están cobrando intereses de mora que no corresponden.',
      Canal: 'App Móvil',
      Monto_Reclamado: 125000,
      Ciudad: 'Bogotá D.C.'
    },
    {
      ID_Expediente: 'RAD-2026-002',
      Fecha_Radicacion: '2026-10-25',
      Tipo_Documento: 'CC',
      Numero_Documento: '52899412',
      Resumen_Cliente: 'Cobro de cuota de manejo en extracto',
      Subcategoria_Inicial: 'Cuota de manejo',
      Descripcion_Detallada: 'Buenos días, estoy muy inconforme porque la cuota del préstamo de libre inversión subió inexplicablemente de $480.000 a $560.000 en el extracto del mes de octubre.',
      Canal: 'Sucursal Calle 72',
      Monto_Reclamado: 80000,
      Ciudad: 'Medellín'
    },
    {
      ID_Expediente: 'RAD-2026-003',
      Fecha_Radicacion: '2026-10-25',
      Tipo_Documento: 'CC',
      Numero_Documento: '79450123',
      Resumen_Cliente: 'Problemas con CDT en sucursal',
      Subcategoria_Inicial: 'CDT e Inversiones',
      Descripcion_Detallada: 'Hice una transferencia desde mi cuenta de ahorros a la cuenta de mi hermana pero el saldo se debitó y a ella nunca le llegó el dinero después de 48 horas.',
      Canal: 'Portal Web',
      Monto_Reclamado: 450000,
      Ciudad: 'Cali'
    },
    {
      ID_Expediente: 'RAD-2026-004',
      Fecha_Radicacion: '2026-10-26',
      Tipo_Documento: 'CC',
      Numero_Documento: '1018449120',
      Resumen_Cliente: 'Cobro tributario excesivo',
      Subcategoria_Inicial: 'Comisiones de cuenta',
      Descripcion_Detallada: 'Solicité hace dos meses la marcación de mi única cuenta de ahorros como exenta de 4x1000 bajo la ley, pero me siguen descontando el gravamen cuatro por mil en cada movimiento.',
      Canal: 'Sucursal Plaza Central',
      Monto_Reclamado: 78500,
      Ciudad: 'Barranquilla'
    },
    {
      ID_Expediente: 'RAD-2026-005',
      Fecha_Radicacion: '2026-10-26',
      Tipo_Documento: 'CC',
      Numero_Documento: '43991200',
      Resumen_Cliente: 'Compra en internet rechazada',
      Subcategoria_Inicial: 'Compras no reconocidas',
      Descripcion_Detallada: 'Pagué la matrícula de la universidad mediante el botón PSE, el banco debitó los $2.400.000 de mi cuenta pero en la universidad salió error de pasarela con código CUS 884712.',
      Canal: 'Línea de Atención',
      Monto_Reclamado: 2400000,
      Ciudad: 'Bucaramanga'
    },
    {
      ID_Expediente: 'RAD-2026-006',
      Fecha_Radicacion: '2026-10-27',
      Tipo_Documento: 'CC',
      Numero_Documento: '1032890455',
      Resumen_Cliente: 'Cargos desconocidos en dólares',
      Subcategoria_Inicial: 'Petición comercial general',
      Descripcion_Detallada: 'Tengo mi tarjeta física en mi poder y me acaban de llegar cuatro notificaciones de compras internacionales en tiendas virtuales de Londres que jamás realicé ni autoricé.',
      Canal: 'Línea de Fraudes',
      Monto_Reclamado: 1850000,
      Ciudad: 'Cartagena'
    },
    {
      ID_Expediente: 'RAD-2026-007',
      Fecha_Radicacion: '2026-10-27',
      Tipo_Documento: 'CC',
      Numero_Documento: '80123456',
      Resumen_Cliente: 'Cancelación definitiva de producto',
      Subcategoria_Inicial: 'Consulta de saldo',
      Descripcion_Detallada: 'Ya pagué la totalidad de mi tarjeta de crédito MasterCard terminada en 8812, mi saldo está en ceros y exijo la cancelación formal definitiva e inmediata del contrato.',
      Canal: 'Sucursal Centro',
      Monto_Reclamado: 0,
      Ciudad: 'Pereira'
    },
    {
      ID_Expediente: 'RAD-2026-008',
      Fecha_Radicacion: '2026-10-28',
      Tipo_Documento: 'CC',
      Numero_Documento: '1098765432',
      Resumen_Cliente: 'Devolución de fianza por pago total',
      Subcategoria_Inicial: 'Paz y Salvo',
      Descripcion_Detallada: 'Pagué anticipadamente la totalidad de mi crédito de vehículo en el mes 12 de 60. Solicito la devolución proporcional de la comisión del Fondo de Garantías FGA cobrada al inicio.',
      Canal: 'Sucursal Virtual',
      Monto_Reclamado: 890000,
      Ciudad: 'Manizales'
    },
    {
      ID_Expediente: 'RAD-2026-009',
      Fecha_Radicacion: '2026-10-28',
      Tipo_Documento: 'CC',
      Numero_Documento: '51778901',
      Resumen_Cliente: 'Cobro de seguro no solicitado',
      Subcategoria_Inicial: 'Comisiones de tarjeta',
      Descripcion_Detallada: 'En mi extracto mensual me aparece un cobro recurrente de $42.000 por concepto de Seguro Tranquilidad Total de Cardif que nunca autoricé ni solicité. Exijo reintegro de todas las primas.',
      Canal: 'Línea Telefónica',
      Monto_Reclamado: 252000,
      Ciudad: 'Ibagué'
    },
    {
      ID_Expediente: 'RAD-2026-010',
      Fecha_Radicacion: '2026-10-29',
      Tipo_Documento: 'CC',
      Numero_Documento: '71234567',
      Resumen_Cliente: 'Inconformidad con rediferido automático',
      Subcategoria_Inicial: 'Reclamación de cupo',
      Descripcion_Detallada: 'Hice unas compras en mi tarjeta a 1 sola cuota y el banco de manera unilateral me las rediferió automáticamente a 36 cuotas generándome intereses excesivos.',
      Canal: 'App Móvil',
      Monto_Reclamado: 1400000,
      Ciudad: 'Cúcuta'
    },
    {
      ID_Expediente: 'RAD-2026-011',
      Fecha_Radicacion: '2026-10-29',
      Tipo_Documento: 'CC',
      Numero_Documento: '32456789',
      Resumen_Cliente: 'Cobro indebido de cuota de manejo en tarjeta',
      Subcategoria_Inicial: 'Cobros no reconocidos',
      Descripcion_Detallada: 'Cuando contraté mi tarjeta de crédito me otorgaron exoneración de cuota de manejo por 12 meses por convenio de nómina, pero este mes me cobraron la tarifa de $29.900.',
      Canal: 'Sucursal Viva',
      Monto_Reclamado: 29900,
      Ciudad: 'Villavicencio'
    },
    {
      ID_Expediente: 'RAD-2026-012',
      Fecha_Radicacion: '2026-10-29',
      Tipo_Documento: 'CC',
      Numero_Documento: '1015678901',
      Resumen_Cliente: 'Cajero no dispensó efectivo',
      Subcategoria_Inicial: 'Error en cajero',
      Descripcion_Detallada: 'Fui al cajero automático del centro comercial a retirar $400.000, el cajero sonó pero no entregó la plata, sin embargo el dinero sí fue debitado de mi saldo en cuenta.',
      Canal: 'Cajero Automático ATM 142',
      Monto_Reclamado: 400000,
      Ciudad: 'Santa Marta'
    }
  ];

  const loadSampleDataset = () => {
    setFileName('Lote_PQR_Institucional_Pruebas_Bancolima.xlsx');
    setFileData(officialSampleCases);
    setColumns(Object.keys(officialSampleCases[0]));
    setColDescription('Descripcion_Detallada');
    setColSummary('Resumen_Cliente');
    setColLegacyCat('Subcategoria_Inicial');
    setColId('ID_Expediente');
    setProcessedRows([]);
    setStats(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];

        if (data.length === 0) {
          alert('El archivo Excel o CSV está vacío.');
          return;
        }

        setFileData(data);
        const cols = Object.keys(data[0]);
        setColumns(cols);

        // Auto-detect best column matches
        const descMatch = cols.find(c => /descripci|hecho|relato|detalle|queja/i.test(c)) || cols[0];
        const sumMatch = cols.find(c => /resumen|asunto|motivo|titulo/i.test(c)) || cols[0];
        const catMatch = cols.find(c => /subcat|categor|clase|tipo/i.test(c)) || cols[0];
        const idMatch = cols.find(c => /id|radic|exped|ticket|numero/i.test(c)) || cols[0];

        setColDescription(descMatch);
        setColSummary(sumMatch);
        setColLegacyCat(catMatch);
        setColId(idMatch);

        setProcessedRows([]);
        setStats(null);
      } catch (err: any) {
        alert('Error al leer el archivo Excel: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleProcessBatch = async () => {
    if (fileData.length === 0) return;
    setLoading(true);

    try {
      // Normalizar registros para el backend
      const recordsToProcess = fileData.map((row, idx) => ({
        ...row,
        id: row[colId] || `RAD-${idx + 1}`,
        descripcionDetallada: row[colDescription] || '',
        resumenCliente: row[colSummary] || '',
        subcategoriaInicial: row[colLegacyCat] || ''
      }));

      const res = await fetch('/api/pqr/process-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToProcess })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el lote PQR');
      }

      setProcessedRows(data.rows);
      setStats(data.stats);
    } catch (err: any) {
      alert('Error en el procesamiento masivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportEnrichedExcel = () => {
    if (processedRows.length === 0) return;

    // Regla obligatoria: Exportar conservando los datos originales íntegros + columnas agregadas de auditoría
    const exportData = processedRows.map(row => {
      const cleanObj: any = {};

      // 1. Añadir primero todas las columnas originales en su orden exacto
      columns.forEach(col => {
        cleanObj[col] = row[col];
      });

      // 2. Añadir columnas oficiales de auditoría y clasificación bancaria
      cleanObj['ESTADO_PROCESAMIENTO'] = row._status;
      cleanObj['CATEGORIA_NORMALIZADA'] = row._categoriaNormalizada;
      cleanObj['INTENCION_REAL_DETECTADA'] = row._intencionReal;
      cleanObj['CODIGO_APY_SUGERIDO'] = row._codigoApySugerido;
      cleanObj['AREA_RESPONSABLE'] = row._areaResponsable;
      cleanObj['REGLA_CRITICA_APLICADA'] = row._reglaAplicada;
      cleanObj['CONFIANZA_CLASIFICACION_%'] = row._confianza;
      cleanObj['REQUIERE_REVISION_HUMANA'] = row._requiereRevisionHumana;
      cleanObj['JUSTIFICACION_TECNICA'] = row._justificacionTecnica;
      cleanObj['ALERTAS_REGLA'] = (row._alertasReglas || []).join(' | ');
      cleanObj['TIEMPO_SLA_ESTIMADO'] = row._tiempoEstimadoSla || 'N/A';

      return cleanObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PQR_Clasificados_Normalizados');

    const downloadFileName = fileName 
      ? `Clasificado_${fileName.replace(/\.[^/.]+$/, '')}.xlsx` 
      : 'PQR_Clasificados_Bancolima.xlsx';

    XLSX.writeFile(workbook, downloadFileName);
  };

  // Filtrado de la tabla
  const filteredRows = processedRows.filter(r => {
    const matchesSearch = 
      String(r._id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r._categoriaNormalizada).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r._intencionReal).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r[colDescription] || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'PROCESADO' && r._status === 'PROCESADO') ||
      (statusFilter === 'REVISION' && r._requiereRevisionHumana === 'SÍ');

    const matchesRuleAlert = !ruleAlertFilter || (r._alertasReglas && r._alertasReglas.length > 0);

    return matchesSearch && matchesStatus && matchesRuleAlert;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Módulo 3: Lector Masivo de PQR</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Clasificación y Normalización Masiva de Expedientes
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Cargue archivos Excel/CSV, valide la jerarquía textual priorizando la descripción detallada, aplique reglas de exclusión bancarias (sin embargo vs embargos, cuotas de crédito vs manejo, cuentas vs CDT) y exporte el archivo conservando los datos originales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadSampleDataset}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Cargar Dataset Oficial de Prueba (12 Casos Críticos)</span>
            </button>
          </div>
        </div>

        {/* Zona de Subida y Configuración de Columnas */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-700/60">
          <div className="lg:col-span-5">
            <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-400 mb-1" />
              <span className="text-xs font-semibold text-slate-200">
                {fileName ? fileName : 'Haga clic para subir archivo Excel (.xlsx, .xls, .csv)'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {fileData.length > 0 ? `${fileData.length} filas detectadas` : 'Arrastre o seleccione el archivo con las reclamaciones'}
              </span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Validador de Columnas */}
          {columns.length > 0 && (
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-700 rounded-xl p-3.5 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Mapeo de Columnas para Clasificación:
                </span>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                  {columns.length} columnas detectadas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Descripción Detallada <span className="text-blue-400">*</span>
                  </label>
                  <select
                    value={colDescription}
                    onChange={(e) => setColDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Resumen del Cliente
                  </label>
                  <select
                    value={colSummary}
                    onChange={(e) => setColSummary(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Subcategoría Inicial
                  </label>
                  <select
                    value={colLegacyCat}
                    onChange={(e) => setColLegacyCat(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Identificador / Radicado
                  </label>
                  <select
                    value={colId}
                    onChange={(e) => setColId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={handleProcessBatch}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Procesando {fileData.length} Expedientes...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Ejecutar Clasificación Masiva con IA y Reglas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de Estadísticas de Procesamiento */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Expedientes</span>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalExpedientes}</div>
            <span className="text-[10px] text-slate-500">100% evaluados</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold">Procesados con Éxito</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.procesadosConExito}</div>
            <span className="text-[10px] text-emerald-500">Clasificación directa</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-amber-800/60 bg-amber-950/20">
            <span className="text-[11px] text-amber-400 uppercase font-semibold">Alertas de Reglas</span>
            <div className="text-2xl font-bold text-amber-300 mt-1">{stats.conAlertasReglas}</div>
            <span className="text-[10px] text-amber-500">Reglas críticas activadas</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-rose-800/60 bg-rose-950/20">
            <span className="text-[11px] text-rose-400 uppercase font-semibold">Revisión Humana</span>
            <div className="text-2xl font-bold text-rose-300 mt-1">{stats.requierenRevisionHumana}</div>
            <span className="text-[10px] text-rose-500">Casos ambiguos aislados</span>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-blue-800/60 bg-blue-950/20 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-blue-400 uppercase font-semibold">Tasa de Efectividad</span>
            <div className="text-2xl font-bold text-blue-300 mt-1">{stats.tasaEfectividad}%</div>
            <span className="text-[10px] text-blue-500">Sin salidas por defecto</span>
          </div>
        </div>
      )}

      {/* Tabla de Resultados y Filtros */}
      {processedRows.length > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg space-y-4 p-5">
          {/* Barra de Filtros y Descarga */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en expedientes..."
                  className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-48 sm:w-64 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PROCESADO">Solo Procesados</option>
                <option value="REVISION">Requieren Revisión</option>
              </select>

              <button
                onClick={() => setRuleAlertFilter(!ruleAlertFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                  ruleAlertFilter 
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500' 
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Solo con Alertas de Regla ({stats?.conAlertasReglas})</span>
              </button>
            </div>

            <button
              onClick={handleExportEnrichedExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel Enriquecido (Datos Originales + Auditoría)</span>
            </button>
          </div>

          {/* Tabla de Expedientes */}
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-3">ID / Radicado</th>
                  <th className="p-3">Subcategoría Inicial</th>
                  <th className="p-3">Descripción Detallada</th>
                  <th className="p-3">Categoría Normalizada</th>
                  <th className="p-3">Código APY</th>
                  <th className="p-3">Área Responsable</th>
                  <th className="p-3">Regla Crítica Aplicada</th>
                  <th className="p-3">Confianza</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 bg-slate-850">
                {filteredRows.map((row, idx) => {
                  const hasAlerts = row._alertasReglas && row._alertasReglas.length > 0;
                  return (
                    <tr 
                      key={idx}
                      className={`hover:bg-slate-750 transition ${
                        hasAlerts ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                        {String(row._id)}
                      </td>
                      <td className="p-3 text-slate-400 max-w-[130px] truncate" title={row[colLegacyCat]}>
                        <span className="line-through decoration-rose-500/80">
                          {row[colLegacyCat] || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 max-w-[280px]">
                        <p className="line-clamp-2 text-xs" title={row[colDescription]}>
                          {row[colDescription]}
                        </p>
                      </td>
                      <td className="p-3 font-semibold text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[11px]">
                          {row._categoriaNormalizada}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 text-amber-400 border border-slate-700">
                          {row._codigoApySugerido}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap text-[11px]">
                        {row._areaResponsable}
                      </td>
                      <td className="p-3 text-slate-300 max-w-[200px] text-[11px]">
                        <span className={hasAlerts ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                          {row._reglaAplicada}
                        </span>
                        {hasAlerts && (
                          <span className="block text-[10px] text-amber-400 mt-0.5 font-sans">
                            ⚠️ {row._alertasReglas[0].substring(0, 50)}...
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`font-mono text-xs font-bold ${
                          row._confianza >= 90 ? 'text-emerald-400' : row._confianza >= 70 ? 'text-blue-400' : 'text-rose-400'
                        }`}>
                          {row._confianza}%
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRow(row)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded text-[11px] flex items-center gap-1 mx-auto transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Ficha</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-400 flex justify-between items-center pt-2">
            <span>Mostrando {filteredRows.length} de {processedRows.length} expedientes</span>
            <span className="text-[11px] text-emerald-400 font-mono">
              ✓ 100% de expedientes clasificados sin omisión de filas
            </span>
          </div>
        </div>
      )}

      {/* Modal Ficha Detallada de Expediente */}
      {selectedRow && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-700 pb-3">
              <div>
                <span className="text-[11px] font-mono text-blue-400 font-bold">
                  EXPEDIENTE: {String(selectedRow._id)}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Ficha Técnica de Clasificación & Auditoría
                </h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Descripción Detallada (Fuente de Verdad):</span>
                <p className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-200 leading-relaxed">
                  {selectedRow[colDescription]}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Subcategoría Inicial Errónea:</span>
                  <span className="text-rose-400 line-through font-semibold text-xs mt-0.5 block">
                    {selectedRow[colLegacyCat] || 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Categoría Normalizada Bancaria:</span>
                  <span className="text-emerald-400 font-bold text-xs mt-0.5 block">
                    {selectedRow._categoriaNormalizada}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Intención Real Detectada:</span>
                  <span className="bg-blue-950 text-blue-300 font-mono text-xs px-2 py-0.5 rounded border border-blue-900 font-bold">
                    APY {selectedRow._codigoApySugerido}
                  </span>
                </div>
                <p className="text-slate-300">{selectedRow._intencionReal}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Área Responsable:</span>
                  <span className="text-white font-medium text-xs mt-0.5 block">
                    {selectedRow._areaResponsable}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">SLA de Respuesta:</span>
                  <span className="text-amber-300 font-medium text-xs mt-0.5 block">
                    {selectedRow._tiempoEstimadoSla || 'Normal institucional'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Fundamentación y Justificación Técnica:</span>
                <p className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedRow._justificacionTecnica}
                </p>
              </div>

              {selectedRow._alertasReglas && selectedRow._alertasReglas.length > 0 && (
                <div className="bg-amber-950/40 border border-amber-800/80 p-3 rounded-xl space-y-1">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Alertas Críticas del Motor de Negocio:
                  </span>
                  <ul className="list-disc list-inside text-amber-200 text-[11px] space-y-0.5">
                    {selectedRow._alertasReglas.map((alt: string, aIdx: number) => (
                      <li key={aIdx}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-medium transition"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
