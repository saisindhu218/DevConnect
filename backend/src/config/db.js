const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use MONGO_URI with fallback to MONGODB_URI
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("❌ MongoDB connection URI not found in environment variables");
    }

    console.log("🔄 Attempting to connect to MongoDB...");
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    // Handle app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    
    // More detailed error information
    if (error.name === 'MongoNetworkError') {
      console.error("💡 Check if MongoDB is running on your system");
      console.error("💡 Try: brew services start mongodb-community (on macOS)");
      console.error("💡 Or: sudo systemctl start mongod (on Linux)");
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;