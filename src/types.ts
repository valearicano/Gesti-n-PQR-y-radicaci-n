export interface UserRole {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN_CALIDAD' | 'PROMOTOR_N1' | 'PROMOTOR_N2' | 'ASESOR_COMERCIAL' | 'AUDITOR';
  cargo: string;
  permisos: string[];
}

export interface APYCode {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  causales: string[];
  areaResponsable: string;
  slaHoras: number;
  slaDiasHabiles: number;
  requisitos: string[];
  activo: boolean;
  version: number;
  estadoAprobacion: 'APROBADO' | 'PENDIENTE_APROBACION';
}

export interface PQRCategory {
  id: string;
  nombre: string;
  codigoIdentificador: string;
  descripcion: string;
  codigoApyDefault: string;
  areaDefault: string;
  palabrasClave: string[];
  reglasExclusion: string[];
  criterioSuperfinanciera: string;
  activa: boolean;
}

export interface BusinessRule {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaAfectada: string;
  patronDeteccion: string;
  accion: 'EXCLUIR' | 'REASIGNAR' | 'EXIGIR_REVISION' | 'FORZAR_CATEGORIA';
  categoriaDestino?: string;
  codigoApySugerido?: string;
  activa: boolean;
  version: number;
  justificacionNormativa: string;
}

export interface CommercialEvaluation {
  tipoTramite: 'TRAMITE_COMERCIAL' | 'GERENCIA_SOLUCIONES' | 'OTRA_AREA_INSTITUCIONAL';
  areaSugerida: string;
  debeRadicarsePQR: boolean;
  motivoPQR: string;
  criterioSuperfinanciera: string;
  checklistRequisitos: string[];
  rutaSugeridaPasoAPaso: string[];
  advertenciaLegal: string;
  resumenEjecutivo: string;
  codigoApyRecomendadoSiAplica?: string;
}

export interface BatchProcessingStats {
  totalExpedientes: number;
  procesadosConExito: number;
  conAlertasReglas: number;
  requierenRevisionHumana: number;
  tasaEfectividad: number;
}

export interface ProcessedPQRRow {
  _id: string | number;
  _status: 'PROCESADO' | 'REVISIÓN_REQUERIDA' | 'ERROR_PROCESAMIENTO';
  _categoriaNormalizada: string;
  _intencionReal: string;
  _codigoApySugerido: string;
  _areaResponsable: string;
  _reglaAplicada: string;
  _confianza: number;
  _requiereRevisionHumana: 'SÍ' | 'NO';
  _justificacionTecnica: string;
  _alertasReglas: string[];
  _tiempoEstimadoSla?: string;
  _procedimientoSugerido?: string;
  [key: string]: any;
}

export interface GoldenTestCase {
  id: string;
  titulo: string;
  descripcionDetallada: string;
  subcategoriaInicialErronea?: string;
  categoriaEsperada: string;
  codigoApyEsperado: string;
  reglaVerificada: string;
  justificacion: string;
  casoTipo: string;
}

export interface BenchmarkResultItem {
  testCase: GoldenTestCase;
  evaluation: any;
  categoryMatch: boolean;
  apyMatch: boolean;
  passed: boolean;
  detalleVerificacion: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  rol: string;
  accion: string;
  entidad: string;
  detalle: string;
  metadata?: any;
}

export interface RuleVersion {
  id: string;
  fecha: string;
  usuario: string;
  version: number;
  cambios: string;
}
