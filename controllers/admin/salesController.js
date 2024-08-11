const Order = require('../../models/user/userOrders');
const Excel = require('exceljs');
const PdfPrinter = require('pdfmake');



const loadSales = async (req, res) => {
    try {
        let { reportType, startDate, endDate } = req.query;
        let query = {};
        
        if (Array.isArray(startDate)) {
            startDate = startDate[0];
        }
        if (Array.isArray(endDate)) {
            endDate = endDate[0];
        }
       
        if (reportType === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);  

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }

            query.created_at = { $gte: start, $lte: end };
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (reportType) {
                case 'daily':
                    query.created_at = { $gte: today };
                    break;
                case 'weekly':
                    const oneWeekAgo = new Date(today);
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    query.created_at = { $gte: oneWeekAgo };
                    break;
                case 'monthly':
                    const oneMonthAgo = new Date(today);
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    query.created_at = { $gte: oneMonthAgo };
                    break;
                case 'yearly':
                    const oneYearAgo = new Date(today);
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    query.created_at = { $gte: oneYearAgo };
                    break;
                default:
                   
                    break;
            }
        }

        const orders = await Order.find(query);
        res.render('salesreport', { orders });
    } catch (error) {
        console.error('Error in loadSales:', error.message);
        res.status(500).send('An error occurred while loading sales data');
    }
};


const downloadPDF = async (req, res) => {
    try {
        let { reportType, startDate, endDate } = req.query;
        let query = {};
        
        if (Array.isArray(startDate)) {
            startDate = startDate[0];
        }
        if (Array.isArray(endDate)) {
            endDate = endDate[0];
        }
       
        if (reportType === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);  

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }

            query.created_at = { $gte: start, $lte: end };
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (reportType) {
                case 'daily':
                    query.created_at = { $gte: today };
                    break;
                case 'weekly':
                    const oneWeekAgo = new Date(today);
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    query.created_at = { $gte: oneWeekAgo };
                    break;
                case 'monthly':
                    const oneMonthAgo = new Date(today);
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    query.created_at = { $gte: oneMonthAgo };
                    break;
                case 'yearly':
                    const oneYearAgo = new Date(today);
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    query.created_at = { $gte: oneYearAgo };
                    break;
                default:
                    break;
            }
        }

        const orders = await Order.find(query);

        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };

        const printer = new PdfPrinter(fonts);

        const docDefinition = {
            content: [
                { text: 'Sales Report', style: 'header' },
                { text: `Report Type: ${reportType}`, style: 'subheader' },
                reportType === 'custom' ? { text: `Date Range: ${startDate} to ${endDate}`, style: 'subheader' } : {},
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['Order ID', 'Date', 'Items', 'Price', 'Total Amount', 'Coupon Deduction', 'Discount'],
                            ...orders.map(order => [
                                order.order_id,
                                new Date(order.created_at).toLocaleDateString(),
                                order.items.map(item => item.quantity).join(', '),
                                order.items.map(item => item.price).join(', '),
                                order.total_amount,
                                order.discount > 0 ? 'Applied' : 'Not Applied',
                                order.discount > 0 ? order.discount : '0.00'
                            ])
                        ]
                    }
                }
            ],
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

        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF');
    }
};



const downloadExcel = async (req, res) => {
    try {
        let { reportType, startDate, endDate } = req.query;
        let query = {};
        
        if (Array.isArray(startDate)) {
            startDate = startDate[0];
        }
        if (Array.isArray(endDate)) {
            endDate = endDate[0];
        }
       
        if (reportType === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);  

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }

            query.created_at = { $gte: start, $lte: end };
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (reportType) {
                case 'daily':
                    query.created_at = { $gte: today };
                    break;
                case 'weekly':
                    const oneWeekAgo = new Date(today);
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    query.created_at = { $gte: oneWeekAgo };
                    break;
                case 'monthly':
                    const oneMonthAgo = new Date(today);
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    query.created_at = { $gte: oneMonthAgo };
                    break;
                case 'yearly':
                    const oneYearAgo = new Date(today);
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    query.created_at = { $gte: oneYearAgo };
                    break;
                default:
                    break;
            }
        }

        const orders = await Order.find(query);

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.addRow(['Sales Report']);
        worksheet.addRow(['Report Type:', reportType]);
        if (reportType === 'custom') {
            worksheet.addRow(['Date Range:', `${startDate} to ${endDate}`]);
        }
        worksheet.addRow([]);  

        worksheet.addRow(['Order ID', 'Date', 'Items', 'Price', 'Total Amount', 'Coupon Deduction', 'Discount']);

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
        });

        worksheet.getRow(1).font = { bold: true, size: 16 };
        worksheet.getRow(5).font = { bold: true };
        worksheet.columns.forEach(column => {
            column.width = 15;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('An error occurred while generating the Excel file');
    }
};


module.exports = {
    loadSales,
    downloadPDF,
    downloadExcel
};