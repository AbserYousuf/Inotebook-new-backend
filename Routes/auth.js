const User = require("../Models/User");
const { body, validationResult } = require("express-validator");
const tokencheck = require('../Middleware/token')
const Emtoken = require('../Middleware/Emotp')
const sgMail = require('@sendgrid/mail');
const bcrypt = require("bcrypt");
const express = require("express");
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')
const jwt = require('jsonwebtoken');
const tokenverify = require("../Middleware/passtoken");
const resetkey = process.env.JWT_RESET_KEY
const KEY = process.env.JWT_SECRET_KEY
const router = express.Router()
const Signuplimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: {
        error: "You have attempt many requests Try after some minutes",
        retryAfter: "3 Minutes"
    }
})
router.post('/create',
    Signuplimiter, [
    body("name").isLength({ min: 4 }).withMessage("Name Too Short, 4 Minimun Characters of Name is Allowed"),
    body("username").isLength({ min: 4 }).withMessage("UserName too Short.UserName Should of Be 4 Minimum Characters").isLength({ max: 10n }).withMessage("UserName to Long.Maximum 10 Characters in UserName Are Allowed"),
    body("email").isEmail().withMessage("Please Enter The Valid Email"),
    body('password').isLength({ min: 6 }).matches(/[a-z]/).withMessage("The Entered Password Should containe Lower-Case Letter")
],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array().map(e => e.msg) })
        }
        try {
            const { name, password, email, username } = req.body
            let user = await User.findOne({ Email: email })
            if (user) {
                return res.status(401).json({ success: false, msg: "Following Email already exists" })
            }
            user = await User.findOne({ UserName: username })
            if (user) {
                return res.status(401).json({ success: false, msg: "Please Choose a Different Username" })
            }
            const salt = await bcrypt.genSalt(12)
            const newPassword = await bcrypt.hash(password, salt)
            const data = await User.create({
                name: name,
                userName: username,
                email: email,
                password: newPassword,

            })
            return res.status(200).json({ success: true, data })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ success: false, error: "Internal Server Issue" })
        }
    })
