import "dotenv/config";

export const MailConfigs = {
  SMTP_HOST: process.env.SMTP_HOST as string,
  SMTP_PORT: process.env.SMTP_PORT as string,
  SMTP_SERVICE: process.env.SMTP_SERVICE as string,
  SMTP_SENDER_MAIL: process.env.SMTP_MAIL as string,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD as string,
};
