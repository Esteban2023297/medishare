import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador sanitario estricto para MediShare:
 * Por normativa sanitaria, solo se aceptan medicamentos sellados y con un margen
 * mínimo de vigencia respecto a la fecha actual (por defecto 90 días / 3 meses).
 */
export function sanitaryExpirationValidator(minDays: number = 90): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // El validador Validators.required se encarga del valor vacío
    }

    const inputDate = new Date(control.value);
    if (isNaN(inputDate.getTime())) {
      return { invalidDateFormat: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = inputDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        alreadyExpired: true,
        message: 'El medicamento ya ha caducado. Por normativa sanitaria no puede ser aceptado.',
        daysRemaining: diffDays,
      };
    }

    if (diffDays < minDays) {
      return {
        sanitaryThresholdViolation: true,
        message: `El medicamento tiene solo ${diffDays} días de vigencia. Por seguridad sanitaria, se exige un mínimo de ${minDays} días (3 meses) para su distribución segura.`,
        daysRemaining: diffDays,
        requiredDays: minDays,
      };
    }

    return null; // Cumple la norma sanitaria
  };
}

/**
 * Validador para números de lote farmacéutico:
 * Debe contener al menos caracteres alfanuméricos válidos.
 */
export function batchNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const valid = /^[A-Za-z0-9\-_]{3,20}$/.test(control.value.trim());
    return valid
      ? null
      : { invalidBatchNumber: 'El número de lote debe contener entre 3 y 20 caracteres alfanuméricos (letras, números o guiones).' };
  };
}
