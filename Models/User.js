const mongoose = require('mongoose')
const { Schema } = mongoose;
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    resetOTP: { type: String },
    resetOTPExpire: { type: Date },
    resetOTPAttempts: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpire: { type: Date },
    password: {
        type: String,
        required: true,
    },
    Date: {
        type: Date,
        default: Date.now()
    }

}, { timestamps: true });
module.exports = mongoose.model("user", UserSchema);
