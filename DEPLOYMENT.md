# 🚀 Wing — Deployment no Vercel

## Status do Deploy

✅ **Código feito push para GitHub** — Commit `a1955cb`

⏳ **Deploy automático disparado** — A integração Git da Vercel rodará o build automaticamente quando você configurar as env vars

## O que falta

### 1. Configurar Environment Variables na Vercel

1. Acesse https://vercel.com/jonathanans-projects-180a3059/wing
2. Vá para **Settings → Environment Variables**
3. Adicione as seguintes variáveis em **Production**:

```
NEXT_PUBLIC_SUPABASE_URL = https://hepfohmmnzgwmkovrisf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcGZvaG1tbnpnd21rb3ZyaXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTcwNzAsImV4cCI6MjA5MzgzMzA3MH0.K2S94kMCFr9GhqMCxtgTaixyKm9LbAL-y6Up1yk_1wE
```

4. **Redeploie** clicando no botão "Redeploy" ou fazendo outro push

### 2. URLs após o Deploy

- **Staging**: https://wing-git-master-jonathans-projects-180a3059.vercel.app
- **Production**: https://wing-blue.vercel.app

## Estrutura do Deploy

- **Framework**: Next.js 16.2.6
- **Node Version**: 24.x
- **Region**: USA (East) – iad1
- **Build Command**: `npm run build`

## Localhost

Servidor de desenvolvimento rodando em **http://localhost:3000**

Para iniciar novamente:
```bash
cd d:/antigravity/wing
npm run dev
```

---

**Build Error anterior**: `@utility input-field:focus` no CSS — já foi removido.  
**Próximo erro esperado até configurar env vars**: Missing Supabase keys no build.

Uma vez que as env vars forem configuradas, o build deverá passar sem problemas.
