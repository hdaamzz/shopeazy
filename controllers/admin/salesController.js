const Order = require('../../models/user/userOrders');
const Excel = require('exceljs');
const PdfPrinter = require('pdfmake');
const { HTTP_STATUS } = require('../../utils/constants');

// Constants
const REPORT_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    CUSTOM: 'custom'
};

const PDF_FONTS = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

const loadSales = async (req, res) => {
    try {
        let { reportType, startDate, endDate } = req.query;

        startDate = Array.isArray(startDate) ? startDate[0] : startDate;
        endDate = Array.isArray(endDate) ? endDate[0] : endDate;

        const query = buildDateQuery(reportType, startDate, endDate);
        const orders = await Order.find(query);

        res.render('salesreport', { orders });
    } catch (error) {
        console.error('Error loading sales report:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).send('An error occurred while loading sales data');
    }
};

const downloadPDF = async (req, res) => {
    try {
        let { reportType, startDate, endDate } = req.query;

        startDate = Array.isArray(startDate) ? startDate[0] : startDate;
        endDate = Array.isArray(endDate) ? endDate[0] : endDate;

        const query = buildDateQuery(reportType, startDate, endDate);
        const orders = await Order.find(query);

        const { orderRows, grandTotal, grandDiscount } = processOrderData(orders);

        const docDefinition = createPdfDocDefinition(
            reportType,
            startDate,
            endDate,
            orderRows,
            grandTotal,
            grandDiscount
        );

        const printer = new PdfPrinter(PDF_FONTS);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).send('An error occurred while generating the PDF');
    }
};


const downloadExcel = async (req, res) => {
    try {
        let { reportType, startDate, endDate } = req.query;

        startDate = Array.isArray(startDate) ? startDate[0] : startDate;
        endDate = Array.isArray(endDate) ? endDate[0] : endDate;

        const query = buildDateQuery(reportType, startDate, endDate);
        const orders = await Order.find(query);

        const workbook = createExcelWorkbook(reportType, startDate, endDate, orders);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).send('An error occurred while generating the Excel file');
    }
};


function buildDateQuery(reportType, startDate, endDate) {
    if (reportType === REPORT_TYPES.CUSTOM && startDate && endDate) {
        return buildCustomDateQuery(startDate, endDate);
    }

    return buildPredefinedDateQuery(reportType);
}

function buildCustomDateQuery(startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
    }

    return { created_at: { $gte: start, $lte: end } };
}

function buildPredefinedDateQuery(reportType) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate;

    switch (reportType) {
        case REPORT_TYPES.DAILY:
            startDate = today;
            break;
        case REPORT_TYPES.WEEKLY:
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
        case REPORT_TYPES.MONTHLY:
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
        case REPORT_TYPES.YEARLY:
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        default:
            return {};
    }

    return { created_at: { $gte: startDate } };
}

function processOrderData(orders) {
    let grandTotal = 0;
    let grandDiscount = 0;

    const orderRows = orders.map(order => {
        grandTotal += order.total_amount;
        grandDiscount += order.discount;

        return [
            order.order_id,
            new Date(order.created_at).toLocaleDateString(),
            order.items.map(item => item.quantity).join(', '),
            order.items.map(item => item.price).join(', '),
            order.total_amount.toFixed(2),
            order.discount > 0 ? 'Applied' : 'Not Applied',
            order.discount > 0 ? order.discount.toFixed(2) : '0.00'
        ];
    });

    return { orderRows, grandTotal, grandDiscount };
}


function createPdfDocDefinition(reportType, startDate, endDate, orderRows, grandTotal, grandDiscount) {
    const content = [
        { text: 'Sales Report', style: 'header' },
        { text: `Report Type: ${reportType}`, style: 'subheader' }
    ];

    if (reportType === REPORT_TYPES.CUSTOM) {
        content.push({ text: `Date Range: ${startDate} to ${endDate}`, style: 'subheader' });
    }

    const grandTotalRow = [
        { text: 'Grand Total', colSpan: 4, alignment: 'right', bold: true },
        {}, {}, {},
        { text: grandTotal.toFixed(2), bold: true },
        { text: 'Total Discount', bold: true },
        { text: grandDiscount.toFixed(2), bold: true }
    ];

    content.push({
        table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
                ['Order ID', 'Date', 'Items', 'Price', 'Total Amount', 'Coupon Deduction', 'Discount'],
                ...orderRows,
                grandTotalRow
            ]
        }
    });

    return {
        content,
        defaultStyle: {
            font: 'Helvetica'
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 0, 0, 5]
            }
        }
    };
}


function createExcelWorkbook(reportType, startDate, endDate, orders) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.addRow(['Sales Report']);
    worksheet.addRow(['Report Type:', reportType]);
    if (reportType === REPORT_TYPES.CUSTOM) {
        worksheet.addRow(['Date Range:', `${startDate} to ${endDate}`]);
    }
    worksheet.addRow([]);

    worksheet.addRow(['Order ID', 'Date', 'Items', 'Price', 'Total Amount', 'Coupon Deduction', 'Discount']);

    let grandTotal = 0;
    let grandDiscount = 0;

    orders.forEach(order => {
        worksheet.addRow([
            order.order_id,
            new Date(order.created_at).toLocaleDateString(),
            order.items.map(item => item.quantity).join(', '),
            order.items.map(item => item.price).join(', '),
            order.total_amount,
            order.discount > 0 ? 'Applied' : 'Not Applied',
            order.discount > 0 ? order.discount : '0.00'
        ]);
        grandTotal += order.total_amount;
        grandDiscount += order.discount;
    });

    worksheet.addRow([
        'Grand Total', '', '', '',
        grandTotal.toFixed(2), 'Total Discount', grandDiscount.toFixed(2)
    ]);

    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(5).font = { bold: true };
    worksheet.getRow(worksheet.rowCount).font = { bold: true };
    worksheet.columns.forEach(column => {
        column.width = 15;
    });

    return workbook;
}

module.exports = {
    loadSales,
    downloadPDF,
    downloadExcel
};
