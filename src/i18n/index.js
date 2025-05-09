import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
});

// 初始化语言设置
const initLanguage = async () => {
  try {
    const language = await window.electron.getLanguage();
    i18n.global.locale.value = language;
  } catch (error) {
    console.error('Error initializing language:', error);
  }
};

initLanguage();

export default i18n;