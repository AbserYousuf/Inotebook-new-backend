const User = require('../Models/User')
const tokenverify = async (req, res, next) => {
    const authHeader = req.headers.authorization
    try {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required (Bearer format)"
            });
        }
        const passtoken = authHeader.split(' ')[1];
        const user = await User.findOne({
            resetToken: passtoken,
            resetTokenExpire: { $gt: Date.now() }
        })
        if (!user) {
            return res.status(401).json({
                success: false,
                msg: "Invalid or expire Reset Token"
            })
        }
        req.userId = user._id
        next()
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, msg: "Internal server Error" })
    }
}
module.exports = tokenverify