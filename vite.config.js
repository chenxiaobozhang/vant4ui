import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // 确认这里是 @vitejs/plugin-vue
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
})