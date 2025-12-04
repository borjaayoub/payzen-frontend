import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { importProvidersFrom } from '@angular/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import Aura from '@primeuix/themes/aura';
  import { routes } from './app.routes';

// PayZen Custom Theme Preset
const PayZenPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#EBF5FF',
      100: '#D6EBFF',
      200: '#B3D9FF',
      300: '#80C3FF',
      400: '#4DA6FF',
      500: '#1A73E8',
      600: '#1557B0',
      700: '#104488',
      800: '#0B2F5F',
      900: '#061F3F',
      950: '#030F1F'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#1A73E8',
          contrastColor: '#ffffff',
          hoverColor: '#1557B0',
          activeColor: '#1557B0'
        },
        surface: {
          0: '#ffffff',
          50: '#F8FAFC',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        }
      }
    },
    formField: {
      borderRadius: '6px'
    },
    borderRadius: {
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: PayZenPreset,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'fr'
      })
    ),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    })
  ],
};
