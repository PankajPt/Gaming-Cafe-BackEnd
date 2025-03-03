import { SENDER_NAME, BREVO_URI, REDIRECTIONS} from '../config/constants.js'
import axios from 'axios'
import { generateVerificationEmail } from '../templates/index.template.js'
import jwt from 'jsonwebtoken'
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
            email: emailData.receipentEmail,
            name: emailData.name
        }],
        subject: emailData.title,
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
        return {
            statusCode: response.status,
            message: response.statusText,
            success: true
        }
    } catch (error) {
        if( error.response?.data?.code === 'invalid_parameter'){
            const errorData = {
                statusCode: error.status,
                errorCode: error.response?.data?.code,
                message: error.response?.data?.message,
                success: false
            }
            console.log(`${new Date(Date.now()).toLocaleString()}: ${error}\nError Code: ${errorData.errorCode}\nError Message: ${errorData.message}`)  
            return errorData
        }
        console.log(`${new Date(Date.now()).toLocaleString()}: ${error}`)
        return {
            message: error.message || 'Something went wrong while sending email, please try again.',
            success: false
        }
    }
}

const verifyEmailToken = (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.RANDOM_KEY_SECRET)
        return decodedToken
    } catch (error) {
        return false
    }
}

export {sendVerificationLink,
    verifyEmailToken
}