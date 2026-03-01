const express = require('express');
const cors = require('cors');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// Configuración de Supabase (las variables deben estar en Netlify)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// In-memory "database" 
// (Note: In serverless, memory is not persistent between cold starts, 
// so this will reset occasionally until we use a real DB in Phase 2)
const usageDB = {};

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// --- ENDPOINTS ---
// We use 'router' instead of 'app' for serverless-http compatibility 
// when base passing through netlify.toml rewrites
router.post('/generate-pdf', upload.single('logo'), async (req, res) => {
    try {
        const { email, company, client, work, length, width, price } = req.body;

        if (!email || !client || !length || !width || !price) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        let userStatus = { count: 0, isPro: false };

        if (supabase) {
            // Verificar uso en Supabase
            const { data, error } = await supabase
                .from('usage')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (data) {
                userStatus = { count: data.count, isPro: data.is_pro };
            } else if (error) {
                console.error("Supabase Error:", error);
            }
        } else {
            // Fallback de memoria
            if (!usageDB[email]) usageDB[email] = { count: 0, isPro: false };
            userStatus = usageDB[email];
        }

        if (!userStatus.isPro && userStatus.count >= 3) {
            return res.status(403).json({
                error: "LimitReached",
                message: "You have reached the free limit of 3 quotes per month."
            });
        }

        userStatus.count += 1;

        if (supabase) {
            // Actualizar cuenta en Supabase
            const { error: upsertError } = await supabase
                .from('usage')
                .upsert({ email: email, count: userStatus.count, is_pro: userStatus.isPro });

            if (upsertError) console.error("Supabase Upsert Error:", upsertError);
        } else {
            usageDB[email] = userStatus;
        }

        const l = parseFloat(length), w = parseFloat(width), p = parseFloat(price);
        if (isNaN(l) || isNaN(w) || isNaN(p)) return res.status(400).json({ error: "Invalid numbers." });

        const calculatedArea = l * w;
        const calculatedTotal = calculatedArea * p;

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // IMPORTANT FOR SERVERLESS: 
        // We cannot pipe directly to res in standard lambda easily for binary files without base64 encoding.
        // For Netlify Functions, returning binary PDFs via express+serverless-http works best with base64 responses
        // Let's collect the PDF chunks into a buffer first
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-disposition', 'attachment; filename="structa_quote.pdf"');
            res.setHeader('Content-type', 'application/pdf');
            // send native buffer
            res.send(pdfData);
        });

        // Generate Document visuals
        const primaryColor = '#7c3aed', textColor = '#1f2937', textMuted = '#6b7280';
        const headerTop = 50;

        if (req.file) {
            doc.image(req.file.buffer, 50, headerTop, { width: 120 });
        } else {
            doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text(company || "My Company", 50, headerTop);
        }

        doc.fontSize(28).font('Helvetica-Bold').fillColor(textColor).text('QUOTE / INVOICE', 50, headerTop, { align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor(textMuted).text(`Date: ${new Date().toLocaleDateString()}`, 50, headerTop + 35, { align: 'right' });
        doc.text(`No: INV-${Math.floor(Math.random() * 10000)}`, 50, headerTop + 50, { align: 'right' });
        doc.moveDown(4);

        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#e5e7eb').stroke();
        doc.moveDown(2);

        const clientTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('BILL TO:', 50, clientTop);
        doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor).text(client, 50, clientTop + 15);

        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('DESCRIPTION:', 250, clientTop);
        doc.fontSize(12).font('Helvetica').fillColor(textColor).text(work || "Service provided", 250, clientTop + 15, { width: 295 });

        doc.y = Math.max(doc.y, clientTop + 50);
        doc.moveDown(3);

        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 25).fill('#f3f4f6');

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
        doc.text('MEASUREMENT', 60, tableTop + 8);
        doc.text('AREA', 200, tableTop + 8, { width: 100, align: 'right' });
        doc.text('PRICE PER M²', 320, tableTop + 8, { width: 100, align: 'right' });
        doc.text('TOTAL', 440, tableTop + 8, { width: 95, align: 'right' });

        const itemTop = tableTop + 35;
        doc.fontSize(10).font('Helvetica').fillColor(textColor);
        doc.text(`${l}m x ${w}m`, 60, itemTop);
        doc.text(`${calculatedArea.toFixed(2)} m²`, 200, itemTop, { width: 100, align: 'right' });
        doc.text(`$${p.toFixed(2)}`, 320, itemTop, { width: 100, align: 'right' });
        doc.text(`$${calculatedTotal.toFixed(2)}`, 440, itemTop, { width: 95, align: 'right' });

        const afterItemY = itemTop + 20;
        doc.moveTo(50, afterItemY).lineTo(545, afterItemY).lineWidth(0.5).strokeColor('#e5e7eb').stroke();

        doc.y = afterItemY + 30;
        doc.fontSize(10).font('Helvetica').fillColor(textMuted).text('Subtotal:', 350, doc.y, { width: 80, align: 'right' });
        doc.fillColor(textColor).text(`$${calculatedTotal.toFixed(2)}`, 440, doc.y, { width: 95, align: 'right' });
        doc.moveDown(1);
        doc.moveTo(350, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#e5e7eb').stroke();
        doc.moveDown(1);

        const totalY = doc.y;
        doc.rect(340, totalY - 5, 205, 30).fill('#f3f4f6');
        doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text('ESTIMATED TOTAL:', 350, totalY + 2, { width: 150, align: 'left' });
        doc.text(`$${calculatedTotal.toFixed(2)}`, 440, totalY + 2, { width: 95, align: 'right' });

        if (!userStatus.isPro) {
            const bottomPosition = doc.page.height - 50;
            doc.fontSize(9).font('Helvetica').fillColor('#9ca3af')
                .text('Generated by Structa Quotes (Free Version) - Upgrade to Pro.',
                    50, bottomPosition, { align: 'center', width: 495 });
        }

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Error" });
    }
});

router.post('/upgrade-pro', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    if (supabase) {
        const { data } = await supabase.from('usage').select('count').eq('email', email).maybeSingle();
        const currentCount = data ? data.count : 0;
        await supabase.from('usage').upsert({ email, count: currentCount, is_pro: true });
    } else {
        if (!usageDB[email]) usageDB[email] = { count: 0, isPro: false };
        usageDB[email].isPro = true;
    }

    res.json({ message: `Success! ${email} upgraded.` });
});

// Since the netlify redirect maps /api to /.netlify/functions/api
app.use('/.netlify/functions/api', router);

// Export mapped express app via serverless-http
module.exports.handler = serverless(app, {
    binary: ['application/pdf', 'image/*'] // Ensures binary responses like PDF are handled correctly
});
