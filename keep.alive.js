import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
const BACKEND_URI = process.env.BACKEND_BASE_URI
const PORT = process.env.KEEP_ALIVE_PORT

const app = express()

app.get('/', (req, res) => 'Keep Alive Micro service running.')
app.listen(PORT, () => console.log(`Keep Alive listning on port: ${PORT}`))

const generateSequenceNumber = (len) => {
    let alphaNum = "0123456789ABCDEFGHJKLMNOPQRSTUVWXYZ"
    let sequenceNumber = ""
    for ( let i = 0; i < len; i++){
        const digit = Math.floor(Math.random() * alphaNum.length + 1)
        sequenceNumber += alphaNum.charAt(digit)
    }
    return sequenceNumber
}

const pingServer = async () => {
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json' 
        }
    }

    const sequenceId = generateSequenceNumber(6)

    try {
        console.log(`[${new Date().toISOString()}] Heart_Beat[${sequenceId}]: SENT`)
        const response = await fetch(`${BACKEND_URI}/users/heartbeat/${sequenceId}`, options)
        const responseData = await response.json()
        if (!response.ok){
            console.log(`[${new Date().toISOString()}] Heart_Beat[]:`, responseData.status || "");
            return
        }
        console.log(`[${new Date().toISOString()}] Heart_Beat[${responseData.data.SEQ_NUM}]: RECEIVED`, responseData.data.status)
    } catch (error) {
        console.log(`[${new Date().toISOString()}] Heart_Beat[]:`, error.message || 'Something went wrong');
    }

}
pingServer()
setInterval(pingServer, 10 * 60 * 1000);
