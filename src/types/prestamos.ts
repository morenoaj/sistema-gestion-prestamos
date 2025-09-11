// src/types/prestamos.ts

import { convertirFecha } from '@/lib/utils';

// Define la interfaz para un préstamo para que el código sea más seguro y claro
interface Prestamo {
  esPlazoIndefinido?: boolean;
  [key: string]: any;
}

/**
 * Verifica si un préstamo es de tipo "plazo indefinido".
 * @param prestamo - El objeto de préstamo.
 * @returns `true` si el préstamo es de plazo indefinido, de lo contrario `false`.
 */
export const esPrestamoIndefinido = (prestamo: Prestamo): boolean => {
  return prestamo.esPlazoIndefinido === true;
};

/**
 * Calcula la próxima fecha de pago quincenal (15 o fin de mes).
 * @param desdeFecha - La fecha a partir de la cual calcular.
 * @returns La próxima fecha de pago.
 */
export const calcularProximaFechaQuincenal = (desdeFecha: Date): Date => {
  const fecha = new Date(desdeFecha);
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();

  if (fecha.getDate() < 15) {
    // Next payment is the 15th of this month.
    return new Date(anio, mes, 15);
  } else {
    // Candidate for next payment is end of current month.
    const finDeMes = new Date(anio, mes + 1, 0);
    if (fecha.getDate() >= finDeMes.getDate()) {
      // If we are on or after the last day of the month, next payment is 15th of next month.
      return new Date(anio, mes + 1, 15);
    } else {
      // Otherwise, it's the end of this month.
      return finDeMes;
    }
  }
};

/**
 * Formatea un número como una cadena de moneda.
 * @param amount - La cantidad a formatear.
 * @param currency - El código de la moneda.
 * @returns La cantidad formateada.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Convierte una fecha a un número de "quincenas" desde el año 0.
 * Asume 2 quincenas por mes: una el 15 y otra a fin de mes.
 */
function getQuincenas(fecha: Date): number {
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth(); // 0-11

    // 2 quincenas por cada mes completo
    let quincenas = anio * 24 + mes * 2;

    // Añadir quincena si ya pasó el día 15
    if (fecha.getDate() >= 15) {
        quincenas++;
    }

    return quincenas;
}


/**
 * FIXED IMPLEMENTATION
 * Calcula los intereses para un préstamo de plazo indefinido.
 */
export const calcularInteresesPrestamoIndefinido = (
  saldoCapital: number,
  tasaInteresQuincenalPorcentaje: number,
  fechaUltimoCalculo: any,
  fechaHasta: any,
  interesesPendientesAcumulados: number = 0
) => {
  const tasaQuincenal = tasaInteresQuincenalPorcentaje / 100;
  const fechaDesde = convertirFecha(fechaUltimoCalculo);
  const fechaA = convertirFecha(fechaHasta);

  // --- FIX: Cálculo correcto de quincenas ---
  const quincenasDesde = getQuincenas(fechaDesde);
  const quincenasHasta = getQuincenas(fechaA);
  const periodosQuincenales = quincenasHasta - quincenasDesde;
  // --- FIN DEL FIX ---

  const interesesGenerados = saldoCapital * tasaQuincenal * periodosQuincenales;

  const totalInteresesPendientes = interesesPendientesAcumulados + interesesGenerados;
  const proximaFechaPago = calcularProximaFechaQuincenal(fechaA);

  return {
    interesesAtrasados: interesesGenerados,
    totalInteresesPendientes: totalInteresesPendientes,
    totalAPagar: totalInteresesPendientes,
    proximaFechaPago: proximaFechaPago,
    periodosCalculados: periodosQuincenales,
  };
};
