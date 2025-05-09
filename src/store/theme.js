import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light',
  }),
  
  actions: {
    async initTheme() {
      try {
        this.theme = await window.electron.getTheme();
        document.documentElement.setAttribute('data-theme', this.theme);
      } catch (error) {
        console.error('Error initializing theme:', error);
      }
    },
    
    async setTheme(theme) {
      try {
        this.theme = await window.electron.setTheme(theme);
        document.documentElement.setAttribute('data-theme', this.theme);
      } catch (error) {
        console.error('Error setting theme:', error);
      }
    },
  },
});