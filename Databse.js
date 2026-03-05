const mongoose = require('mongoose')
const url = 'mongodb://localhost:27017/Notebook'
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