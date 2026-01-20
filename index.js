const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenRouter API Key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// Data SOP untuk konteks AI
const sopData = [
    {
        id: 1,
        title: "ZUMA-SOP-HO-06 SOP Return Barang Wholesale",
        category: "wholesale",
        description: "Prosedur pengembalian barang wholesale.",
        content: `
SOP Return Barang Wholesale:
1. Customer mengajukan permintaan return dengan menyertakan bukti pembelian
2. Tim wholesale memverifikasi kondisi barang dan kelayakan return
3. Jika disetujui, barang dikirim kembali ke warehouse
4. Tim warehouse melakukan quality check
5. Proses refund atau penggantian barang dilakukan dalam 3-5 hari kerja
6. Update sistem inventory
        `
    },
    {
        id: 2,
        title: "CV-UBB-SOP-HO-01 SOP Perdagangan Wholesale",
        category: "wholesale",
        description: "Prosedur perdagangan wholesale CV UBB.",
        content: `
SOP Perdagangan Wholesale:
1. Customer melakukan inquiry/permintaan penawaran
2. Tim sales memberikan quotation sesuai quantity
3. Customer melakukan PO (Purchase Order)
4. Verifikasi pembayaran (DP atau full payment)
5. Proses picking dan packing di warehouse
6. Pengiriman barang sesuai jadwal
7. Konfirmasi penerimaan dari customer
8. Penyelesaian administrasi dan invoice
        `
    }
];

// System prompt untuk AI dengan few-shot prompting
const systemPrompt = `Kamu adalah AI Assistant SOP ZUMA Group. Jawab SINGKAT dan LANGSUNG ke poin.

ATURAN PENTING:
- Jawab maksimal 2-3 kalimat untuk pertanyaan sederhana
- Gunakan bullet points untuk langkah-langkah
- JANGAN gunakan emoji
- JANGAN bertele-tele atau basa-basi
- Langsung jawab pertanyaan

DATA SOP:
${sopData.map(sop => `${sop.title}:\n${sop.content}`).join('\n')}

CONTOH PERCAKAPAN (Few-Shot):

User: Halo
Assistant: Halo, ada yang bisa dibantu tentang SOP?

User: Bagaimana cara return barang wholesale?
Assistant: Prosedur return barang wholesale:
1. Ajukan permintaan return + bukti pembelian
2. Tim wholesale verifikasi kondisi barang
3. Jika disetujui, kirim barang ke warehouse
4. Quality check oleh tim warehouse
5. Refund/penggantian dalam 3-5 hari kerja

User: Berapa lama proses refund?
Assistant: Proses refund atau penggantian barang dilakukan dalam 3-5 hari kerja setelah quality check selesai.

User: SOP tentang rekrutmen ada?
Assistant: Maaf, SOP rekrutmen belum tersedia di sistem. SOP yang tersedia saat ini: Return Barang Wholesale dan Perdagangan Wholesale.

User: Apa saja langkah PO wholesale?
Assistant: Langkah PO wholesale:
1. Customer inquiry/minta penawaran
2. Sales kasih quotation
3. Customer kirim PO
4. Verifikasi pembayaran (DP/full)
5. Picking & packing di warehouse
6. Pengiriman sesuai jadwal
7. Konfirmasi penerimaan
8. Selesaikan administrasi & invoice`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message }
        ];

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://database-zuma.github.io/sop-dashboard/',
                'X-Title': 'SOP Dashboard ZUMA'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: messages,
                max_tokens: 300,
                temperature: 0.3
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('OpenRouter Error:', data.error);
            return res.status(500).json({ error: data.error.message || 'AI Error' });
        }

        const aiResponse = data.choices[0]?.message?.content || 'Maaf, saya tidak bisa memproses permintaan Anda.';

        res.json({
            response: aiResponse,
            model: data.model
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search endpoint - AI-powered search
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const searchPrompt = `Berdasarkan query berikut: "${query}"

Cari dan rekomendasikan SOP yang paling relevan dari daftar ini:
${sopData.map(sop => `- ID ${sop.id}: ${sop.title} (${sop.category}) - ${sop.description}`).join('\n')}

Berikan response dalam format JSON:
{
    "relevant_sops": [array of SOP IDs yang relevan],
    "explanation": "penjelasan singkat mengapa SOP tersebut relevan"
}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://database-zuma.github.io/sop-dashboard/',
                'X-Title': 'SOP Dashboard ZUMA'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'system', content: 'Kamu adalah search assistant. Selalu respond dalam format JSON yang valid.' },
                    { role: 'user', content: searchPrompt }
                ],
                max_tokens: 500,
                temperature: 0.3
            })
        });

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content || '{}';

        // Try to parse JSON response
        try {
            const parsed = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, ''));
            res.json(parsed);
        } catch {
            res.json({
                relevant_sops: sopData.map(s => s.id),
                explanation: aiResponse
            });
        }

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Summarize endpoint
app.post('/api/summarize', async (req, res) => {
    try {
        const { sopId } = req.body;

        const sop = sopData.find(s => s.id === sopId);
        if (!sop) {
            return res.status(404).json({ error: 'SOP not found' });
        }

        const summarizePrompt = `Buatkan ringkasan poin-poin penting dari SOP berikut:

Judul: ${sop.title}
${sop.content}

Berikan dalam format:
- Poin 1
- Poin 2
- dst

Maksimal 5 poin utama.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://database-zuma.github.io/sop-dashboard/',
                'X-Title': 'SOP Dashboard ZUMA'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'user', content: summarizePrompt }
                ],
                max_tokens: 500,
                temperature: 0.5
            })
        });

        const data = await response.json();
        const summary = data.choices[0]?.message?.content || 'Tidak dapat membuat ringkasan.';

        res.json({
            sopId: sop.id,
            title: sop.title,
            summary: summary
        });

    } catch (error) {
        console.error('Summarize Error:', error);
        res.status(500).json({ error: 'Summarize failed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SOP Dashboard API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'SOP Dashboard API',
        version: '1.0.0',
        endpoints: [
            'POST /api/chat - Chat with AI',
            'POST /api/search - AI-powered search',
            'POST /api/summarize - Summarize SOP',
            'GET /api/health - Health check'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
