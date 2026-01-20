# SOP Dashboard API

Backend API untuk SOP Dashboard ZUMA Group dengan AI Assistant.

## Tech Stack
- Node.js + Express.js
- OpenRouter API (DeepSeek model)
- Hosting: Railway

## Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/chat` | Chat dengan AI Assistant |
| POST | `/api/search` | Pencarian SOP dengan AI |
| POST | `/api/summarize` | Ringkasan SOP |
| GET | `/api/health` | Health check |

## Environment Variables

```
PORT=3000
OPENROUTER_API_KEY=your_api_key
```

## SOP yang Tersedia

1. **ZUMA-SOP-HO-06** - SOP Return Barang Wholesale
2. **CV-UBB-SOP-HO-01** - SOP Perdagangan Wholesale

## AI Configuration

- Model: `deepseek/deepseek-chat`
- max_tokens: 300
- temperature: 0.3
- Few-shot prompting untuk respon singkat dan jelas

## Deployment

### Railway
1. Connect repo GitHub ke Railway
2. Set environment variable `OPENROUTER_API_KEY`
3. Deploy otomatis setiap push ke main

## URLs

- **API**: https://sop-dashboard-api-production.up.railway.app
- **Frontend**: https://database-zuma.github.io/sop-dashboard/

## Changelog

### v1.0.0 (20 Jan 2026)
- Initial release
- Chat, search, summarize endpoints
- Few-shot prompting untuk respon singkat
