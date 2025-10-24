import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // react-syntax-highlighter imports deep paths that are blocked by refractor's exports map
      { find: 'refractor/lib/all', replacement: 'refractor/all' },
      { find: 'refractor/lib/core', replacement: 'refractor/core' },
      // Map old-style language imports used by react-syntax-highlighter to new ESM exports
      { find: /^refractor\/lang\/(.+)\.js$/, replacement: 'refractor/$1' }
    ]
  }
})
