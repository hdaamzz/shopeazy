const { HTTP_STATUS } = require('../../../utils/constants');
const Orders = require('../../../models/user/userOrders');
const PDFDocument = require('pdfkit');

const downloadInvoice = async (req, res) => {
  try {
    const { orderId, itemId } = req.query;

    const order = await Orders.findOne({ order_id: orderId }).populate('items.product_id');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).send('Order not found');
    }

    const orderItem = order.items.find((item) => item._id.equals(itemId));

    if (!orderItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).send('Item not found');
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${order.order_id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text('ShopEazy', { align: 'right' });
    doc.moveDown();

    doc.fontSize(18).text('Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Invoice Number: INV-${order._id.toString().slice(-6)}`, { align: 'left' });
    doc.text(`Order ID: ${order.order_id}`, { align: 'left' });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, {
      align: 'left'
    });
    doc.moveDown();

    doc.text('Ship to:', { align: 'left' });
    doc.text(`${order.address_id.name}`, { align: 'left' });
    doc.text(`${order.address_id.address}`, { align: 'left' });
    doc.text(
      `${order.address_id.town_city}, ${order.address_id.state} - ${order.address_id.pin_code}`,
      { align: 'left' }
    );
    doc.moveDown();

    const table = {
      headers: ['Product', 'Quantity', 'Price', 'Total'],
      rows: [
        [
          orderItem.name,
          orderItem.quantity.toString(),
          `₹${orderItem.price.toFixed(2)}`,
          `₹${orderItem.total.toFixed(2)}`
        ]
      ]
    };

    const startX = 50;
    const startY = 300;
    const rowHeight = 30;
    const colWidth = (doc.page.width - 100) / 4;

    doc.font('Helvetica-Bold');
    table.headers.forEach((header, i) => {
      doc.text(header, startX + i * colWidth, startY, { width: colWidth, align: 'left' });
    });

    doc.font('Helvetica');
    table.rows.forEach((row, i) => {
      const y = startY + (i + 1) * rowHeight;
      row.forEach((cell, j) => {
        doc.text(cell, startX + j * colWidth, y, { width: colWidth, align: 'left' });
      });
    });

    doc.moveDown(3);
    doc.text(`Subtotal: ₹${orderItem.total.toFixed(2)}`, { align: 'right' });
    doc.text(`Shipping: ₹${order.shipping_cost.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax: ₹${order.tax.toFixed(2)}`, { align: 'right' });
    doc.text(`Discount: ₹${order.discount.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold');
    doc.text(
      `Total: ₹${(
        orderItem.total +
        order.shipping_cost +
        order.tax -
        order.discount
      ).toFixed(2)}`,
      { align: 'right' }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Error generating invoice');
  }
};

module.exports = {
  downloadInvoice
};
