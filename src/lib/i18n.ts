import { writable, derived } from 'svelte/store';
import en from './i18n/en.json';
import es from './i18n/es.json';
import fr from './i18n/fr.json';

// Define the available languages
export type Language = 'en' | 'es' | 'fr';

// Create a store for the current language
export const currentLang = writable<Language>('en');

// Define the structure of our translations
interface Translations {
  [key: string]: string;
}

// Our dictionary of translations
const translations: Record<Language, Translations> = {
  en,
  es,
  fr
};

// Create a derived store for the translation function
export const t = derived(currentLang, ($currentLang) => 
  (key: string, params: Record<string, string | number> = {}): string => {
    let translatedString = translations[$currentLang][key] || key;

    // Replace any parameters in the string
    Object.entries(params).forEach(([param, value]) => {
      translatedString = translatedString.replace(`{${param}}`, String(value));
    });

    return translatedString;
  }
);

// Function to change the current language
export function setLanguage(lang: Language): void {
  currentLang.set(lang);
}