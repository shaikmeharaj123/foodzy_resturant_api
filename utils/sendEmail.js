const nodeMailer = require("nodemailer");
const path = require("path");

const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    secure: true,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    // text: options.message,
    subject: 'Registration approved confirmation',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                background-color: #ffffff;
                margin: 0 auto;
                padding: 20px;
                max-width: 600px;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                background-color: #007bff;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                border-top-left-radius: 5px;
                border-top-right-radius: 5px;
            }
            .email-body {
                padding: 20px;
            }
            .email-footer {
                background-color: #f4f4f4;
                color: #888888;
                padding: 10px;
                text-align: center;
                border-bottom-left-radius: 5px;
                border-bottom-right-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-body">
                <p>Dear Seller, Your registration with Elderwise Shopping india has been approved by our admin. Please start uploading your products.</p>
                <p>Best regards,</p>
                <p>Elderwise shopping india Pvt Ltd</p>
            </div>
        </div>
    </body>
    </html>
    `,
    // attachments:[
    //   {
    //     filename:"test.pdf",
    //     path:path.join(__dirname,"test.pdf"),
    //     contentType:"application/pdf"
    //   }
    // ]
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
  });
};


module.exports = sendEmail;
