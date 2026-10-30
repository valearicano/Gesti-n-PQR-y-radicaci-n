/**
 * Servidor Backend Full-Stack Express + Vite
 * Plataforma Inteligente de Gestión PQR y Radicaciones Bancarias
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { bankDb } from './server/db.js';
import { BankAIService } from './server/geminiService.js';
import { BankRulesEngine, PQRInputRecord } from './server/rulesEngine.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de sesión activa de usuario/rol
let activeUser = bankDb.users[0]; // Default: Admin de Calidad

// -----------------------------------------------------------------------------
// ENDPOINTS DE AUTENTICACIÓN Y ROLES (RBAC)
// -----------------------------------------------------------------------------

app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({
    user: activeUser,
    availableUsers: bankDb.users,
  });
});

app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  const { userId } = req.body;
  const found = bankDb.users.find(u => u.id === userId);
  if (!found) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  activeUser = found;
  bankDb.addAuditLog(
    activeUser.email,
    activeUser.rol,
    'CAMBIO_ROL_ACTIVO',
    'SesionUsuario',
    `Cambio de perfil activo a: ${found.cargo} (${found.rol})`
  );
  res.json({ success: true, user: activeUser });
});

// -----------------------------------------------------------------------------
// ENDPOINTS MÓDULO 1: ASISTENTE COMERCIAL
// -----------------------------------------------------------------------------

app.post('/api/commercial/evaluate', async (req: Request, res: Response) => {
  try {
    const { solicitudCliente, canal, perfilCliente, productoInvolucrado, montoReclamado, antecedenteReclamoPrevio } = req.body;

    if (!solicitudCliente || typeof solicitudCliente !== 'string' || solicitudCliente.trim().length < 5) {
      return res.status(400).json({ error: 'Debe ingresar la solicitud o consulta del cliente (mínimo 5 caracteres).' });
    }

    const evaluation = await BankAIService.evaluateCommercialCase({
      solicitudCliente,
      canal: canal || 'Oficina Comercial',
      perfilCliente: perfilCliente || 'Persona Natural',
      productoInvolucrado: productoInvolucrado || 'Tarjeta de Crédito / Cuenta de Ahorros',
      montoReclamado,
      antecedenteReclamoPrevio: !!antecedenteReclamoPrevio
    });

    bankDb.addAuditLog(
      activeUser.email,
      activeUser.rol,
      'EVALUACION_COMERCIAL_PQR',
      'AsistenteComercial',
      `Triaje completado: Tipo ${evaluation.tipoTramite}, Radicar PQR: ${evaluation.debeRadicarsePQR ? 'SÍ' : 'NO'}, Área: ${evaluation.areaSugerida}`,
      { evaluation }
    );

    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Error en /api/commercial/evaluate:', error);
    res.status(500).json({ error: 'Error procesando evaluación comercial', details: error.message });
  }
});

// -----------------------------------------------------------------------------
// ENDPOINTS MÓDULO 2: ASISTENTE PARA PROMOTORES
// -----------------------------------------------------------------------------

app.post('/api/promoter/chat', async (req: Request, res: Response) => {
  try {
    const { perfilPromotor, historial, mensajeActual } = req.body;

    if (!mensajeActual || typeof mensajeActual !== 'string' || mensajeActual.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    // Regla obligatoria: Preguntar / exigir el perfil del usuario al iniciar el chat
    if (!perfilPromotor || perfilPromotor === 'NO_DEFINIDO') {
      return res.status(400).json({
        error: 'DEBE_INDICAR_PERFIL',
        message: 'Para consultar el catálogo APY institucional debe seleccionar o confirmar su perfil de usuario (Promotor N1, Promotor N2, Asesor de Soluciones o Backoffice).'
      });
    }

    const result = await BankAIService.promoterChat({
      perfilPromotor,
      historial: historial || [],
      mensajeActual
    });

    bankDb.addAuditLog(
      activeUser.email,
      activeUser.rol,
      'CONSULTA_ASISTENTE_PROMOTOR',
      'AsistentePromotores',
      `Consulta realizada por perfil [${perfilPromotor}]. Códigos consultados: ${result.codigosApyMencionados.map((c: any) => c.codigo).join(', ') || 'General'}`
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error en /api/promoter/chat:', error);
    res.status(500).json({ error: 'Error procesando consulta de promotor', details: error.message });
  }
});

// -----------------------------------------------------------------------------
// ENDPOINTS MÓDULO 3: LECTOR MASIVO PQR
// -----------------------------------------------------------------------------

app.post('/api/pqr/process-batch', async (req: Request, res: Response) => {
  try {
    const { records } = req.body as { records: PQRInputRecord[] };

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'El archivo no contiene filas o expedientes válidos para procesar.' });
    }

    const processedRows: any[] = [];
    let exitosos = 0;
    let conAdvertencias = 0;
    let revisionHumanaCount = 0;

    for (let index = 0; index < records.length; index++) {
      const rec = records[index];
      const rawId = rec.id || rec.ID_Expediente || rec.Radicado || rec.Numero_Expediente || `EXP-${index + 1}`;

      try {
        const classification = await BankAIService.classifyPQRRecord(rec);

        if (classification.requiereRevisionHumana) {
          revisionHumanaCount++;
        }
        if (classification.alertasReglas.length > 0) {
          conAdvertencias++;
        } else {
          exitosos++;
        }

        // Construir fila enriquecida preservando 100% de los datos originales
        processedRows.push({
          ...rec,
          _id: rawId,
          _status: classification.requiereRevisionHumana ? 'REVISIÓN_REQUERIDA' : 'PROCESADO',
          _categoriaNormalizada: classification.categoriaNormalizada,
          _intencionReal: classification.intencionReal,
          _codigoApySugerido: classification.codigoApySugerido,
          _areaResponsable: classification.areaResponsable,
          _reglaAplicada: classification.reglaAplicada,
          _confianza: classification.confianza,
          _requiereRevisionHumana: classification.requiereRevisionHumana ? 'SÍ' : 'NO',
          _justificacionTecnica: classification.justificacionTecnica,
          _alertasReglas: classification.alertasReglas,
          _tiempoEstimadoSla: classification.tiempoEstimadoSla,
          _procedimientoSugerido: classification.procedimientoSugerido,
          _causalesAprobadas: classification.causalesAprobadas
        });
      } catch (rowErr: any) {
        // Regla crítica: No omitir filas silenciosamente. Registrar error exacto.
        processedRows.push({
          ...rec,
          _id: rawId,
          _status: 'ERROR_PROCESAMIENTO',
          _categoriaNormalizada: 'ERROR_SISTEMA',
          _intencionReal: 'Fallo al clasificar fila',
          _codigoApySugerido: 'NO_DISPONIBLE',
          _areaResponsable: 'Soporte Técnico PQR',
          _reglaAplicada: 'Excepción de Fila',
          _confianza: 0,
          _requiereRevisionHumana: 'SÍ',
          _justificacionTecnica: `Error en tiempo de ejecución: ${rowErr.message}`,
          _alertasReglas: ['ERROR_FILA_EXCEPCION']
        });
        conAdvertencias++;
      }
    }

    bankDb.addAuditLog(
      activeUser.email,
      activeUser.rol,
      'PROCESAMIENTO_MASIVO_EXCEL',
      'LectorMasivoPQR',
      `Lote procesado: ${records.length} expedientes. Exitosos: ${exitosos}, Con Alertas de Regla: ${conAdvertencias}, Requieren Revisión: ${revisionHumanaCount}`,
      { total: records.length, exitosos, conAdvertencias, revisionHumanaCount }
    );

    res.json({
      success: true,
      stats: {
        totalExpedientes: records.length,
        procesadosConExito: exitosos,
        conAlertasReglas: conAdvertencias,
        requierenRevisionHumana: revisionHumanaCount,
        tasaEfectividad: Math.round(((records.length - revisionHumanaCount) / records.length) * 100)
      },
      rows: processedRows
    });
  } catch (error: any) {
    console.error('Error en /api/pqr/process-batch:', error);
    res.status(500).json({ error: 'Error procesando lote de expedientes PQR', details: error.message });
  }
});

// -----------------------------------------------------------------------------
// ENDPOINTS MÓDULO 4: ADMINISTRACIÓN, CATÁLOGOS, REGLAS Y AUDITORÍA
// -----------------------------------------------------------------------------

app.get('/api/catalog/apy-codes', (req: Request, res: Response) => {
  res.json({ apyCodes: bankDb.apyCodes });
});

app.post('/api/catalog/apy-codes', (req: Request, res: Response) => {
  if (activeUser.rol !== 'ADMIN_CALIDAD') {
    return res.status(403).json({ error: 'Permiso denegado. Solo Administrador de Calidad puede crear códigos APY.' });
  }
  const { codigo, nombre, descripcion, causales, areaResponsable, slaHoras, slaDiasHabiles, requisitos, estadoAprobacion } = req.body;
  
  if (!codigo || !nombre || !areaResponsable) {
    return res.status(400).json({ error: 'Código, nombre y área responsable son obligatorios.' });
  }

  const existing = bankDb.apyCodes.find(c => c.codigo === codigo);
  if (existing) {
    return res.status(400).json({ error: `El código APY ${codigo} ya existe en el catálogo.` });
  }

  const newCode = {
    id: `apy-${codigo}-${Date.now()}`,
    codigo,
    nombre,
    descripcion: descripcion || '',
    causales: causales || ['Causal general aprobada'],
    areaResponsable,
    slaHoras: slaHoras || 48,
    slaDiasHabiles: slaDiasHabiles || 3,
    requisitos: requisitos || ['Documento de identidad y validación'],
    activo: true,
    version: 1,
    estadoAprobacion: estadoAprobacion || 'APROBADO'
  };

  bankDb.apyCodes.push(newCode);

  bankDb.addAuditLog(
    activeUser.email,
    activeUser.rol,
    'CREAR_CODIGO_APY',
    'CatalogoAPY',
    `Nuevo código APY registrado: [${codigo}] ${nombre} (${areaResponsable})`
  );

  res.json({ success: true, code: newCode });
});

app.put('/api/catalog/apy-codes/:id', (req: Request, res: Response) => {
  if (activeUser.rol !== 'ADMIN_CALIDAD') {
    return res.status(403).json({ error: 'Permiso denegado. Solo Administrador de Calidad puede modificar códigos APY.' });
  }
  const { id } = req.params;
  const idx = bankDb.apyCodes.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Código APY no encontrado.' });
  }

  const updated = {
    ...bankDb.apyCodes[idx],
    ...req.body,
    version: bankDb.apyCodes[idx].version + 1
  };
  bankDb.apyCodes[idx] = updated;

  bankDb.addAuditLog(
    activeUser.email,
    activeUser.rol,
    'ACTUALIZAR_CODIGO_APY',
    'CatalogoAPY',
    `Código APY actualizado: [${updated.codigo}] versión ${updated.version}`
  );

  res.json({ success: true, code: updated });
});

app.get('/api/catalog/categories', (req: Request, res: Response) => {
  res.json({ categories: bankDb.categories });
});

app.get('/api/catalog/rules', (req: Request, res: Response) => {
  res.json({ rules: bankDb.rules, versions: bankDb.ruleVersions });
});

app.put('/api/catalog/rules/:id/toggle', (req: Request, res: Response) => {
  if (activeUser.rol !== 'ADMIN_CALIDAD') {
    return res.status(403).json({ error: 'Permiso denegado. Solo Administrador de Calidad puede activar/desactivar reglas.' });
  }
  const { id } = req.params;
  const rule = bankDb.rules.find(r => r.id === id);
  if (!rule) {
    return res.status(404).json({ error: 'Regla no encontrada' });
  }
  rule.activa = !rule.activa;
  rule.version += 1;

  bankDb.addAuditLog(
    activeUser.email,
    activeUser.rol,
    'MODIFICAR_ESTADO_REGLA',
    'MotorReglas',
    `Regla "${rule.nombre}" cambiada a estado: ${rule.activa ? 'ACTIVA' : 'INACTIVA'} (v${rule.version})`
  );

  res.json({ success: true, rule });
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ logs: bankDb.auditLogs });
});

app.get('/api/benchmarks', (req: Request, res: Response) => {
  res.json({ goldenCases: bankDb.goldenTestCases });
});

/**
 * Ejecutor del Banco de Pruebas de Oro (Golden Benchmark)
 * Valida automáticamente las 8 reglas críticas con casos positivos, negativos y ambiguos.
 */
