<template>
  <div class="file-management">
    <h1 class="text-2xl font-bold mb-4">{{ $t('fileManager.title') }}</h1>
    <FileManager />
  </div>
</template>

<script setup>
import FileManager from '../components/FileManager.vue';
</script>