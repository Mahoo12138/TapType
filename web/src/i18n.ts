import i18n, { type BackendModule, type FallbackLng, type FallbackLngObjList } from "i18next";
import { initReactI18next } from "react-i18next";
import { findNearestMatchedLanguage } from "./utils/i18n";

export const locales = ["en", "zh-Hans"]

const fallbacks = {
  "zh-HK": ["zh-Hant", "en"],
  "zh-TW": ["zh-Hant", "en"],
  zh: ["zh-Hans", "en"],
} as FallbackLngObjList;

const LazyImportPlugin: BackendModule = {
  type: "backend",
  init: function () { },
  read: function (language, namespace, callback) {
    const matchedLanguage = findNearestMatchedLanguage(language);
    const modules = import.meta.glob('@shared/common/locales/**/*.json');
    const path = Object.keys(modules).find(path => path.endsWith(`/${matchedLanguage}/${namespace}.json`));
    
    if (path && modules[path]) {
      modules[path]()
        .then((module: any) => {
          // JSON modules usually export default
          callback(null, module.default || module);
        })
        .catch((err) => {
          console.log(`Fallback to English for language: ${language}. Error: ${err}`);
          callback(err, null);
        });
    } else {
        // console.log(`Language file not found for: ${matchedLanguage}`);
        callback(null, null);
    }
  },
};

i18n
  .use(LazyImportPlugin)
  .use(initReactI18next)
  .init({
    detection: {
      order: ["navigator"],
    },
    ns: ['ui', 'server', 'user'],
    defaultNS: 'ui',
    fallbackLng: {
      ...fallbacks,
      ...{ default: ["en"] },
    } as FallbackLng,
  });

export default i18n;
export type TLocale = (typeof locales)[number];
