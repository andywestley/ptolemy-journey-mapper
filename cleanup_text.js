const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, 'pb_public', 'samples');
const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.ojf'));

for (const file of files) {
    const filePath = path.join(samplesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace terminology
    content = content.replace(/emotional score/gi, 'Emotion score');
    content = content.replace(/ \bscore\b /gi, ' Emotion score '); // match ' score '
    content = content.replace(/'Score'/g, "'Emotion score'");
    content = content.replace(/"Score"/g, '"Emotion score"');
    content = content.replace(/1-10/g, '-5 to +5');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Cleaned up text in ${file}`);
}
