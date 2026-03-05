const mongoose = require('mongoose')
const url = 'mongodb+srv://inotebook:Inotebook23@inotebook.idrdgre.mongodb.net/?appName=inotebook'
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
