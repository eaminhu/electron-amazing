<template>
  <div class="home">
    <div class="hero min-h-[80vh] bg-base-200 rounded-lg">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">{{ $t('app.title') }}</h1>
          <p class="py-6">{{ $t('app.description') }}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <router-link to="/text-extraction" class="btn btn-primary">
              {{ $t('nav.textExtraction') }}
            </router-link>
            <router-link to="/image-processing" class="btn btn-secondary">
              {{ $t('nav.imageProcessing') }}
            </router-link>
            <router-link to="/file-management" class="btn btn-accent">
              {{ $t('nav.fileManagement') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>