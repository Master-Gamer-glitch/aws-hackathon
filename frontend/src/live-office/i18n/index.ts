// Minimal i18next bootstrap for the live office.
//
// The office scene (OfficeFloor) pulls its speech-bubble copy through
// react-i18next. Only the `office.*` strings are bundled — the rest of the
// CrewDesk site is not translated. Add locale files here to localise the floor.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnObjects: false,
  });
}

export default i18n;
