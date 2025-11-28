import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente (como a API_KEY que você colocou na Vercel)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Isso garante que process.env.API_KEY funcione no código final
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})