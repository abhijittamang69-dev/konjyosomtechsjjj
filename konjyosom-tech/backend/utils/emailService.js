// Email service disabled — Resend integration removed.
// sendEmail is kept as a safe no-op so existing controller calls do not break.
const sendEmail = async ({ to, subject, html, text } = {}) => {
  console.log(`Email skipped (service disabled): "${subject}"${to ? ` -> ${to}` : ''}`);
  return { success: false, error: 'Email service disabled' };
};

const emailTemplates = {
  bookingConfirmation: (booking) => ({
    subject: `Booking Confirmation - ${booking.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276;">Booking Confirmation</h2>
        <p>Dear ${booking.name},</p>
        <p>Thank you for booking a service with Konjyosom Tech Solutions. Your booking has been received.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p><strong>Service Type:</strong> ${booking.serviceType}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Preferred Date:</strong> ${booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'Not specified'}</p>
          <p><strong>Status:</strong> ${booking.status}</p>
        </div>
        <p>We will contact you shortly to confirm the details.</p>
        <p>Best regards,<br>Konjyosom Tech Solutions Team</p>
      </div>
    `
  }),

  quotationConfirmation: (quotation) => ({
    subject: `Quotation Request Received - ${quotation.quotationId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276;">Quotation Request Received</h2>
        <p>Dear ${quotation.name},</p>
        <p>Thank you for requesting a quotation. We have received your request and will review it shortly.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Quotation ID:</strong> ${quotation.quotationId}</p>
          <p><strong>Project Type:</strong> ${quotation.projectType}</p>
          <p><strong>Location:</strong> ${quotation.location || 'Not specified'}</p>
          <p><strong>Status:</strong> ${quotation.status}</p>
        </div>
        <p>Our team will prepare a detailed quotation and send it to you within 24-48 hours.</p>
        <p>Best regards,<br>Konjyosom Tech Solutions Team</p>
      </div>
    `
  }),

  jobAssignment: (workOrder, technician) => ({
    subject: `New Job Assigned - ${workOrder.workOrderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276;">New Job Assignment</h2>
        <p>Hello ${technician.name},</p>
        <p>You have been assigned a new work order. Please review the details below:</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Work Order ID:</strong> ${workOrder.workOrderId}</p>
          <p><strong>Customer:</strong> ${workOrder.customerName}</p>
          <p><strong>Service Type:</strong> ${workOrder.serviceType}</p>
          <p><strong>Location:</strong> ${workOrder.location}</p>
          <p><strong>Priority:</strong> ${workOrder.priority}</p>
          <p><strong>Due Date:</strong> ${workOrder.dueDate ? new Date(workOrder.dueDate).toLocaleDateString() : 'Not specified'}</p>
        </div>
        <p>Please accept or reject this assignment through your technician portal.</p>
        <p>Best regards,<br>Konjyosom Tech Solutions Team</p>
      </div>
    `
  }),

  serviceReport: (workOrder, reportUrl) => ({
    subject: `Service Report - ${workOrder.workOrderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276;">Service Completion Report</h2>
        <p>Dear ${workOrder.customerName},</p>
        <p>Your service request has been completed. Please find the service report details below:</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Work Order ID:</strong> ${workOrder.workOrderId}</p>
          <p><strong>Service Type:</strong> ${workOrder.serviceType}</p>
          <p><strong>Completed On:</strong> ${new Date(workOrder.completedAt).toLocaleDateString()}</p>
          <p><strong>Service Notes:</strong> ${workOrder.serviceNotes || 'N/A'}</p>
        </div>
        <p>Thank you for choosing Konjyosom Tech Solutions.</p>
        <p>Best regards,<br>Konjyosom Tech Solutions Team</p>
      </div>
    `
  }),

  passwordReset: (user, tempPassword) => ({
    subject: 'Password Reset - Konjyosom Tech Solutions',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276;">Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>Your password has been reset by the administrator.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Your temporary password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
        <p>Please login and change your password immediately.</p>
        <p>Best regards,<br>Konjyosom Tech Solutions Team</p>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
