<template>
  <div :data-theme="theme" class="min-h-screen bg-base-100">
    <div class="drawer lg:drawer-open">
      <input id="drawer-toggle" type="checkbox" class="drawer-toggle" v-model="drawerOpen" />
      
      <div class="drawer-content flex flex-col">
        <!-- 顶部导航栏 -->
        <div class="navbar bg-base-200">
          <div class="flex-none lg:hidden">
            <label for="drawer-toggle" class="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                   class="inline-block w-6 h-6 stroke-current">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>
          </div>
          <div class="flex-1">
            <a class="btn btn-ghost normal-case text-xl">{{ $t('app.title') }}</a>
          </div>
          <div class="flex-none">
            <ThemeSwitcher />
            <LanguageSwitcher class="ml-2" />
          </div>
        </div>
        
        <!-- 主内容区域 -->
        <div class="p-4">
          <router-view />
        </div>
      </div>
      
      <!-- 侧边栏 -->
      <div class="drawer-side">
        <label for="drawer-toggle" class="drawer-overlay"></label>
        <ul class="menu p-4 w-64 h-full bg-base-200 text-base-content">
          <li>
            <router-link to="/">{{ $t('nav.home') }}</router-link>
          </li>
          <li>
            <router-link to="/text-extraction">{{ $t('nav.textExtraction') }}</router-link>
          </li>
          <li>
            <router-link to="/image-processing">{{ $t('nav.imageProcessing') }}</router-link>
          </li>
          <li>
            <router-link to="/file-management">{{ $t('nav.fileManagement') }}</router-link>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Toast 通知 -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import Toast from './components/ui/Toast.vue';
import { useThemeStore } from './store/theme';

const themeStore = useThemeStore();
const theme = ref('light');
const drawerOpen = ref(false);
const route = useRoute();

onMounted(async () => {
  await themeStore.initTheme();
  theme.value = themeStore.theme;
});

watch(() => themeStore.theme, (newTheme) => {
  theme.value = newTheme;
});

// 在路由变化时关闭抽屉（在移动设备上）
watch(() => route.path, () => {
  drawerOpen.value = false;
});
</script>