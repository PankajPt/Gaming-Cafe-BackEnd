import { SENDER_NAME } from '../config/constants.js'
import asyncHandler from './asyncHandler.js'
import axios from 'axios'
import { generateVerificationEmail } from './index.template.js'
// npm install axios

const senderMail = process.env.MADGEAR_EMAIL
const brevoURI = 'https://api.brevo.com/v3/smtp/email'
const API_KEY = process.env.BREVO_API_KEY

const sendVerificationLink = asyncHandler( async function(receipentEmail, name, verificationLink){
    const data = {
        sender: {
            email: senderMail,
            name: SENDER_NAME
        },
        to: [{
            email: receipentEmail,
            name
        }],
        subject: `Account Verification`,
        htmlContent: generateVerificationEmail(name, verificationLink)
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY
        }
    }
    
    const response = await axios.post(brevoURI, data, config)
    return response
})

export default sendVerificationLink
