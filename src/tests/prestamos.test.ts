// src/tests/prestamos.test.ts

import { calcularInteresesPrestamoIndefinido } from '../types/prestamos';
// Mock de convertirFecha para que las pruebas sean predecibles
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  convertirFecha: (fecha: any) => {
    if (fecha instanceof Date) return fecha;
    return new Date(fecha);
  }
}));

describe('calcularInteresesPrestamoIndefinido', () => {

  it('debe calcular los intereses correctamente a través de un cambio de año', () => {
    const saldoCapital = 1000;
    const tasaInteresQuincenal = 2; // 2%
    const interesesPendientes = 0;

    // Caso de prueba: del 30 de diciembre al 2 de enero.
    // Debería detectarse que se cruzó una quincena (la de fin de mes de diciembre).
    const fechaDesde = new Date('2023-12-30T10:00:00Z');
    const fechaHasta = new Date('2024-01-02T10:00:00Z');

    const resultado = calcularInteresesPrestamoIndefinido(
      saldoCapital,
      tasaInteresQuincenal,
      fechaDesde,
      fechaHasta,
      interesesPendientes
    );

    // La expectativa CORRECTA es que se haya calculado 1 período quincenal.
    const interesesEsperados = saldoCapital * (tasaInteresQuincenal / 100) * 1; // 1000 * 0.02 * 1 = 20

    expect(resultado.periodosCalculados).toBe(1);
    expect(resultado.interesesAtrasados).toBeCloseTo(20);
  });

  it('debe calcular múltiples quincenas correctamente', () => {
    const saldoCapital = 5000;
    const tasaInteresQuincenal = 1.5; // 1.5%
    const fechaDesde = new Date('2024-01-10T10:00:00Z');
    const fechaHasta = new Date('2024-02-20T10:00:00Z');

    // Quincenas esperadas:
    // 1. 15 de Enero
    // 2. Fin de mes de Enero
    // 3. 15 de Febrero
    const periodosEsperados = 3;
    const interesesEsperados = saldoCapital * (tasaInteresQuincenal / 100) * periodosEsperados; // 5000 * 0.015 * 3 = 22.5 -> Incorrecto, es 225

    const resultado = calcularInteresesPrestamoIndefinido(
      saldoCapital,
      tasaInteresQuincenal,
      fechaDesde,
      fechaHasta,
      0
    );

    const interesesEsperadosCorrectos = 5000 * 0.015 * 3;

    expect(resultado.periodosCalculados).toBe(periodosEsperados);
    expect(resultado.interesesAtrasados).toBeCloseTo(interesesEsperadosCorrectos);
  });

});
