import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  MedicineCategory,
  MedicinePresentation,
} from '../../core/models/medication.model';
import { MedicationService } from '../../core/services/medication.service';
import {
  batchNumberValidator,
  sanitaryExpirationValidator,
} from '../../core/services/validators';

@Component({
  selector: 'app-donation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#080c14] py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        
        <!-- Botón Volver y Cabecera -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-sky-400 uppercase tracking-wider">Formulario Donante</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Registrar Donación</h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">Completa los datos del medicamento a donar con total rigurosidad sanitaria.</p>
          </div>
          <a
            routerLink="/"
            class="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Volver
          </a>
        </div>

        <!-- BANNER DE SEGURIDAD SANITARIA (Ámbar / Naranja) -->
        <div class="banner-amber-warning mb-8 flex items-start gap-3.5 shadow-md">
          <div class="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-amber-300">Requisitos estrictos de seguridad sanitaria</h3>
            <p class="text-xs text-amber-200/90 mt-1 leading-relaxed">
              Por seguridad, solo aceptamos medicamentos en su <strong>empaque original sellado</strong>, en óptimas condiciones de conservación y con al menos <strong>3 meses (90 días) de vigencia</strong> respecto a la fecha actual.
            </p>
          </div>
        </div>

        <!-- TARJETA DEL FORMULARIO -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          
          <form [formGroup]="donationForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Fila 1: Nombre comercial y Principio activo -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <!-- Nombre Comercial -->
              <div>
                <label for="commercialName" class="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Comercial <span class="text-sky-400">*</span>
                </label>
                <input
                  id="commercialName"
                  type="text"
                  formControlName="commercialName"
                  placeholder="Ej. Paracetamol Genfar 500mg"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
                @if (commercialName?.invalid && (commercialName?.dirty || commercialName?.touched)) {
                  <p class="text-xs text-rose-400 mt-1">El nombre comercial es obligatorio (mínimo 3 caracteres).</p>
                }
              </div>

              <!-- Principio Activo con autocompletado visual -->
              <div class="relative">
                <label for="activeIngredient" class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Principio Activo <span class="text-sky-400">*</span></span>
                  <span class="text-[10px] text-sky-400">Autocompletado activo</span>
                </label>
                <input
                  id="activeIngredient"
                  type="text"
                  formControlName="activeIngredient"
                  (input)="onIngredientInput($event)"
                  (focus)="showSuggestions.set(true)"
                  placeholder="Ej. Paracetamol"
                  autocomplete="off"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />

                <!-- Lista desplegable de sugerencias -->
                @if (showSuggestions() && filteredSuggestions().length > 0) {
                  <ul class="absolute z-20 w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl max-h-48 overflow-y-auto shadow-2xl py-1 divide-y divide-slate-700/50">
                    @for (suggestion of filteredSuggestions(); track suggestion) {
                      <li>
                        <button
                          type="button"
                          (click)="selectSuggestion(suggestion)"
                          class="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-sky-600/30 hover:text-sky-300 transition-colors flex items-center justify-between"
                        >
                          <span>{{ suggestion }}</span>
                          <span class="text-[10px] text-slate-400 font-mono">Vademécum</span>
                        </button>
                      </li>
                    }
                  </ul>
                }

                @if (activeIngredient?.invalid && (activeIngredient?.dirty || activeIngredient?.touched)) {
                  <p class="text-xs text-rose-400 mt-1">El principio activo es requerido.</p>
                }
              </div>

            </div>

            <!-- Fila 2: Presentación y Categoría Médica -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <!-- Presentación Farmacéutica -->
              <div>
                <label for="presentation" class="block text-xs font-semibold text-slate-300 mb-1.5">
                  Presentación <span class="text-sky-400">*</span>
                </label>
                <select
                  id="presentation"
                  formControlName="presentation"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                >
                  <option value="" disabled selected>Selecciona una presentación</option>
                  @for (pres of presentations; track pres) {
                    <option [value]="pres">{{ pres }}</option>
                  }
                </select>
                @if (presentation?.invalid && (presentation?.dirty || presentation?.touched)) {
                  <p class="text-xs text-rose-400 mt-1">Selecciona una presentación farmacéutica.</p>
                }
              </div>

              <!-- Categoría Terapéutica -->
              <div>
                <label for="category" class="block text-xs font-semibold text-slate-300 mb-1.5">
                  Categoría Terapéutica <span class="text-sky-400">*</span>
                </label>
                <select
                  id="category"
                  formControlName="category"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                >
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>

            </div>

            <!-- Fila 3: Número de Lote y Fecha de Caducidad con Validador Sanitario -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <!-- Número de Lote -->
              <div>
                <label for="batchNumber" class="block text-xs font-semibold text-slate-300 mb-1.5">
                  Número de Lote <span class="text-sky-400">*</span>
                </label>
                <input
                  id="batchNumber"
                  type="text"
                  formControlName="batchNumber"
                  placeholder="Ej. AB-2024-001"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
                @if (batchNumber?.errors?.['invalidBatchNumber'] && (batchNumber?.dirty || batchNumber?.touched)) {
                  <p class="text-xs text-rose-400 mt-1">{{ batchNumber?.errors?.['invalidBatchNumber'] }}</p>
                }
                @if (batchNumber?.errors?.['required'] && (batchNumber?.dirty || batchNumber?.touched)) {
                  <p class="text-xs text-rose-400 mt-1">El número de lote es obligatorio para trazabilidad.</p>
                }
              </div>

              <!-- Selector de Fecha de Caducidad -->
              <div>
                <label for="expirationDate" class="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fecha de Caducidad <span class="text-sky-400">*</span>
                </label>
                <input
                  id="expirationDate"
                  type="date"
                  formControlName="expirationDate"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />

                <!-- Alerta visual si infringe el margen de 90 días -->
                @if (expirationDate?.errors?.['sanitaryThresholdViolation']) {
                  <div class="mt-2 p-2.5 rounded-lg bg-amber-950/50 border border-amber-800/80 text-amber-300 text-xs flex items-start gap-2">
                    <svg class="w-4 h-4 shrink-0 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{{ expirationDate?.errors?.['message'] }}</span>
                  </div>
                }

                <!-- Alerta visual si ya está caducado -->
                @if (expirationDate?.errors?.['alreadyExpired']) {
                  <div class="mt-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                    <svg class="w-4 h-4 shrink-0 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{{ expirationDate?.errors?.['message'] }}</span>
                  </div>
                }
              </div>

            </div>

            <!-- Fila 4: Cantidad de Unidades y Donante -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <!-- Cantidad de Unidades -->
              <div>
                <label for="units" class="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cantidad de Unidades <span class="text-sky-400">*</span>
                </label>
                <input
                  id="units"
                  type="number"
                  min="1"
                  max="1000"
                  formControlName="units"
                  placeholder="Ej. 30"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
                @if (units?.invalid && (units?.dirty || units?.touched)) {
                  <p class="text-xs text-rose-400 mt-1">Ingresa una cantidad válida (mínimo 1 unidad).</p>
                }
              </div>

              <!-- Nombre del Donante -->
              <div>
                <label for="donorName" class="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre del Donante o Titular <span class="text-sky-400">*</span>
                </label>
                <input
                  id="donorName"
                  type="text"
                  formControlName="donorName"
                  class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
              </div>

            </div>

            <!-- Observaciones adicionales -->
            <div>
              <label for="donorNotes" class="block text-xs font-semibold text-slate-300 mb-1.5">
                Observaciones Adicionales
              </label>
              <textarea
                id="donorNotes"
                rows="2"
                formControlName="donorNotes"
                placeholder="Condiciones de almacenamiento, temperatura, estado del empaque original..."
                class="w-full bg-[#0c121e] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              ></textarea>
            </div>

            <!-- Checkbox de Certificación Sanitaria Obligatorio -->
            <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <input
                id="acceptTerms"
                type="checkbox"
                formControlName="acceptTerms"
                class="mt-1 w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-400"
              />
              <label for="acceptTerms" class="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                Confirmo bajo declaración de buena fe que los medicamentos se encuentran en su <strong>empaque original sellado</strong>, no han sido alterados ni expuestos a temperaturas extremas y cumplen con los protocolos de MediShare.
              </label>
            </div>

            <!-- Botón de Envío -->
            <div class="pt-2">
              <button
                type="submit"
                [disabled]="donationForm.invalid || isSubmitting()"
                class="w-full btn-clinical py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:cursor-not-allowed"
              >
                @if (isSubmitting()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Validando y Registrando...
                } @else {
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Registrar Donación
                }
              </button>
              
              @if (donationForm.invalid) {
                <p class="text-[11px] text-slate-500 text-center mt-2">
                  El botón se habilitará automáticamente al completar los campos obligatorios y superar el filtro de caducidad sanitaria.
                </p>
              }
            </div>

          </form>

        </div>

        <!-- MODAL / MENSAJE DE ÉXITO TRAS REGISTRAR -->
        @if (registeredDonationId()) {
          <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
              <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Donación Aceptada Sanitariamente</span>
              <h2 class="text-2xl font-black text-white mt-1">¡Registro Exitoso!</h2>
              <p class="text-xs text-slate-300 mt-2 leading-relaxed">
                Tu donación ha superado el filtro de 90 días de vigencia y ha sido registrada con el código de trazabilidad:
              </p>

              <div class="my-4 py-3 px-4 rounded-xl bg-slate-950 border border-sky-500/40 text-sky-400 font-mono font-bold text-lg tracking-wider">
                {{ registeredDonationId() }}
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-3 mt-6">
                <a
                  routerLink="/panel"
                  class="w-full btn-clinical text-xs py-2.5 rounded-xl font-bold"
                >
                  Ver en Mi Panel
                </a>
                <button
                  type="button"
                  (click)="resetModal()"
                  class="w-full btn-secondary-outline text-xs py-2.5 rounded-xl font-medium"
                >
                  Registrar Otra
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class DonationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly medicationService = inject(MedicationService);

  public readonly presentations: MedicinePresentation[] = [
    'Tabletas',
    'Cápsulas',
    'Jarabe',
    'Gotas',
    'Inyectable',
    'Inhalador',
    'Pomada / Gel',
  ];

  public readonly categories: MedicineCategory[] = [
    'Antibióticos',
    'Diabetes',
    'Cardio',
    'Analgésicos',
    'Respiratorio',
    'Gastrointestinal',
    'Otros',
  ];

  public showSuggestions = signal<boolean>(false);
  public filteredSuggestions = signal<string[]>([]);
  public isSubmitting = signal<boolean>(false);
  public registeredDonationId = signal<string | null>(null);

  public donationForm: FormGroup = this.fb.group({
    commercialName: ['', [Validators.required, Validators.minLength(3)]],
    activeIngredient: ['', [Validators.required]],
    presentation: ['', [Validators.required]],
    category: ['Analgésicos' as MedicineCategory, [Validators.required]],
    batchNumber: ['', [Validators.required, batchNumberValidator()]],
    expirationDate: ['', [Validators.required, sanitaryExpirationValidator(90)]],
    units: [30, [Validators.required, Validators.min(1)]],
    donorName: ['María Rodríguez', [Validators.required]],
    donorNotes: [''],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  // Getters para acceso limpio en la vista
  get commercialName() { return this.donationForm.get('commercialName'); }
  get activeIngredient() { return this.donationForm.get('activeIngredient'); }
  get presentation() { return this.donationForm.get('presentation'); }
  get batchNumber() { return this.donationForm.get('batchNumber'); }
  get expirationDate() { return this.donationForm.get('expirationDate'); }
  get units() { return this.donationForm.get('units'); }
  get acceptTerms() { return this.donationForm.get('acceptTerms'); }

  public onIngredientInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (!input) {
      this.filteredSuggestions.set([]);
      this.showSuggestions.set(false);
      return;
    }

    const matches = this.medicationService.commonActiveIngredients.filter((item) =>
      item.toLowerCase().includes(input)
    );

    this.filteredSuggestions.set(matches);
    this.showSuggestions.set(matches.length > 0);
  }

  public selectSuggestion(item: string): void {
    this.donationForm.patchValue({ activeIngredient: item });
    this.showSuggestions.set(false);
  }

  public onSubmit(): void {
    if (this.donationForm.invalid) {
      this.donationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    setTimeout(() => {
      const val = this.donationForm.value;
      const created = this.medicationService.registerDonation({
        commercialName: val.commercialName,
        activeIngredient: val.activeIngredient,
        category: val.category,
        presentation: val.presentation,
        batchNumber: val.batchNumber.toUpperCase().trim(),
        units: Number(val.units),
        expirationDate: val.expirationDate,
        donorName: val.donorName,
        donorNotes: val.donorNotes,
      });

      this.isSubmitting.set(false);
      this.registeredDonationId.set(created.id);
    }, 600);
  }

  public resetModal(): void {
    this.registeredDonationId.set(null);
    this.donationForm.reset({
      category: 'Analgésicos',
      units: 30,
      donorName: 'María Rodríguez',
      acceptTerms: false,
    });
  }
}