const Loginlimiter = rateLimit({
    windowMs: 3 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: {
        error: "You have attempt many requests Try after some minutes",
        retryAfter: "3 Minutes"
    }
})
router.post('/login', Loginlimiter, [
    body()
        .custom((value, { req }) => {
            if (!req.body.email && !req.body.username) {
                throw new Error("You must provide either email or username");
            }
            return true;
        })
        .withMessage("Provide email or username"),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage("Enter The Correct Email"),
    body('username')
        .optional()
        .trim().notEmpty().withMessage("Enter the correct Username"),
    body('password').exists({ checkFalsy: true }).trim().notEmpty().withMessage("Emter The Password ")
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => err.msg),
        })
    }
    const { email, password, username } = req.body
    let user;
    try {
        if (email) {
            user = await User.findOne({ email: email })
            if (!user) {
                return res.status(404).json({ success: false, error: " Enter The Correct Credentials" })
            }
        }
        if (username) {
            user = await User.findOne({ userName: username })
            if (!user) {
                return res.status(404).json({ success: false, error: " Enter The Correct Credentials" })
            }
        }
        if (!user) {
            return res.status(404).json({ success: false, error: " Enter The Correct Credentials" })
        }
        const compare = await bcrypt.compare(password, user.Password)
        if (!compare) {
            return res.status(401).json({ success: false, error: " Enter The Correct Credentials" })
        }
        const Id = user._id
        const userId = {
            id: Id
        }
        const authtoken = jwt.sign(userId, KEY)
        return res.status(200).json({ success: true, message: " Your Login Request has been approved ", authtoken: authtoken })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, msg: "Internal server issue" })
    }
})
router.post('/forgotpassword', [
    body('email').trim().isEmail().normalizeEmail().withMessage("Enter The Correct Email"),
], async (req, res) => {
    const { email } = req.body
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array().map(err => err.msg) })
    }
    let user = await User.findOne({ email: email })
    if (!user) {
        return res.status(200).json({ success: false, error: "If the account exists , an otp has been sent" })
    }

    try {
        const backotp = Math.floor(100000 + Math.random() * 900000).toString();
        const newotp = await bcrypt.hash(backotp, 10)

        user.resetOTP = newotp;
        user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
        user.resetOTPAttempts = 0
        await user.save()
        console.log("Forgot password request for email:", email, "at", new Date());
        sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

        if (email) {
            try {
                await sgMail.send({
                    to: user.Email,  // real user email
                    from: 'abseryousuf50@gmail.com',  // must match your verified sender!
                    subject: "OTP Verification",
                    text: `Hi ${user.Name || 'User'},\n\nUse this code to reset your password: ${backotp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore it.`,
                    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification - iNotebook</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacOSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7fa;
      color: #333;
    }
    .container {
      max-width: 480px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
      text-align: center;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 12px;
      background: #f8f9fc;
      padding: 16px 24px;
      border-radius: 12px;
      margin: 24px auto;
      display: inline-block;
      color: #2d3748;
      border: 2px dashed #cbd5e0;
    }
    .info {
      font-size: 15px;
      line-height: 1.6;
      color: #4a5568;
      margin: 16px 0;
    }
    .expiry {
      font-weight: 600;
      color: #e53e3e;
    }
    .footer {
      background: #edf2f7;
      padding: 20px 24px;
      font-size: 13px;
      color: #718096;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 32px;
      background: #667eea;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 16px;
    }
    @media only screen and (max-width: 480px) {
      .container { margin: 16px; }
      .otp-code { font-size: 28px; letter-spacing: 8px; padding: 12px 16px; }
      .header h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>iNotebook</h1>
    </div>

    <div class="content">
      <h2 style="margin-top:0; color:#2d3748;">Password Reset Code</h2>
      
      <p class="info">
        Hi ${user.Name || 'there'},<br>
        You requested to reset your password. Use the code below to continue:
      </p>

      <div class="otp-code">
        ${backotp}
      </div>

      <p class="info">
        This Otp will <span class="expiry">expire in 10 minutes</span>.<br>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>iNotebook - Secure Notes App<br>
      Srinagar, Jammu & Kashmir<br>
      © ${new Date().getFullYear()} iNotebook. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
                });

                const data = {

                    email: user.Email,
                    purpose: "password reset"

                }
                const Emtoken = jwt.sign(data, resetkey, { expiresIn: "2m" })
                console.log(backotp)
                return res.status(200).json({
                    success: true,
                    message: "If the account exists, an OTP has been sent",
                    Emtoken: Emtoken
                });

            } catch (error) {
                console.error(error.response ? error.response.body : error)
                return res.status(401).json({ success: false, msg: "Resend Otp Failed" })

            }
        }
    }

    catch (error) {
        console.error(error)
        res.status(500).json({ success: false, msg: "Internal server Issue" })
    }

})
router.post('/otpVerify', Emtoken, [

    body('otp').trim().isLength({ min: 6 }).isNumeric().withMessage("Otp Should Of Be 6 Digits")
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array().map(err => err.msg) })
    }
    const email = req.userEmail
    const { otp } = req.body
    try {
        const user = await User.findOne({ email: email })
        if (!user || !user.resetOTP || !user.resetOTPExpire) {
            return res.status(400).json({
                success: false,
                msg: "No reset request found or OTP already used/expired"
            })
        }
        console.log(otp)
        if (Date.now() > user.resetOTPExpire) {
            user.resetOTP = undefined
            user.resetOTPExpire = undefined
            user.resetOTPAttempts = 0
            await user.save()
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }
        if (user.resetOTPAttempts >= 5) {
            return res.status(429).json({
                success: false,
                msg: "Too Many requests "
            })
        }
        console.log(user.resetOTP)
        const hasverified = await bcrypt.compare(otp, user.resetOTP)
        if (!hasverified) {
            user.resetOTPAttempts = (user.resetOTPAttempts || 0) + 1;
            await user.save();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${5 - user.resetOTPAttempts} attempts left.`
            });

        }
        user.resetOTP = undefined;
        user.resetOTPExpire = undefined;
        user.resetOTPAttempts = 0;

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpire = Date.now() + 2 * 60 * 1000; // 2 minutes
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token: resetToken
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, msg: "Internal Server Error" })
    }
})
router.put('/updatepassword', [
    body('password').trim().matches(/[a-z]/).withMessage("Must contain at least one Lowercase letter").matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Must contain at least one special character')
        .isLength({ min: 8 }).withMessage(" The Length Of password should be atleast 8 characters")
], tokenverify, async (req, res) => {
    try {
        const { password } = req.body
        const id = req.userId
        const user = await User.findById(id)
        if (!user) {
            return res.status(401).json({
                success: false,
                msg: "User Not Found"
            })
        }
        const newpasscode = await bcrypt.hash(password, 12)
        user.Password = newpasscode
        user.resetToken = undefined
        user.resetTokenExpire = undefined
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, msg: "Failed to Update Password. Please try again later!" })
    }
})
router.get('/getuser', tokencheck, async (req, res) => {
    const id = req.userId
    try {
        const user = await User.findById(id).select('-Date -Password -createdAt -updatedAt -resetOTP -resetOTPAttempts -resetOTPExpire');
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not Found"
            })
        }
        return res.status(200).json({
            success: true,
            user: user
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            msg: "Internal Server Error"
        })
    }
})
module.exports = router;
