const jwt = require('jsonwebtoken')
const key = process.env.JWT_RESET_KEY
const Emtoken = async (req, res, next) => {
    const token = req.header('Emtoken')
    if (!token) {
        return res.status(400).json({ success: false, error: "TOKEN Missing" })
    }
    try {
        const data = jwt.verify(token, key)
        if (data.purpose !== 'password reset') {
            return res.status(401).json({ success: false, error: "Invalid Purpose" })
        }
        req.userEmail = data.email
        next()
    } catch (error) {
        return res.status(401).json({ success: false, error: error })
    }
}
module.exports = Emtoken