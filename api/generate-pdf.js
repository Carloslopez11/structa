const db = require('./_db');
const PDFDocument = require('pdfkit');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, company, client, work, length, width, price, logoBase64 } = req.body;

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

    // --- PDF GENERATION ---
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-disposition', 'attachment; filename="structa_quote.pdf"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    const primaryColor = '#7c3aed';
    const textColor = '#1f2937';
    const textMuted = '#6b7280';

    const headerTop = 50;

    if (logoBase64) {
        // logoBase64 looks like "data:image/png;base64,iVBORw0KGgo..."
        const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        try {
            doc.image(imageBuffer, 50, headerTop, { width: 120 });
        } catch(e) {
            console.error("Invalid logo format");
            doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text(company || "My Company", 50, headerTop);
        }
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

    if (!userStatus.is_pro) {
        const bottomPosition = doc.page.height - 50;
        doc.fontSize(9).font('Helvetica').fillColor('#9ca3af')
            .text('Generated by Structa Quotes (Free Version) - Upgrade to Pro to remove this watermark.',
                50, bottomPosition, { align: 'center', width: 495 });
    }

    doc.end();

    // Vercel Serverless Functions kill the process when the function returns.
    // We MUST wait for the response stream to finish writing the PDF.
    return new Promise((resolve, reject) => {
        res.on('finish', () => resolve());
        res.on('error', reject);
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "PDF Generation Error: " + error.message, stack: error.stack });
  }
}
