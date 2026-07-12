const db = require('./_db');
const PDFDocument = require('pdfkit');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, company, client, work, length, width, price, logoBase64, renderUrl } = req.body;

    if (!email || !client || !length || !width || !price) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // --- SUBSCRIPTION LOGIC (PostgreSQL) ---
    let userStatus = { count: 0, is_pro: false };
    try {
        let userResult = await db.query('SELECT count, is_pro FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            // New user, insert into DB
            await db.query('INSERT INTO users (email, count, is_pro) VALUES ($1, 0, false)', [email]);
        } else {
            userStatus = userResult.rows[0];
        }

        // ADMIN BYPASS
        if (email.trim().toLowerCase() === 'javibillo29@gmail.com') {
            userStatus.is_pro = true;
        }

        if (!userStatus.is_pro && userStatus.count >= 5) {
            return res.status(403).json({
                error: "LimitReached",
                message: "You have reached the free limit of 5 quotes. Please upgrade to Pro."
            });
        }

        // Increment usage count
        await db.query('UPDATE users SET count = count + 1 WHERE email = $1', [email]);
    } catch (dbError) {
        console.error("Database error (bypassing for now):", dbError.message);
        // Fallback to free user so the PDF generation doesn't completely break
    }

    // --- AUTOMATIC CALCULATIONS ---
    const l = parseFloat(length);
    const w = parseFloat(width);
    const p = parseFloat(price);

    if (isNaN(l) || isNaN(w) || isNaN(p)) {
        return res.status(400).json({ error: "Invalid numbers for length, width, or price." });
    }

    const calculatedArea = l * w;
    const calculatedTotal = calculatedArea * p;

    // Fetch the AI generated image if it exists
    let renderImageBuffer = null;
    if (renderUrl) {
        try {
            const imgRes = await fetch(renderUrl);
            if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                renderImageBuffer = Buffer.from(arrayBuffer);
            }
        } catch (e) {
            console.error("Failed to fetch render image:", e);
        }
    }

    // --- PDF GENERATION ---
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    return new Promise((resolve, reject) => {
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const result = Buffer.concat(chunks);
            res.setHeader('Content-disposition', 'attachment; filename="structa_quote.pdf"');
            res.setHeader('Content-type', 'application/pdf');
            res.status(200).end(result);
            resolve();
        });
        doc.on('error', reject);

        const primaryColor = '#1e293b';
        const accentColor = '#7c3aed';
        const textColor = '#334155';
        const textMuted = '#64748b';
        const lightBg = '#f8fafc';

        // --- Premium Header Background ---
        doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

        const headerTop = 40;

        if (logoBase64) {
            const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, 'base64');
            try {
                // Try to place the logo on the dark header
                doc.image(imageBuffer, 50, headerTop - 10, { width: 100 });
            } catch(e) {
                doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff').text(company || "STRUCTA PRO", 50, headerTop);
            }
        } else {
            doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff').text(company || "STRUCTA PRO", 50, headerTop);
        }

        doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff').text('INVOICE', 50, headerTop, { align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor('#cbd5e1').text(`Date: ${new Date().toLocaleDateString()}`, 50, headerTop + 35, { align: 'right' });
        doc.text(`No: INV-${Math.floor(Math.random() * 10000)}`, 50, headerTop + 50, { align: 'right' });

        doc.y = 150; // Reset Y below header

        // --- Client Info Section ---
        const clientTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('BILL TO', 50, clientTop);
        doc.moveTo(50, clientTop + 12).lineTo(200, clientTop + 12).lineWidth(1).strokeColor(accentColor).stroke();
        doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text(client, 50, clientTop + 22);

        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('PROJECT DESCRIPTION', 250, clientTop);
        doc.moveTo(250, clientTop + 12).lineTo(545, clientTop + 12).lineWidth(1).strokeColor(accentColor).stroke();
        doc.fontSize(12).font('Helvetica').fillColor(textColor).text(work || "Professional rendering & construction services.", 250, clientTop + 22, { width: 295 });

        doc.y = Math.max(doc.y, clientTop + 70);
        doc.moveDown(2);

        // --- Table Header ---
        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 30).fill(lightBg);

        doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
        doc.text('MEASUREMENT', 60, tableTop + 10);
        doc.text('AREA', 200, tableTop + 10, { width: 100, align: 'right' });
        doc.text('PRICE PER M²', 320, tableTop + 10, { width: 100, align: 'right' });
        doc.text('TOTAL', 440, tableTop + 10, { width: 95, align: 'right' });

        // --- Table Row ---
        const itemTop = tableTop + 45;
        doc.fontSize(11).font('Helvetica').fillColor(textColor);

        doc.text(`${l}m x ${w}m`, 60, itemTop);
        doc.text(`${calculatedArea.toFixed(2)} m²`, 200, itemTop, { width: 100, align: 'right' });
        doc.text(`$${p.toFixed(2)}`, 320, itemTop, { width: 100, align: 'right' });
        doc.text(`$${calculatedTotal.toFixed(2)}`, 440, itemTop, { width: 95, align: 'right' });

        const afterItemY = itemTop + 30;
        doc.moveTo(50, afterItemY).lineTo(545, afterItemY).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

        doc.y = afterItemY + 30;

        // --- Totals Section ---
        doc.fontSize(11).font('Helvetica').fillColor(textMuted).text('Subtotal:', 350, doc.y, { width: 80, align: 'right' });
        doc.fillColor(textColor).text(`$${calculatedTotal.toFixed(2)}`, 440, doc.y, { width: 95, align: 'right' });
        doc.moveDown(1);

        doc.moveTo(350, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#e2e8f0').stroke();
        doc.moveDown(1);

        const totalY = doc.y;
        doc.rect(300, totalY - 10, 245, 45).fill(lightBg);
        
        doc.moveTo(300, totalY - 10).lineTo(300, totalY + 35).lineWidth(4).strokeColor(accentColor).stroke();

        doc.fontSize(16).font('Helvetica-Bold').fillColor(primaryColor).text('ESTIMATED TOTAL:', 310, totalY + 5, { width: 150, align: 'left' });
        doc.text(`$${calculatedTotal.toFixed(2)}`, 440, totalY + 5, { width: 95, align: 'right' });

        // --- Footer ---
        const bottomPosition = doc.page.height - 70;
        doc.moveTo(50, bottomPosition - 15).lineTo(545, bottomPosition - 15).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        
        doc.fontSize(9).font('Helvetica').fillColor(textMuted)
            .text('Thank you for your business. This is an estimated quote and prices are subject to change.',
                50, bottomPosition, { align: 'center', width: 495 });

        if (!userStatus.is_pro) {
            doc.fontSize(8).fillColor('#94a3b8')
                .text('Generated via Structa - the premier tool for architects.',
                    50, bottomPosition + 15, { align: 'center', width: 495 });
        }

        // --- Render Image Page ---
        if (renderImageBuffer) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
            doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff').text('PROJECT RENDERING', 50, 40, { align: 'center' });
            
            doc.y = 150;
            try {
                // Draw the image, scaling it to fit the page horizontally and vertically while maintaining aspect ratio
                doc.image(renderImageBuffer, 50, doc.y, { fit: [495, 600], align: 'center', valign: 'center' });
            } catch (e) {
                console.error("Failed to draw render image:", e);
            }
            
            // Footer on the image page too
            doc.moveTo(50, bottomPosition - 15).lineTo(545, bottomPosition - 15).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
            doc.fontSize(9).font('Helvetica').fillColor(textMuted)
                .text('AI Generated Architectural Sketch',
                    50, bottomPosition, { align: 'center', width: 495 });
        }

        doc.end();
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "PDF Generation Error: " + error.message, stack: error.stack });
  }
}
