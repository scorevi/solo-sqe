// Email notification utility
// In a production environment, you would integrate with services like:
// - SendGrid
// - Amazon SES
// - Nodemailer with SMTP
// - Resend
// - Mailgun

interface EmailTemplate {
  to: string
  subject: string
  html: string
}

interface BookingDetails {
  userName: string
  userEmail: string
  labName: string
  computerName?: string
  startTime: string
  endTime: string
  purpose?: string
  status: string
}

export class EmailService {
  private static instance: EmailService
  private isEnabled: boolean

  constructor() {
    // Enable email notifications based on environment variables
    this.isEnabled = process.env.EMAIL_ENABLED === 'true'
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendBookingConfirmation(bookingDetails: BookingDetails): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('Email notifications disabled - would send booking confirmation to:', bookingDetails.userEmail)
      return true
    }

    const email: EmailTemplate = {
      to: bookingDetails.userEmail,
      subject: 'Lab Booking Confirmation - Computer Lab Reservation System',
      html: this.generateBookingConfirmationHTML(bookingDetails)
    }

    return this.sendEmail(email)
  }

  async sendBookingStatusUpdate(bookingDetails: BookingDetails): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`Email notifications disabled - would send status update (${bookingDetails.status}) to:`, bookingDetails.userEmail)
      return true
    }

    const email: EmailTemplate = {
      to: bookingDetails.userEmail,
      subject: `Lab Booking ${bookingDetails.status} - Computer Lab Reservation System`,
      html: this.generateStatusUpdateHTML(bookingDetails)
    }

    return this.sendEmail(email)
  }

  async sendBookingReminder(bookingDetails: BookingDetails): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('Email notifications disabled - would send booking reminder to:', bookingDetails.userEmail)
      return true
    }

    const email: EmailTemplate = {
      to: bookingDetails.userEmail,
      subject: 'Lab Booking Reminder - Computer Lab Reservation System',
      html: this.generateReminderHTML(bookingDetails)
    }

    return this.sendEmail(email)
  }

  private async sendEmail(email: EmailTemplate): Promise<boolean> {
    try {
      // In production, implement actual email sending here
      // Example with SendGrid:
      /*
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      
      await sgMail.send({
        to: email.to,
        from: process.env.FROM_EMAIL,
        subject: email.subject,
        html: email.html
      })
      */

      console.log('Email sent successfully to:', email.to)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  private generateBookingConfirmationHTML(details: BookingDetails): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${details.userName},</p>
            <p>Your computer lab booking has been confirmed! Here are the details:</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Lab:</strong> ${details.labName}</p>
              ${details.computerName ? `<p><strong>Computer:</strong> ${details.computerName}</p>` : ''}
              <p><strong>Date & Time:</strong> ${new Date(details.startTime).toLocaleString()} - ${new Date(details.endTime).toLocaleString()}</p>
              ${details.purpose ? `<p><strong>Purpose:</strong> ${details.purpose}</p>` : ''}
              <p><strong>Status:</strong> ${details.status}</p>
            </div>
            
            <p>Please arrive on time for your scheduled session. If you need to cancel or modify your booking, please log in to the system.</p>
            
            <p>Best regards,<br>Computer Lab Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Computer Lab Reservation System.</p>
          </div>
        </body>
      </html>
    `
  }

  private generateStatusUpdateHTML(details: BookingDetails): string {
    const statusMessage = details.status === 'APPROVED' 
      ? 'Your booking has been approved!' 
      : details.status === 'REJECTED'
      ? 'Unfortunately, your booking has been rejected.'
      : `Your booking status has been updated to ${details.status}.`

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .status-approved { color: #16a34a; font-weight: bold; }
            .status-rejected { color: #dc2626; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${details.userName},</p>
            <p class="${details.status === 'APPROVED' ? 'status-approved' : details.status === 'REJECTED' ? 'status-rejected' : ''}">${statusMessage}</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Lab:</strong> ${details.labName}</p>
              ${details.computerName ? `<p><strong>Computer:</strong> ${details.computerName}</p>` : ''}
              <p><strong>Date & Time:</strong> ${new Date(details.startTime).toLocaleString()} - ${new Date(details.endTime).toLocaleString()}</p>
              ${details.purpose ? `<p><strong>Purpose:</strong> ${details.purpose}</p>` : ''}
              <p><strong>Status:</strong> ${details.status}</p>
            </div>
            
            ${details.status === 'APPROVED' ? 
              '<p>Please arrive on time for your scheduled session. We look forward to seeing you!</p>' :
              '<p>If you have any questions about this decision, please contact the lab administrator.</p>'
            }
            
            <p>Best regards,<br>Computer Lab Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Computer Lab Reservation System.</p>
          </div>
        </body>
      </html>
    `
  }

  private generateReminderHTML(details: BookingDetails): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .reminder { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${details.userName},</p>
            
            <div class="reminder">
              <p><strong>⏰ Reminder:</strong> You have an upcoming computer lab booking!</p>
            </div>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Lab:</strong> ${details.labName}</p>
              ${details.computerName ? `<p><strong>Computer:</strong> ${details.computerName}</p>` : ''}
              <p><strong>Date & Time:</strong> ${new Date(details.startTime).toLocaleString()} - ${new Date(details.endTime).toLocaleString()}</p>
              ${details.purpose ? `<p><strong>Purpose:</strong> ${details.purpose}</p>` : ''}
            </div>
            
            <p>Please make sure to arrive on time. If you can't make it, please cancel your booking to allow others to use the lab.</p>
            
            <p>Best regards,<br>Computer Lab Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Computer Lab Reservation System.</p>
          </div>
        </body>
      </html>
    `
  }
}

export const emailService = EmailService.getInstance()
