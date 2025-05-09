<template>
  <div class="image-processing">
    <h1 class="text-2xl font-bold mb-4">{{ $t('imageProcessor.title') }}</h1>
    <ImageProcessor />
  </div>
</template>

<script setup>
import ImageProcessor from '../components/ImageProcessor.vue';
</script>