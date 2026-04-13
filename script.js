const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// CSS Variables
html = html.replace('--bg-midnight: #0A0F24;', '--bg-midnight: #050a15;');
html = html.replace('--card-bg: #121A38;', '--card-bg: rgba(15, 23, 42, 0.5);');
html = html.replace('--violet: #8B5CF6;', '--violet: #00f0ff;');
html = html.replace('--violet-hover: #7C3AED;', '--violet-hover: #0891b2;');
html = html.replace('--cyan-glow: #2DD4BF;', '--cyan-glow: #00f0ff;');
html = html.replace('--text-main: #F8FAFC;', '--text-main: #ffffff;');
html = html.replace('--text-muted: #94A3B8;', '--text-muted: #cbd5e1;');
html = html.replace('--border-glass: rgba(255, 255, 255, 0.08);', '--border-glass: rgba(0, 240, 255, 0.2);');
html = html.replace('--glass-bg: rgba(18, 26, 56, 0.6);', '--glass-bg: rgba(15, 23, 42, 0.5);');

// CSS RGB / HEX hardcoded
html = html.replace(/rgba\(139,\s*92,\s*246,/g, 'rgba(0, 240, 255,');
html = html.replace(/rgba\(45,\s*212,\s*191,/g, 'rgba(0, 240, 255,');
html = html.replace(/#A78BFA/g, '#00f0ff');
html = html.replace(/#6D28D9/g, '#0891b2');
html = html.replace(/#8B5CF6/g, '#00f0ff');
html = html.replace(/#F59E0B/g, '#3b82f6');
html = html.replace(/#10B981/g, '#00f0ff');

// Specific styling mentioned in prompt:
html = html.replace(/bg-\[rgba\(255,255,255,0\.03\)\]/g, 'bg-slate-900/50 backdrop-blur-md');
html = html.replace(/border border-\[rgba\(255,255,255,0\.08\)\]/g, 'border border-cyan-400/20');

html = html.replace(/bg-\[rgba\(59,130,246,0\.08\)\]/g, 'bg-slate-900/50');
html = html.replace(/border-2 border-blue-500 shadow-\[0_0_40px_rgba\(59,130,246,0\.3\)\]/g, 'border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]');
html = html.replace(/text-blue-200/g, 'text-cyan-200');
html = html.replace(/bg-\[rgba\(59,130,246,0\.15\)\]/g, 'bg-cyan-900/30');

// Buttons in pricing
html = html.replace(/bg-blue-600/g, 'bg-cyan-400 text-slate-950');
html = html.replace(/hover:bg-blue-500/g, 'hover:bg-cyan-300');
html = html.replace(/shadow-\[0_10px_25px_rgba\(59,130,246,0\.5\)\]/g, 'shadow-[0_0_15px_rgba(0,240,255,0.4)]');
html = html.replace(/bg-blue-500/g, 'bg-cyan-400 text-slate-950');

// Icons in pricing
html = html.replace(/text-green-500/g, 'text-cyan-400');
html = html.replace(/text-green-400/g, 'text-cyan-400');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Update Complete');
