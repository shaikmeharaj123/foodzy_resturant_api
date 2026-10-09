const mongoose = require("mongoose");


const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    .then(async (data) => {
      console.log(`Mongodb connected with server:${data.connection.host}`);
      try {
        const collection = mongoose.connection.collection("deliverypersions");
        const indexes = await collection.indexes();
        if (indexes.some((idx) => idx.name === "valid_id_1")) {
          await collection.dropIndex("valid_id_1");
          console.log("[DB Cleanup] Successfully dropped obsolete unique index: valid_id_1");
        }
      } catch (err) {
        // Silently continue if index does not exist or collection is empty
      }
    });
};

module.exports = connectDatabase;
