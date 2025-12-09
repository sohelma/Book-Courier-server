//index.js (server)
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI; // আপনার .env এ URI
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB connected successfully!");

    const db = client.db("Book-Courier");
    const booksCollection = db.collection("Book");
    const bannerCollection = db.collection("Banners");

    // Test route
    app.get("/", (req, res) => {
      res.send("Book Courier Server Running");
    });

    // All books
    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

     // ⭐ Latest 6 active books
    app.get("/books/latest", async (req, res) => {
      try {
        const latestBooks = await booksCollection
          .find({ isActive: true })
          .sort({ createdAt: -1 }) // সর্বশেষ যোগ হওয়া বই
          .limit(4)
          .toArray();

        res.send(latestBooks);
      } catch (err) {
        console.error("Error fetching latest books:", err);
        res.status(500).send({ message: "Server Error" });
      }
    });

    // Single book by ID
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid Book ID" });
      }
      try {
        const book = await booksCollection.findOne({ _id: new ObjectId(id) });
        if (!book) return res.status(404).send({ message: "Book not found" });
        res.send(book);
      } catch (err) {
        res.status(500).send({ message: "Server Error", error: err });
      }
    });

   

    // Banners API
    app.get("/banners", async (req, res) => {
      const banners = await bannerCollection
        .find({ isActive: true })
        .sort({ order: 1 })
        .toArray();
      res.send(banners);
    });

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