app.post('/api/benchmarks/run', (req: Request, res: Response) => {
  const results = bankDb.goldenTestCases.map(testCase => {
    const input: PQRInputRecord = {
      id: testCase.id,
      resumenCliente: testCase.subcategoriaInicialErronea,
      subcategoriaInicial: testCase.subcategoriaInicialErronea,
      descripcionDetallada: testCase.descripcionDetallada
    };

    const evaluation = BankRulesEngine.evaluateRecord(input);
    const categoryMatch = evaluation.categoriaNormalizada.toLowerCase().includes(testCase.categoriaEsperada.toLowerCase().substring(0, 5)) ||
      testCase.categoriaEsperada.toLowerCase().includes(evaluation.categoriaNormalizada.toLowerCase().substring(0, 5));
    const apyMatch = evaluation.codigoApySugerido === testCase.codigoApyEsperado;
    const passed = categoryMatch && apyMatch;

    return {
      testCase,
      evaluation,
      categoryMatch,
      apyMatch,
      passed,
      detalleVerificacion: passed 
        ? `ÉXITO: Se aplicó correctamente "${evaluation.reglaAplicada}" asignando APY ${evaluation.codigoApySugerido}.`
        : `DISCREPANCIA: Se esperaba categoría "${testCase.categoriaEsperada}" con APY ${testCase.codigoApyEsperado}, pero se obtuvo "${evaluation.categoriaNormalizada}" con APY ${evaluation.codigoApySugerido}.`
    };
  });

  const totalPassed = results.filter(r => r.passed).length;

  bankDb.addAuditLog(
    activeUser.email,
    activeUser.rol,
    'EJECUCION_BENCHMARK_CASOS_ORO',
    'MesaCalidadPQR',
    `Ejecución de Golden Benchmark: ${totalPassed}/${results.length} casos aprobados (${Math.round((totalPassed/results.length)*100)}% de efectividad de reglas críticas)`
  );

  res.json({
    success: true,
    total: results.length,
    aprobados: totalPassed,
    tasaExito: Math.round((totalPassed / results.length) * 100),
    results
  });
});

// -----------------------------------------------------------------------------
// VITE SPA MIDDLEWARE / SERVIDO ESTÁTICO
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bancolima PQR Fullstack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
