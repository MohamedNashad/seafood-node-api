import { MailConfigs } from "../configs/mail_configs";

const nodemailer = require("nodemailer");

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendContentWithMail = async (options: EmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: MailConfigs.SMTP_HOST,
    port: MailConfigs.SMTP_PORT,
    service: MailConfigs.SMTP_SERVICE,
    auth: {
      user: MailConfigs.SMTP_SENDER_MAIL,
      pass: MailConfigs.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: MailConfigs.SMTP_SENDER_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", options.email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
