const mongoose = require('mongoose')

const connectDB=async()=>{
    try{
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI

        if (!mongoUri) {
            throw new Error('Missing MongoDB URI. Add MONGODB_URI to Backend/.env')
        }

        const options = {}

        if (process.env.DB_NAME) {
            options.dbName = process.env.DB_NAME
        }

        const conn = await mongoose.connect(mongoUri, options)
        console.log(`DB connected: ${conn.connection.host}/${conn.connection.name}`)

    }
    catch(error){
        console.error("MongoDB connection failed",error.message);
        process.exit(1);

    }
}
module.exports = {
  connectDB,
}
