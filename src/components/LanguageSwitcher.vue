<template>
  <div class="language-switcher">
    <select class="select select-bordered select-sm" v-model="currentLanguage" @change="changeLanguage">
      <option value="zh">{{ $t('language.zh') }}</option>
      <option value="en">{{ $t('language.en') }}</option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const currentLanguage = ref('zh');

onMounted(async () => {
  try {
    const language = await window.electron.getLanguage();
    currentLanguage.value = language;
    locale.value = language;
  } catch (error) {
    console.error('Error getting language:', error);
  }
});

const changeLanguage = async () => {
  try {
    await window.electron.setLanguage(currentLanguage.value);
    locale.value = currentLanguage.value;
  } catch (error) {
    console.error('Error setting language:', error);
  }
};
</script>