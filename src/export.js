const fs = require('fs');
const path = require('path');
const { EXPORTS, toCsv, buildWorkbook } = require('./exporter');

(async () => {
    const day = new Date().toISOString().slice(0, 10);
    const dir = path.join(__dirname, '..', 'exports', day);
    fs.mkdirSync(dir, { recursive: true });

    await (await buildWorkbook()).xlsx.writeFile(path.join(dir, 'bhatts-all-data.xlsx'));
    for (const key of Object.keys(EXPORTS)) {
        fs.writeFileSync(path.join(dir, key + '.csv'), toCsv(EXPORTS[key]), 'utf8');
    }
    console.log('Exported to:', dir);
})();