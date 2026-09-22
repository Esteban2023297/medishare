import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="w-full bg-[#060911] border-t border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        <!-- Identidad y descripción -->
        <div class="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <div class="flex items-center gap-2">
            <span class="text-base font-extrabold text-white tracking-tight">Medi<span class="text-sky-400">Share</span></span>
            <span class="text-[11px] text-slate-500 font-mono">v1.0.0-PROD</span>
          </div>
          <p class="text-xs text-slate-400 max-w-md">
            Plataforma digital para la redistribución comunitaria de medicamentos conformes a normativas sanitarias, control riguroso de lotes y prevención del desperdicio.
          </p>
        </div>

        <!-- Sello de Impacto ODS 3 -->
        <div class="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            3
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">ODS 3: Salud y Bienestar</span>
            <span class="text-[11px] text-emerald-300/80">Comprometidos con el acceso equitativo a fármacos</span>
          </div>
        </div>

        <!-- Derechos y regulación -->
        <div class="text-center md:text-right text-xs text-slate-500">
          <p>© 2026 MediShare. Todos los derechos reservados.</p>
          <p class="text-[11px] text-slate-600 mt-0.5">Control de caducidad certificado (mín. 90 días de vigencia).</p>
        </div>

      </div>
    </footer>
  `,
})
export class FooterComponent {}
