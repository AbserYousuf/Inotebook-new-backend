const mongoose = require('mongoose')
const url = process.env.MONGO_URL
const Connect = async () => {
    try {
        await mongoose.connect(url)
        console.log("Database Connection Successful")
    } catch (error) {
        console.error("Database Connection Failed")
        console.log(error)
    }
}
module.exports = Connect;
