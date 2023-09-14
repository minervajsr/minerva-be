// email.js

const nodemailer = require("nodemailer");
const fs = require("fs");
const crypto = require("crypto");
const OTPModel = require("../models/OTPModel");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmailNotification = (userEmail, senderNamesArray, messagesArray) => {
  console.log(
    "Sending email notification to:",
    userEmail,
    senderNamesArray,
    messagesArray
  );
  console.log("-----------------------------------------");

  fs.readFile(
    "./templates/message_notification.html",
    "utf8",
    (err, template) => {
      if (err) {
        console.error("Error reading email template:", err);
        return;
      }
      const messageCount = senderNamesArray.length;
      const messageContent =
        messagesArray.length > 1
          ? messagesArray
              .map((message, i) => {
                return `
            <br>
            
            <p style="font-size: 16px; color: #38486e;">
              New message from <strong>${senderNamesArray[i]}</strong>:
            </p>
            <p style="font-size: 16px; color: #38486e; font-style: italic;">
              "${message.message}"
            </p><br>
          `;
              })
              .join("")
          : ` <br><p style="font-size: 16px; color: #38486e; font-style: italic;">
          "${message.message}"
        </p><br>`;

      template = template.replace("{{messageCount}}", messageCount.toString());
      template = template.replace(
        "{{messageContent}}",
        messageContent.toString()
      );

      const mailOptions = {
        from: `"Minerva Trusted Connections" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: "💌 New Chat Alert: You've Got Messages! 🎉",
        html: template,
      };

      console.log("HTML:", template);

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info);
        }
      });
    }
  );
};

const sendPasswordResetEmail = (userEmail, resetPasswordLink) => {
  fs.readFile("./templates/password_reset.html", "utf8", (err, template) => {
    if (err) {
      console.error("Error reading email template:", err);
      return;
    }

    template = template.replace(
      "[Password Reset URL]",
      resetPasswordLink.toString()
    );

    const mailOptions = {
      from: `"Minerva Trusted Connections" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "Your Password Reset Link Is Ready – Take Action! 🔑",
      html: template,
    };

    // console.log("HTML:", template);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info);
      }
    });
  });
};

const jobApplicationEmail = (
  userName,
  userEmail,
  jobTitle,
  jobCompany,
  jobLocation,
  jobLink
) => {
  fs.readFile("./templates/job_application.html", "utf8", (err, template) => {
    if (err) {
      console.error("Error reading email template:", err);
      return;
    }

    template = template.replace("[User's Name]", userName.toString());

    template = template.replace("[Job Title]", jobTitle.toString());
    template = template.replace("[Job Company]", jobCompany.toString());
    template = template.replace("[Job Location]", jobLocation.toString());
    template = template.replace("[Job Details Page URL]", jobLink.toString());

    const mailOptions = {
      from: `"Minerva Trusted Connections" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "Your Job Application Has Been Submitted! 🎉",
      html: template,
    };

    console.log("HTML:", template);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info);
      }
    });
  });
};

const sendEmailOTPForVerification = async (userEmail) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto
    .createHmac("sha256", process.env.EMAIL_SECRET)
    .update(otp)
    .digest("hex");

  await OTPModel.create({
    email: userEmail,
    otp: hashedOTP,
  });

  console.log("OTP:", otp);

  fs.readFile(
    "./templates/email_verification.html",
    "utf8",
    (err, template) => {
      if (err) {
        console.error("Error reading email template:", err);
        return;
      }

      template = template.replace("[OTP]", otp.toString());
      template = template.replace("[FULL_HASH]", hashedOTP.toString());

      const mailOptions = {
        from: `"Minerva Trusted Connections" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: "Your OTP for Email Verification",
        html: template,
      };

      console.log("HTML:", template);

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info);
        }
      });
    }
  );
};

module.exports = {
  sendEmailNotification,
  sendPasswordResetEmail,
  jobApplicationEmail,
  sendEmailOTPForVerification,
  transporter,
};
