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
  templateUrl: './donation-form.component.html',
  styleUrl: './donation-form.component.scss',
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
