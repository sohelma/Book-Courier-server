// index.js (server)
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
    const ordersCollection = db.collection("Order");

    // Test route
    app.get("/", (req, res) => {
      res.send("Book Courier Server Running");
    });

    // All books
    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

    // Latest active books
    app.get("/books/latest", async (req, res) => {
      try {
        const latestBooks = await booksCollection
          .find({ isActive: true })
          .sort({ createdAt: -1 })
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
      if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid Book ID" });

      try {
        const book = await booksCollection.findOne({ _id: new ObjectId(id) });
        if (!book) return res.status(404).send({ message: "Book not found" });
        res.send(book);
      } catch (err) {
        res.status(500).send({ message: "Server Error", error: err });
      }
    });

    // Banners
    app.get("/banners", async (req, res) => {
      const banners = await bannerCollection
        .find({ isActive: true })
        .sort({ order: 1 })
        .toArray();
      res.send(banners);
    });

    // Fetch orders by user email
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      try {
        const orders = await ordersCollection
          .find({ email })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(orders);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server Error", error: err });
      }
    });

    // Fetch single order by ID
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

      const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
      if (!order) return res.status(404).send({ message: "Order not found" });
      res.send(order);
    });

    // Create new order
    app.post("/orders", async (req, res) => {
      const orderData = req.body;
      if (!orderData || !orderData.email || !orderData.bookId) {
        return res.status(400).send({ message: "Invalid order data" });
      }

      try {
        const result = await ordersCollection.insertOne(orderData);
        res.send({ message: "Order placed successfully", orderId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to place order", error: err });
      }
    });

    // Cancel order
    app.patch("/orders/cancel/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

      try {
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "cancelled" } }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).send({ message: "Order not found" });
        }

        res.send({ success: true, message: "Order cancelled" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server Error", error: err });
      }
    });

    // Pay order (single unified route)
    app.patch("/orders/pay/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

      try {
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { paymentStatus: "paid", paidAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).send({ message: "Order not found" });
        }

        res.send({ success: true, message: "Payment successful" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server Error", error: err });
      }
    });

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
