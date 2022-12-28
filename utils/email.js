// nodemailer para enviar emails
const nodemailer = require('nodemailer');
const pug = require('pug');
const {htmlToText} = require('html-to-text')

module.exports = class Email {
    constructor(user,url) {
        this.to= user.email;
        this.firstname= user.name.split(' ')[0]
        this.url= url
        this.from=`Ruhan Correa Soares <${process.env.EMAIL_FROM}>`
    }

    // em produçao envia email para endereço real,e em desenvolvimento para mailtrap 
    newTransport() {
        if(process.env.NODE_ENV === 'production'){
            // Sendgrid
            console.log('production')
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user:process.env.SENDGRID_USERNAME,
                    pass:process.env.SENDGRID_PASSWORD

                }
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }

    async send(template,subject) {
        // Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
            firtname: this.firstname,
            url: this.url,
            subject:subject
        })

        // Define email options
        const mailOptions = {
            from: this.from,
            to: this.to, //options parametro da funcao
            subject: subject,
            html: html,
            text: htmlToText(html)
        }

        // Create a transport and send email
        await this.newTransport().sendMail(mailOptions)
        // await transporter.sendEmail({mailOptions})
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the NATOURS family')
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token (valid for only 10 minutes)'
        )
    }
}

// const sendEmail =async options => {
    // create a transporter
    // const transporter = nodemailer.createTransporter({
    //     host: process.env.EMAIL_HOST,
    //     port: process.env.EMAIL_PORT,
    //     auth: {
    //         user: process.env.EMAIL_USERNAME,
    //         pass: process.env.EMAIL_PASSWORD
    //     }
    // })

    // define the email options
    // const mailOptions = {
    //     from: 'Ruhan Correa Soares <empresa@email.io>',
    //     to: options.email, //options parametro da funcao
    //     subject: options.subject,
    //     text: options.message,
    //     // html:
    // }

    // actually send the email
    // await transporter.sendEmail({mailOptions})
// };
