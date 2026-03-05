const jwt = require('jsonwebtoken')
const key = process.env.JWT_SECRET_KEY
const tokencheck = async (req, res, next) => {
    const token = req.header('authtoken')
    try {
        if (!token) {
            return res.status(400).json({
                success: false,
                msg: "Please Enter Correct Authentication Details"
            })

        }
        const ischeck = jwt.verify(token, key)
        req.userId = ischeck.id
        next()

    } catch (error) {
        console.error(error)
        return res.status(401).json({
            success: false,
            msg: "Session Expired"
        })
    }

}
module.exports = tokencheck;