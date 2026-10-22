const { EXPORTS, toCsv, buildWorkbook } = require('./src/exporter');

// ---------- Export to Excel / CSV (Super Admin only) ----------
app.get('/api/superadmin/export/:name', superOnly, async (req, res, next) => {
    try {
        const name = req.params.name;
        const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
        const day = new Date().toISOString().slice(0, 10);

        if (name === 'all') {
            if (format !== 'xlsx') throw bad('Everything together is available as Excel only');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="bhatts-all-data-${day}.xlsx"`);
            await (await buildWorkbook()).xlsx.write(res);
            return res.end();
        }
        if (!Object.hasOwn(EXPORTS, name)) throw new HttpError(404, 'Unknown export');

        if (format === 'xlsx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="bhatts-${name}-${day}.xlsx"`);
            await (await buildWorkbook([name])).xlsx.write(res);
            return res.end();
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="bhatts-${name}-${day}.csv"`);
        res.send(toCsv(EXPORTS[name]));
    } catch (e) { next(e); }
});