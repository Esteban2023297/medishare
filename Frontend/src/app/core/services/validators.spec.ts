import '@angular/compiler';
import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { batchNumberValidator, sanitaryExpirationValidator } from './validators';

describe('Validador Sanitario MediShare: sanitaryExpirationValidator', () => {
  const validator = sanitaryExpirationValidator(90);

  it('debe rechazar fechas en el pasado (medicamento ya caducado)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const control = new FormControl(dateStr);
    const result = validator(control);

    expect(result).not.toBeNull();
    expect(result?.['alreadyExpired']).toBe(true);
  });

  it('debe bloquear medicamentos con vigencia inferior al umbral sanitario de 90 días (3 meses)', () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const dateStr = in30Days.toISOString().split('T')[0];

    const control = new FormControl(dateStr);
    const result = validator(control);

    expect(result).not.toBeNull();
    expect(result?.['sanitaryThresholdViolation']).toBe(true);
    expect(result?.['requiredDays']).toBe(90);
  });

  it('debe aprobar medicamentos que superen holgadamente el umbral de 90 días (ej. 180 días)', () => {
    const in180Days = new Date();
    in180Days.setDate(in180Days.getDate() + 180);
    const dateStr = in180Days.toISOString().split('T')[0];

    const control = new FormControl(dateStr);
    const result = validator(control);

    expect(result).toBeNull();
  });
});

describe('Validador de Lote Sanitario: batchNumberValidator', () => {
  const validator = batchNumberValidator();

  it('debe aprobar lotes con formato alfanumérico válido', () => {
    expect(validator(new FormControl('AB-2024-001'))).toBeNull();
    expect(validator(new FormControl('LOTE99'))).toBeNull();
  });

  it('debe rechazar lotes con caracteres no permitidos o muy cortos', () => {
    expect(validator(new FormControl('A'))).not.toBeNull();
    expect(validator(new FormControl('LOTE @$#'))).not.toBeNull();
  });
});
