const express = require('express');
const cors = require('cors');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const serverless = require('serverless-http');

// Importamos Cliente Oficial de Supabase
const { createClient } = require('@supabase/supabase-js');

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// Configuramos las llaves mediante variables de entorno en tu panel de Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Base de datos de reserva temporal (útil si aún no pones las llaves de Netlify en tu Dashboard)
const usageDB = {};

// Configuramos Multer para recibir nuestro formData y guardar la imagen en memoria RAM
const upload = multer({ storage: multer.memoryStorage() });

// --- RUTA CLAVE: GENERACIÓN Y LIMITES DE PDFs ---
router.post('/generate-pdf', upload.single('logo'), async (req, res) => {
    try {
        // Obtenemos toda la data del frontend, de la cual "email" es la vital para nuestra validación
        const { email, company, client, work, length, width, price } = req.body;

        if (!email || !client || !length || !width || !price) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Variable global del estado de limitación y status PRO del usuario
        let userStatus = { count: 0, isPro: false };

        if (supabase) {
            // Buscamos el correo de la persona logueada en nuestra base de datos SQL de Supabase
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
            // Si Supabase falla o falta de configurar variables corre desde nuestra Memory BD
            if (!usageDB[email]) usageDB[email] = { count: 0, isPro: false };
            userStatus = usageDB[email];
        }

        // VALIDACIÓN: Si es gratis (is_pro false) y ya llegó al máximo de 3, lo negamos
        if (!userStatus.isPro && userStatus.count >= 3) {
            return res.status(403).json({
                error: "LimitReached",
                message: "You have reached the free limit of 3 quotes per month."
            });
        }

        // TODO BIEN -> Le restamos su límite natural de créditos sumando a su cuenta personal
        userStatus.count += 1;

        if (supabase) {
            // Actualizamos o Confirmamos su +1 gasto en nuestra Base de Datos en la Nube
            const { error: upsertError } = await supabase
                .from('usage')
                .upsert({ email: email, count: userStatus.count, is_pro: userStatus.isPro });

            if (upsertError) console.error("Supabase Upsert Error:", upsertError);
        } else {
            usageDB[email] = userStatus;
        }

        // PASAMOS A RENDERIZAR SU ARCHIVO (Los créditos están asegurados a cobrar)
        const l = parseFloat(length), w = parseFloat(width), p = parseFloat(price);
        if (isNaN(l) || isNaN(w) || isNaN(p)) return res.status(400).json({ error: "Invalid numbers." });

        const calculatedArea = l * w;
        const calculatedTotal = calculatedArea * p;

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // Enganchamos para enviar en sistema Binario via Netlify (Bufferear PDF)
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-disposition', 'attachment; filename="structa_quote.pdf"');
            res.setHeader('Content-type', 'application/pdf');
            // send native buffer a tu navegador
            res.send(pdfData);
        });

        // Estilos e Inyección del sistema UI visual en PDF
        const primaryColor = '#7c3aed', textColor = '#1f2937', textMuted = '#6b7280';
        const headerTop = 50;

        if (req.file) {
            // Imagen inyectada por el usuario Frontend (multer)
            doc.image(req.file.buffer, 50, headerTop, { width: 120 });
        } else {
            // Default caso de no haber logo
            doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text(company || "My Company", 50, headerTop);
        }

        // Headers Textos PDF
        doc.fontSize(28).font('Helvetica-Bold').fillColor(textColor).text('QUOTE / INVOICE', 50, headerTop, { align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor(textMuted).text(`Date: ${new Date().toLocaleDateString()}`, 50, headerTop + 35, { align: 'right' });
        doc.text(`No: INV-${Math.floor(Math.random() * 10000)}`, 50, headerTop + 50, { align: 'right' });
        doc.moveDown(4);

        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#e5e7eb').stroke();
        doc.moveDown(2);

        // Cliente Content
        const clientTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('BILL TO:', 50, clientTop);
        doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor).text(client, 50, clientTop + 15);

        // Work Content
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('DESCRIPTION:', 250, clientTop);
        doc.fontSize(12).font('Helvetica').fillColor(textColor).text(work || "Service provided", 250, clientTop + 15, { width: 295 });

        doc.y = Math.max(doc.y, clientTop + 50);
        doc.moveDown(3);

        // Grid Design Visual Background Row
        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 25).fill('#f3f4f6');

        // Text Grid (Labels)
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
        doc.text('MEASUREMENT', 60, tableTop + 8);
        doc.text('AREA', 200, tableTop + 8, { width: 100, align: 'right' });
        doc.text('PRICE PER M²', 320, tableTop + 8, { width: 100, align: 'right' });
        doc.text('TOTAL', 440, tableTop + 8, { width: 95, align: 'right' });

        // Texts Fill en Formato
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

        // Sumatoria Total Visual Boxed
        const totalY = doc.y;
        doc.rect(340, totalY - 5, 205, 30).fill('#f3f4f6');
        doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text('ESTIMATED TOTAL:', 350, totalY + 2, { width: 150, align: 'left' });
        doc.text(`$${calculatedTotal.toFixed(2)}`, 440, totalY + 2, { width: 95, align: 'right' });

        // Watermark Dinámico Libre Oculto en Usuarios De Pagos PRO
        if (!userStatus.isPro) {
            const bottomPosition = doc.page.height - 50;
            doc.fontSize(9).font('Helvetica').fillColor('#9ca3af')
                .text('Generated by Structa Quotes (Free Version) - Upgrade to Pro.',
                    50, bottomPosition, { align: 'center', width: 495 });
        }

        // Finaliza su creación
        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Error" });
    }
});

// Exportar Express a una estructura binaria asincrónica Serverless en Netlify Edge y Lambdas
app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app, {
    binary: ['application/pdf', 'image/*']
});
