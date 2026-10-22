const ExcelJS = require('exceljs');
const db = require('./db');

// Passwords are never exported, and product photos are left out because they are huge.
const EXPORTS = {
    orders: {
        title: 'Orders',
        sql: `SELECT o.order_no, o.created_at, o.customer_name, o.customer_mobile,
                (SELECT GROUP_CONCAT(oi.product_name || ' x' || oi.qty, ', ') FROM order_items oi WHERE oi.order_id = o.id) AS products,
                (SELECT COALESCE(SUM(oi.qty), 0) FROM order_items oi WHERE oi.order_id = o.id) AS units,
                o.total, p.mode AS payment_mode, p.status AS payment_status, p.reference AS payment_reference, o.status
              FROM orders o LEFT JOIN payments p ON p.order_id = o.id
              ORDER BY o.id DESC`,
        columns: [
            { header: 'Order No', key: 'order_no', width: 14 },
            { header: 'Date & Time (IST)', key: 'created_at', width: 18, stamp: true },
            { header: 'Customer', key: 'customer_name', width: 22 },
            { header: 'Mobile', key: 'customer_mobile', width: 14 },
            { header: 'Products', key: 'products', width: 45 },
            { header: 'Units', key: 'units', width: 8 },
            { header: 'Total (Rs)', key: 'total', width: 14, money: true },
            { header: 'Payment Mode', key: 'payment_mode', width: 14 },
            { header: 'Payment Status', key: 'payment_status', width: 15 },
            { header: 'Payment Ref', key: 'payment_reference', width: 18 },
            { header: 'Order Status', key: 'status', width: 13 }
        ]
    },
    order_items: {
        title: 'Order Items',
        sql: `SELECT o.order_no, o.created_at, o.customer_name, oi.product_name, oi.unit_price, oi.qty, oi.subtotal
              FROM order_items oi JOIN orders o ON o.id = oi.order_id
              ORDER BY o.id DESC, oi.id`,
        columns: [
            { header: 'Order No', key: 'order_no', width: 14 },
            { header: 'Date & Time (IST)', key: 'created_at', width: 18, stamp: true },
            { header: 'Customer', key: 'customer_name', width: 22 },
            { header: 'Product', key: 'product_name', width: 30 },
            { header: 'Unit Price (Rs)', key: 'unit_price', width: 15, money: true },
            { header: 'Qty', key: 'qty', width: 8 },
            { header: 'Subtotal (Rs)', key: 'subtotal', width: 15, money: true }
        ]
    },
    payments: {
        title: 'Payments',
        sql: `SELECT o.order_no, p.created_at, o.customer_name, p.mode, p.amount, p.status, p.reference
              FROM payments p JOIN orders o ON o.id = p.order_id
              ORDER BY p.id DESC`,
        columns: [
            { header: 'Order No', key: 'order_no', width: 14 },
            { header: 'Date & Time (IST)', key: 'created_at', width: 18, stamp: true },
            { header: 'Customer', key: 'customer_name', width: 22 },
            { header: 'Payment Mode', key: 'mode', width: 14 },
            { header: 'Amount (Rs)', key: 'amount', width: 14, money: true },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Reference', key: 'reference', width: 18 }
        ]
    },
    customers: {
        title: 'Customers',
        sql: `SELECT c.name, c.mobile, c.email, c.created_at, COUNT(o.id) AS orders, COALESCE(SUM(o.total), 0) AS spent
              FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
              GROUP BY c.id ORDER BY c.id DESC`,
        columns: [
            { header: 'Name', key: 'name', width: 24 },
            { header: 'Mobile', key: 'mobile', width: 14 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Registered On (IST)', key: 'created_at', width: 18, stamp: true },
            { header: 'Total Orders', key: 'orders', width: 13 },
            { header: 'Total Spent (Rs)', key: 'spent', width: 16, money: true }
        ]
    },
    admins: {
        title: 'Admin Users',
        sql: `SELECT name, mobile, email,
                CASE status WHEN 'active' THEN 'Enabled' ELSE 'Disabled' END AS status, created_at
              FROM staff WHERE role = 'admin' ORDER BY id DESC`,
        columns: [
            { header: 'Name', key: 'name', width: 24 },
            { header: 'Mobile', key: 'mobile', width: 14 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created On (IST)', key: 'created_at', width: 18, stamp: true }
        ]
    },
    products: {
        title: 'Products & Stock',
        sql: `SELECT p.name, p.description, p.unit, p.price, p.margin,
                ROUND(p.price * (1 + p.margin / 100.0), 2) AS final_price, p.stock,
                COALESCE((SELECT SUM(oi.qty) FROM order_items oi WHERE oi.product_id = p.id), 0) AS sold
              FROM products p ORDER BY p.id`,
        columns: [
            { header: 'Product', key: 'name', width: 30 },
            { header: 'Description', key: 'description', width: 50 },
            { header: 'Unit', key: 'unit', width: 12 },
            { header: 'Base Price (Rs)', key: 'price', width: 15, money: true },
            { header: 'Margin (%)', key: 'margin', width: 11 },
            { header: 'Final Price (Rs)', key: 'final_price', width: 16, money: true },
            { header: 'Stock Balance', key: 'stock', width: 14 },
            { header: 'Units Sold', key: 'sold', width: 12 }
        ]
    },
    expenses: {
        title: 'Expenses',
        sql: `SELECT date, category, description, amount FROM expenses ORDER BY date DESC, id DESC`,
        columns: [
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Category', key: 'category', width: 16 },
            { header: 'Description', key: 'description', width: 45 },
            { header: 'Amount (Rs)', key: 'amount', width: 14, money: true }
        ]
    },
    purchases: {
        title: 'Purchases',
        sql: `SELECT date, supplier, item, qty, amount, gst_percent, gst_amount, total
              FROM purchases ORDER BY date DESC, id DESC`,
        columns: [
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Supplier', key: 'supplier', width: 24 },
            { header: 'Item', key: 'item', width: 26 },
            { header: 'Qty', key: 'qty', width: 8 },
            { header: 'Amount before GST (Rs)', key: 'amount', width: 22, money: true },
            { header: 'GST (%)', key: 'gst_percent', width: 9 },
            { header: 'GST Amount (Rs)', key: 'gst_amount', width: 16, money: true },
            { header: 'Total (Rs)', key: 'total', width: 14, money: true }
        ]
    }
};

// Timestamps are stored in UTC; show them in Indian time
function istStamp(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(d);
    const g = t => parts.find(p => p.type === t).value;
    return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}`;
}

function getRows(def) {
    return db.prepare(def.sql).all().map(row => {
        def.columns.forEach(c => { if (c.stamp) row[c.key] = istStamp(row[c.key]); });
        return row;
    });
}

// ---------- CSV ----------
function csvCell(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return String(v);
    let s = String(v);
    // A cell starting with = + - @ can run as a formula when opened in Excel, so force it to plain text
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(def) {
    const lines = [def.columns.map(c => csvCell(c.header)).join(',')];
    getRows(def).forEach(r => lines.push(def.columns.map(c => csvCell(r[c.key])).join(',')));
    return '\uFEFF' + lines.join('\r\n') + '\r\n'; // BOM so Excel reads special characters correctly
}

// ---------- Excel (one sheet per table) ----------
async function buildWorkbook(keys = Object.keys(EXPORTS)) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Bhatts Organic Food and Spices';
    wb.created = new Date();

    for (const key of keys) {
        const def = EXPORTS[key];
        const ws = wb.addWorksheet(def.title);
        ws.columns = def.columns.map(c => ({ header: c.header, key: c.key, width: c.width || 16 }));
        ws.addRows(getRows(def));

        def.columns.forEach((c, i) => {
            if (!c.money) return;
            ws.eachRow((row, n) => { if (n > 1) row.getCell(i + 1).numFmt = '#,##0.00'; });
        });

        const header = ws.getRow(1);
        header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: def.columns.length } };
    }
    return wb;
}

module.exports = { EXPORTS, toCsv, buildWorkbook };