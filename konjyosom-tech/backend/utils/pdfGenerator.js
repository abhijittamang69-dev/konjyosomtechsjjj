const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateServiceReport = async (workOrder, technician, companySettings) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const filename = `report-${workOrder.workOrderId}-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../uploads/reports', filename);

      // Ensure directory exists
      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).text('SERVICE REPORT', 50, 50);
      doc.fontSize(12).text(`Konjyosom Tech Solutions Pvt. Ltd.`, 50, 80);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 95);

      doc.moveTo(50, 120).lineTo(550, 120).stroke();

      // Work Order Details
      doc.fontSize(14).text('Work Order Details', 50, 140);
      doc.fontSize(11).text(`Work Order ID: ${workOrder.workOrderId}`, 50, 165);
      doc.text(`Service Type: ${workOrder.serviceType}`, 50, 185);
      doc.text(`Priority: ${workOrder.priority}`, 50, 205);
      doc.text(`Status: ${workOrder.status}`, 50, 225);

      // Customer Details
      doc.fontSize(14).text('Customer Information', 50, 260);
      doc.fontSize(11).text(`Name: ${workOrder.customerName}`, 50, 285);
      doc.text(`Phone: ${workOrder.customerPhone || 'N/A'}`, 50, 305);
      doc.text(`Email: ${workOrder.customerEmail || 'N/A'}`, 50, 325);
      doc.text(`Location: ${workOrder.location}`, 50, 345);

      // Technician Details
      doc.fontSize(14).text('Technician Information', 50, 380);
      doc.fontSize(11).text(`Name: ${technician.name}`, 50, 405);
      doc.text(`Email: ${technician.email}`, 50, 425);

      // Service Notes
      doc.fontSize(14).text('Service Notes', 50, 460);
      doc.fontSize(11).text(workOrder.serviceNotes || 'No notes provided', 50, 485, { width: 500 });

      // Materials Used
      if (workOrder.materialsUsed && workOrder.materialsUsed.length > 0) {
        doc.fontSize(14).text('Materials Used', 50, 520);
        let y = 545;
        workOrder.materialsUsed.forEach((material, index) => {
          doc.fontSize(11).text(`${index + 1}. ${material.name} - Qty: ${material.quantity} - Cost: Rs. ${material.cost}`, 50, y);
          y += 20;
        });
      }

      // Labor Hours
      if (workOrder.laborHours) {
        doc.fontSize(14).text('Labor', 50, 600);
        doc.fontSize(11).text(`Total Hours: ${workOrder.laborHours}`, 50, 625);
      }

      // Signature Section
      doc.addPage();
      doc.fontSize(18).text('Customer Acknowledgment', 50, 50);
      doc.fontSize(12).text('I confirm that the service has been completed to my satisfaction.', 50, 80);

      if (workOrder.customerSignature) {
        // Add signature image
        try {
          const signatureBuffer = Buffer.from(workOrder.customerSignature.split(',')[1], 'base64');
          doc.image(signatureBuffer, 50, 120, { width: 200 });
        } catch (e) {
          doc.text('[Signature captured]', 50, 120);
        }
      }

      doc.fontSize(11).text(`Signed By: ${workOrder.signedBy || 'Customer'}`, 50, 200);
      doc.text(`Date: ${workOrder.signatureDate ? new Date(workOrder.signatureDate).toLocaleDateString() : 'N/A'}`, 50, 220);

      // Footer
      doc.fontSize(10).text('Thank you for choosing Konjyosom Tech Solutions Pvt. Ltd.', 50, 700, { align: 'center' });
      doc.text('For support: support@konjyosomtech.com | Phone: +977-XXXXXXXXXX', 50, 715, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ filename, filepath, url: `/uploads/reports/${filename}` });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateServiceReport };
