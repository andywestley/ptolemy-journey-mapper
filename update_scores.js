const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, 'pb_public', 'samples');
const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.ojf'));

for (const file of files) {
    const filePath = path.join(samplesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    let updated = false;

    if (data.nodes) {
        data.nodes.forEach(n => {
            // 1. Shift scores if they look like the old 1-10 scale
            // If any score is > 5, it definitely needs shifting.
            // If all scores are <= 5, but some are > 0 and the file hasn't been touched, it's ambiguous.
            // However, the new scale is -5 to 5. 0 is the default.
            // The 3 I updated before now have scores like -2, -3, 0, 1, 2, 3, 4, 5.
            // The 3 I didn't update have scores like 7, 8, 9, 10.

            // Heuristic: If any node has a score > 5, shift the whole file.
            const needsShift = data.nodes.some(node => node.score > 5);

            if (needsShift) {
                data.nodes.forEach(node => {
                    if (node.score !== undefined && node.score !== null) {
                        node.score = node.score - 5;
                    }
                });
                updated = true;
            }

            // 2. Update descriptions to say "Emotion score" instead of "emotional score" or "score"
            if (n.description && n.description.toLowerCase().includes('score')) {
                n.description = n.description.replace(/emotional score/gi, 'Emotion score');
                n.description = n.description.replace(/emotional arc/gi, 'Emotion arc');
                n.description = n.description.replace(/\bscore value\b/gi, 'Emotion score');
            }
        });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Verified/Updated ${file}`);
}
