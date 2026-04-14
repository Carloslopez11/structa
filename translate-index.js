const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The Demo Animation
html = html.replace('Nuevo Proyecto', 'New Project');
html = html.replace('Calculando materiales y costos...', 'Calculating materials and costs...');
html = html.replace('Total estimado:', 'Estimated Cost:');
html = html.replace('Plano 2D Arquitectónico de Cocina', '2D Architectural Kitchen Plan');
html = html.replace('Bajar PDF', 'Download PDF');
html = html.replace('Enviar por WhatsApp', 'Send via WhatsApp');
html = html.replace('¡Enviado al cliente!', 'Sent to client!');
html = html.replace('Cocina Moderna 15m2, isla de cuarzo, luces LED...', 'Modern Kitchen 150sqft, quartz island, LED lights...');

// Pricing Section
html = html.replace('Planes de Negocio', 'Business Plans');
html = html.replace('Elige el plan ideal para transformar tus demostraciones en contratos reales.', 'Choose the ideal plan to turn your demos into signed contracts.');

// Starter Plan
html = html.replace('Plan Starter', 'Starter Plan');
html = html.replace('"Ideal para probar la magia"', '"Ideal to test the magic"');
html = html.replace('3 renders básicos', '3 basic renders');
html = html.replace('Resolución estándar', 'Standard resolution');
html = html.replace('Uso personal', 'Personal use');

// Pro Contractor Plan
html = html.replace('Plan Pro Contractor', 'Pro Contractor Plan');
html = html.replace('MÁS POPULAR', 'MOST POPULAR');
html = html.replace('"La herramienta para cerrar contratos de $20k+."', '"The tool to close $20k+ contracts."');
html = html.replace('Renders ILIMITADOS', 'UNLIMITED Renders');
html = html.replace('Calidad HD Premium', 'Premium HD Quality');
html = html.replace('Licencia Comercial Completa', 'Full Commercial License');
html = html.replace('Soporte Prioritario', 'Priority Support');

// Business Plan
html = html.replace('Plan Business', 'Business Plan');
html = html.replace('"Para equipos que dominan el mercado"', '"For teams dominating the market"');
html = html.replace('3 cuentas de usuario', '3 user accounts');
html = html.replace('Estilos de IA personalizados', 'Customized AI Styles');
html = html.replace('Acceso a API', 'API Access');
html = html.replace('Gerente de cuenta dedicado', 'Dedicated Account Manager');
html = html.replace('Coming Soon (Próximamente)', 'Coming Soon');

// Also any button text missed in Pricing:
// Note: Some buttons may already be in English, e.g., "Get Started", "Upgrade Now".

// Write back
fs.writeFileSync('index.html', html, 'utf8');

console.log('Translation complete');
