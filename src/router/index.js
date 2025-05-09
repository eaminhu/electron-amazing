import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import TextExtraction from '../views/TextExtraction.vue';
import ImageProcessing from '../views/ImageProcessing.vue';
import FileManagement from '../views/FileManagement.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/text-extraction',
    name: 'TextExtraction',
    component: TextExtraction
  },
  {
    path: '/image-processing',
    name: 'ImageProcessing',
    component: ImageProcessing
  },
  {
    path: '/file-management',
    name: 'FileManagement',
    component: FileManagement
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;