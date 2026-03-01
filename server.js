const express = require('express');
const cors = require('cors');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const port = 3000;

// Enable CORS for all routes (since frontend and backend might be on different origins during dev)
app.use(cors());
app.use(express.json());

// In-memory "database" for tracking subscription limits
// Format: { "email@example.com": { count: 1, isPro: false } }
const usageDB = {};

// Multer setup for handling file uploads (logo) in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- ENDPOINTS ---

// 1. Generate PDF Endpoint
app.post('/api/generate-pdf', upload.single('logo'), (req, res) => {
    try {
        const { email, company, client, work, length, width, price } = req.body;

        // Input validation
        if (!email || !client || !length || !width || !price) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // --- SUBSCRIPTION LOGIC ---
        // Initialize user if not exists
        if (!usageDB[email]) {
            usageDB[email] = { count: 0, isPro: false };
        }

        const userStatus = usageDB[email];

        // Check if user hit the free limit
        if (!userStatus.isPro && userStatus.count >= 3) {
            return res.status(403).json({
                error: "LimitReached",
                message: "You have reached the free limit of 3 quotes per month. Please upgrade to Pro."
            });
        }

        // Increment usage count
        userStatus.count += 1;

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

        // Set headers for PDF download
        res.setHeader('Content-disposition', 'attachment; filename="structa_quote.pdf"');
        res.setHeader('Content-type', 'application/pdf');

        // Pipe the PDF directly to the HTTP response
        doc.pipe(res);

        const primaryColor = '#7c3aed';
        const textColor = '#1f2937';
        const textMuted = '#6b7280';

        // Header
        const headerTop = 50;

        // Left - Logo or Company Name
        if (req.file) {
            doc.image(req.file.buffer, 50, headerTop, { width: 120 });
        } else {
            doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text(company || "My Company", 50, headerTop);
        }

        // Right - Title and Date
        doc.fontSize(28).font('Helvetica-Bold').fillColor(textColor).text('QUOTE / INVOICE', 50, headerTop, { align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor(textMuted).text(`Date: ${new Date().toLocaleDateString()}`, 50, headerTop + 35, { align: 'right' });
        doc.text(`No: INV-${Math.floor(Math.random() * 10000)}`, 50, headerTop + 50, { align: 'right' });

        doc.moveDown(4);

        // Divider
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#e5e7eb').stroke();
        doc.moveDown(2);

        // Client Info Section
        const clientTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('BILL TO:', 50, clientTop);
        doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor).text(client, 50, clientTop + 15);

        doc.fontSize(10).font('Helvetica-Bold').fillColor(textMuted).text('DESCRIPTION:', 250, clientTop);
        doc.fontSize(12).font('Helvetica').fillColor(textColor).text(work || "Service provided", 250, clientTop + 15, { width: 295 });

        // Move below client info
        doc.y = Math.max(doc.y, clientTop + 50);
        doc.moveDown(3);

        // Table Header
        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 25).fill('#f3f4f6');

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
        doc.text('MEASUREMENT', 60, tableTop + 8);
        doc.text('AREA', 200, tableTop + 8, { width: 100, align: 'right' });
        doc.text('PRICE PER M²', 320, tableTop + 8, { width: 100, align: 'right' });
        doc.text('TOTAL', 440, tableTop + 8, { width: 95, align: 'right' });

        // Table Content
        const itemTop = tableTop + 35;
        doc.fontSize(10).font('Helvetica').fillColor(textColor);

        doc.text(`${l}m x ${w}m`, 60, itemTop);
        doc.text(`${calculatedArea.toFixed(2)} m²`, 200, itemTop, { width: 100, align: 'right' });
        doc.text(`$${p.toFixed(2)}`, 320, itemTop, { width: 100, align: 'right' });
        doc.text(`$${calculatedTotal.toFixed(2)}`, 440, itemTop, { width: 95, align: 'right' });

        // Item separator
        const afterItemY = itemTop + 20;
        doc.moveTo(50, afterItemY).lineTo(545, afterItemY).lineWidth(0.5).strokeColor('#e5e7eb').stroke();

        // Total Section
        doc.y = afterItemY + 30;

        // Subtotal
        doc.fontSize(10).font('Helvetica').fillColor(textMuted).text('Subtotal:', 350, doc.y, { width: 80, align: 'right' });
        doc.fillColor(textColor).text(`$${calculatedTotal.toFixed(2)}`, 440, doc.y, { width: 95, align: 'right' });
        doc.moveDown(1);

        // Divider before total
        doc.moveTo(350, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#e5e7eb').stroke();
        doc.moveDown(1);

        // Grand Total
        const totalY = doc.y;
        doc.rect(340, totalY - 5, 205, 30).fill('#f3f4f6');
        doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text('ESTIMATED TOTAL:', 350, totalY + 2, { width: 150, align: 'left' });
        doc.text(`$${calculatedTotal.toFixed(2)}`, 440, totalY + 2, { width: 95, align: 'right' });

        // Footer Watermark for Free users
        if (!userStatus.isPro) {
            const bottomPosition = doc.page.height - 50;
            doc.fontSize(9).font('Helvetica').fillColor('#9ca3af')
                .text('Generated by Structa Quotes (Free Version) - Upgrade to Pro to remove this watermark.',
                    50, bottomPosition, { align: 'center', width: 495 });
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. Webhook / Upgrade Endpoint (Simulated for this MVP)
// En producción, esto sería llamado por Stripe cuando el pago se confirme.
app.post('/api/upgrade-pro', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required to upgrade" });

    if (!usageDB[email]) {
        usageDB[email] = { count: 0, isPro: false };
    }
    usageDB[email].isPro = true;

    res.json({ message: `Success! ${email} upgraded to Pro.` });
});

// Start Server
app.listen(port, () => {
    console.log(`Structa Backend API running on http://localhost:${port}`);
});
