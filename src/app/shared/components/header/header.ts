import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../utils/language.service';
import { Language } from '../../utils/translation.config';

interface LanguageOption {
  label: string;
  value: Language;
  flag: string;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule, Select, FormsModule, TranslateModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private languageService = inject(LanguageService);

  selectedLanguage: Language = this.languageService.getCurrentLanguage();

  languages: LanguageOption[] = [
    { label: 'English', value: 'en', flag: '🇬🇧' },
    { label: 'العربية', value: 'ar', flag: '🇲🇦' },
    { label: 'Français', value: 'fr', flag: '🇫🇷' }
  ];

  onLanguageChange(event: any): void {
    const newLang = event.value as Language;
    this.languageService.setLanguage(newLang);
    this.selectedLanguage = newLang;
  }
}
