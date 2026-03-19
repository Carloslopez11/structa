const PDFDocument = require('pdfkit');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, company, client, work, length, width, price, logoBase64 } = req.body;

        if (!email || !client || !length || !width || !price) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        let userStatus = { count: 0, isPro: false };
        let supabase = null;

        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('usage')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (data) {
                userStatus = { count: data.count, isPro: data.is_pro };
            }
        }

        if (logoBase64 && !userStatus.isPro) {
            return res.status(403).json({ error: "ProFeatureLogo", message: "Uploading a logo requires the Pro Plan." });
        }

        if (!userStatus.isPro && userStatus.count >= 3) {
            return res.status(403).json({ error: "LimitReached", message: "You have reached the free limit of 3 quotes per month." });
        }

        userStatus.count += 1;

        if (supabase) {
            await supabase.from('usage').upsert({ email: email, count: userStatus.count, is_pro: userStatus.isPro });
        }

        const l = parseFloat(length), w = parseFloat(width), p = parseFloat(price);
        if (isNaN(l) || isNaN(w) || isNaN(p)) return res.status(400).json({ error: "Invalid numbers." });

        const calculatedArea = l * w;
        const calculatedTotal = calculatedArea * p;

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-disposition', 'attachment; filename="structa_quote.pdf"');
            res.setHeader('Content-type', 'application/pdf');
            res.send(pdfData);
        });

        const primaryColor = '#7c3aed', textColor = '#1f2937', textMuted = '#6b7280';
        const headerTop = 50;

        if (logoBase64 && userStatus.isPro) {
            // Remove the data:image prefix to get raw base64
            const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
            const imgBuffer = Buffer.from(base64Data, 'base64');
            doc.image(imgBuffer, 50, headerTop, { width: 120 });
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
                .text('Generated by Structa Quotes (Free Version) - Subscribe for unlimited usage.',
                    50, bottomPosition, { align: 'center', width: 495 });
        }

        doc.end();

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Internal Error" });
    }
};
