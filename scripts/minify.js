#!/usr/bin/env node
/**
 * Asset Minification Pipeline for Ptolemy
 *
 * Minifies all raw CSS files in public/css/ -> *.min.css
 * Minifies all raw JS files in public/js/   -> *.min.js
 *
 * Usage:
 *   node scripts/minify.js           (One-time build)
 *   node scripts/minify.js --watch   (Watch mode for auto-rebuilding)
 */

const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, '..', 'public', 'css');
const JS_DIR = path.join(__dirname, '..', 'public', 'js');

// Dynamically load CleanCSS and Terser if installed
let CleanCSS, terser;
try {
    CleanCSS = require('clean-css');
} catch (e) {
    CleanCSS = null;
}

try {
    terser = require('terser');
} catch (e) {
    terser = null;
}

/**
 * Basic fallback minifier for CSS if clean-css is not installed
 */
function basicMinifyCss(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
        .replace(/;(?=\})/g, '')
        .trim();
}

/**
 * Basic fallback minifier for JS if terser is not installed
 */
function basicMinifyJs(js) {
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/(?![^\n]*['"]).*$/gm, '$1')
        .replace(/\n\s*\n/g, '\n')
        .trim();
}

/**
 * Minify a single CSS file
 */
function minifyCssFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const outPath = filePath.replace(/\.css$/, '.min.css');

    let minified = '';
    if (CleanCSS) {
        const output = new CleanCSS({ level: 2 }).minify(raw);
        if (output.errors.length > 0) {
            console.error(`[CSS Error] in ${path.basename(filePath)}:`, output.errors);
            return false;
        }
        minified = output.styles;
    } else {
        minified = basicMinifyCss(raw);
    }

    fs.writeFileSync(outPath, minified, 'utf8');
    const originalSize = Buffer.byteLength(raw, 'utf8');
    const minSize = Buffer.byteLength(minified, 'utf8');
    const savings = ((1 - (minSize / originalSize)) * 100).toFixed(1);
    console.log(`[CSS] ${path.basename(filePath)} -> ${path.basename(outPath)} (${originalSize}B -> ${minSize}B, -${savings}%)`);
    return true;
}

/**
 * Minify a single JS file
 */
async function minifyJsFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const outPath = filePath.replace(/\.js$/, '.min.js');

    let minified = '';
    if (terser) {
        try {
            const result = await terser.minify(raw, {
                compress: {
                    drop_console: false, // Keep console for client telemetry
                    dead_code: true
                },
                mangle: false // Preserve variable names for debugging & global interop
            });
            minified = result.code;
        } catch (err) {
            console.error(`[JS Error] in ${path.basename(filePath)}:`, err.message);
            return false;
        }
    } else {
        minified = basicMinifyJs(raw);
    }

    fs.writeFileSync(outPath, minified, 'utf8');
    const originalSize = Buffer.byteLength(raw, 'utf8');
    const minSize = Buffer.byteLength(minified, 'utf8');
    const savings = ((1 - (minSize / originalSize)) * 100).toFixed(1);
    console.log(`[JS]  ${path.basename(filePath)} -> ${path.basename(outPath)} (${originalSize}B -> ${minSize}B, -${savings}%)`);
    return true;
}

/**
 * Build all CSS and JS assets
 */
async function buildAll() {
    console.log(`--- Building Minified Assets [${new Date().toLocaleTimeString()}] ---`);

    if (fs.existsSync(CSS_DIR)) {
        const cssFiles = fs.readdirSync(CSS_DIR)
            .filter(f => f.endsWith('.css') && !f.endsWith('.min.css'))
            .map(f => path.join(CSS_DIR, f));

        for (const file of cssFiles) {
            minifyCssFile(file);
        }
    }

    if (fs.existsSync(JS_DIR)) {
        const jsFiles = fs.readdirSync(JS_DIR)
            .filter(f => f.endsWith('.js') && !f.endsWith('.min.js'))
            .map(f => path.join(JS_DIR, f));

        for (const file of jsFiles) {
            await minifyJsFile(file);
        }
    }
    console.log('--- Build Complete ---\n');
}

/**
 * Watch mode: Monitor directories for changes to raw files
 */
function watch() {
    buildAll().then(() => {
        console.log('Watching for changes in public/css and public/js... (Press Ctrl+C to stop)\n');

        const debounceTimers = new Map();

        const triggerRebuild = (dir, filename) => {
            if (!filename || filename.includes('.min.')) return;
            const fullPath = path.join(dir, filename);
            if (!fs.existsSync(fullPath)) return;

            const key = fullPath;
            if (debounceTimers.has(key)) {
                clearTimeout(debounceTimers.get(key));
            }

            debounceTimers.set(key, setTimeout(async () => {
                debounceTimers.delete(key);
                if (filename.endsWith('.css')) {
                    console.log(`\nDetected change: ${filename}`);
                    minifyCssFile(fullPath);
                } else if (filename.endsWith('.js')) {
                    console.log(`\nDetected change: ${filename}`);
                    await minifyJsFile(fullPath);
                }
            }, 100));
        };

        if (fs.existsSync(CSS_DIR)) {
            fs.watch(CSS_DIR, (eventType, filename) => triggerRebuild(CSS_DIR, filename));
        }

        if (fs.existsSync(JS_DIR)) {
            fs.watch(JS_DIR, (eventType, filename) => triggerRebuild(JS_DIR, filename));
        }
    });
}

// Entrypoint
if (process.argv.includes('--watch')) {
    watch();
} else {
    buildAll();
}
