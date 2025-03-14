import { SENDER_NAME, BREVO_URI, REDIRECTIONS} from '../config/constants.js'
import axios from 'axios'
import { generateVerificationEmail } from '../templates/index.template.js'
import jwt from 'jsonwebtoken'
import { logger } from './logger.js'
// npm install axios

const senderMail = process.env.MADGEAR_EMAIL
const API_KEY = process.env.BREVO_API_KEY

const sendVerificationLink = async function(emailData){
    // receipentEmail, name, title, body, route, randomKey
    const link = `${REDIRECTIONS.BACKEND_BASE_URL}${emailData.route}?token=${emailData.randomKey}`
    const data = {
        sender: {
            email: senderMail,
            name: SENDER_NAME
        },
        to: [{
            email: emailData?.receipentEmail,
            name: emailData?.name
        }],
        subject: emailData?.title,
        htmlContent: generateVerificationEmail(emailData.name, emailData.title, emailData.body, link)
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY
        }
    }
    
    try {
        const response = await axios.post(BREVO_URI, data, config)
        const responseData = {
            statusCode: response.status,
            message: response.statusText,
            success: true
        }
        logger.info(emailData?.receipentEmail, responseData)
        return responseData
    } catch (error) {
        const errorData = {
            name: error?.name || 'UNKNOWN',
            statusCode: error?.status || error.response?.data?.code || 500,
            message: error.response?.data?.message || 'Something went wrong while sending email, please try again.',
            success: false
        }
        logger.error(emailData?.receipentEmail, errorData)
        return errorData
    }
}

const verifyEmailToken = (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.RANDOM_KEY_SECRET)
        logger.info('Decoded: ', decodedToken)
        return decodedToken
    } catch (error) {
        logger.error(error.name, error)
        return false
    }
}

export {sendVerificationLink,
    verifyEmailToken
}