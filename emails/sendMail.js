const nodemailer = require("nodemailer");
const {
  createResetEmailTemplate,
  createWelcomeEmailTemplate,
} = require("./emailTemplates");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  try {
    // Use await to send the email and wait for the result
    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
    });
    console.log(`Email sent: ${info.response}`);
  } catch (error) {
    console.log(error);
  }
};

const sendWelcomeEmail = ({ fullName, clientUrl, email }) => {
  const subject = "Welcome to MB Events";
  const html = createWelcomeEmailTemplate(fullName, clientUrl);

  sendEmail({ to: email, subject, html });
};
const sendResetPasswordEmail = ({ fullName, resetUrl, email }) => {
  const subject = "Reset Password";
  html = createResetEmailTemplate(fullName, resetUrl);

  sendEmail({ to: email, subject, html });
};
module.exports = { sendWelcomeEmail, sendResetPasswordEmail };
