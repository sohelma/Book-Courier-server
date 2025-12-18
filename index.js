// index.js (final)
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB connected successfully!");

    const db = client.db("Book-Courier");
    const booksCollection = db.collection("Book");
    const bannerCollection = db.collection("Banners");
    const ordersCollection = db.collection("Order");
    const usersCollection = db.collection("Users");

    // Test route
    app.get("/", (req, res) => res.send("Book Courier Server Running"));

    // ---------------- BOOKS ----------------
    app.get("/books", async (req, res) => {
      const { addedBy } = req.query;
      const filter = addedBy ? { addedBy } : {};
      const books = await booksCollection.find(filter).toArray();
      res.send(books);
    });

    app.get("/books/latest", async (req, res) => {
      const latestBooks = await booksCollection
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .toArray();
      res.send(latestBooks);
    });

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid Book ID" });
      const book = await booksCollection.findOne({ _id: new ObjectId(id) });
      if (!book) return res.status(404).send({ message: "Book not found" });
      res.send(book);
    });

    app.post("/books", async (req, res) => {
  console.log("Book data received:", req.body); // check data
  try {
    const book = { ...req.body, status: "unpublished", createdAt: new Date() };
    const result = await booksCollection.insertOne(book);
    console.log("MongoDB insert result:", result);
    res.send(result);
  } catch (err) {
    console.error("MongoDB insert failed:", err);
    res.status(500).send({ message: "Insert failed", error: err.message });
  }
});


    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const { title, description, imageUrl, price, isActive, status } = req.body;
      if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid Book ID" });

      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { title, description, imageUrl, price, isActive, status } }
      );

      if (result.matchedCount === 0) return res.status(404).send({ message: "Book not found" });
      res.send({ success: true, message: "Book updated successfully" });
    });

    // ---------------- REVIEWS ----------------
    app.post("/books/review/:id", async (req, res) => {
      const bookId = req.params.id;
      const { email, name, rating, comment } = req.body;
      if (!ObjectId.isValid(bookId)) return res.status(400).send({ message: "Invalid Book ID" });
      if (!email || !rating || !comment) return res.status(400).send({ message: "Missing required fields" });

      const review = {
        _id: new ObjectId(),
        email,
        name: name || "Anonymous",
        rating: Number(rating),
        comment,
        createdAt: new Date(),
      };

      const result = await booksCollection.updateOne(
        { _id: new ObjectId(bookId) },
        { $push: { review } }
      );

      if (result.modifiedCount === 0) return res.status(404).send({ message: "Book not found" });
      res.send({ success: true, message: "Review added", review });
    });

    // ---------------- BANNERS ----------------
    app.get("/banners", async (req, res) => {
      const banners = await bannerCollection.find({ isActive: true }).sort({ order: 1 }).toArray();
      res.send(banners);
    });

    // ---------------- ORDERS ----------------
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });
      const orders = await ordersCollection.find({ email }).sort({ createdAt: -1 }).toArray();
      res.send(orders);
    });

    app.post("/orders", async (req, res) => {
      const result = await ordersCollection.insertOne(req.body);
      res.send(result);
    });

    app.patch("/orders/cancel/:id", async (req, res) => {
      const id = req.params.id;
      await ordersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: "cancelled" } });
      res.send({ success: true });
    });

    app.patch("/orders/pay/:id", async (req, res) => {
      const id = req.params.id;
      const { phone, address } = req.body;
      await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { paymentStatus: "paid", paidAt: new Date(), phone, address } }
      );
      res.send({ success: true });
    });

    // ---------------- PAYMENTS ----------------
    app.get("/payments", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });
      const payments = await ordersCollection.find({ email, paymentStatus: "paid" }).sort({ paidAt: -1 }).toArray();
      res.send(payments);
    });

    // ---------------- WISHLIST ----------------
    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      const wishlistItems = await ordersCollection.find({ email, type: "wishlist" }).sort({ createdAt: -1 }).toArray();
      const bookIds = wishlistItems.map(item => new ObjectId(item.bookId));
      const books = await booksCollection.find({ _id: { $in: bookIds } }).project({ imageUrl: 1 }).toArray();

      const wishlistWithImages = wishlistItems.map(item => {
        const book = books.find(b => b._id.toString() === item.bookId);
        return { ...item, imageUrl: book ? book.imageUrl : "https://via.placeholder.com/300" };
      });

      res.send(wishlistWithImages);
    });

    app.post("/wishlist", async (req, res) => {
      const { bookId, email, bookTitle } = req.body;
      if (!bookId || !email) return res.status(400).send({ message: "Book ID and Email required" });

      const existing = await ordersCollection.findOne({ bookId, email, type: "wishlist" });
      if (existing) return res.status(400).send({ message: "Already in Wishlist" });

      const result = await ordersCollection.insertOne({ bookId, bookTitle: bookTitle || "", email, type: "wishlist", createdAt: new Date() });
      res.send({ success: true, message: "Added to Wishlist", id: result.insertedId });
    });

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });

      const result = await ordersCollection.deleteOne({ _id: new ObjectId(id), type: "wishlist" });
      if (result.deletedCount === 0) return res.status(404).send({ message: "Wishlist item not found" });
      res.send({ success: true, message: "Removed from Wishlist" });
    });

    // ---------------- USERS ----------------
    app.get("/users", async (req, res) => res.send(await usersCollection.find().toArray()));

    app.patch("/users/role/:id", async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;

  let filter;
  // যদি id ObjectId হয়
  if (ObjectId.isValid(id) && id.length === 24) {
    filter = { _id: new ObjectId(id) };
  } else {
    // যদি string _id হয় (manual entries)
    filter = { _id: id };
  }

  const result = await usersCollection.updateOne(filter, { $set: { role } });
  if (result.matchedCount === 0) return res.status(404).send({ message: "User not found" });

  res.send({ success: true, message: "User role updated", result });
});


    // ---------------- LIBRARIAN ORDERS ----------------
    app.get("/librarian-orders", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      const books = await booksCollection.find({ addedBy: email }).toArray();
      const bookIds = books.map(b => b._id.toString());
      const orders = await ordersCollection.find({ bookId: { $in: bookIds } }).toArray();

      res.send(orders.length ? orders : { message: "No orders found", orders: [] });
    });


    // ---------------- ADMIN BOOKS ---------------------

    app.get("/admin/books", async (req, res) => {
      try {
        const books = await booksCollection.find().toArray();
        res.send(books);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch books", error: err.message });
      }
    });


    app.delete("/admin/books/:id", async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid Book ID" });

  try {
    // 1. Delete the book
    const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).send({ message: "Book not found" });

    // 2. Delete related orders
    await ordersCollection.deleteMany({ bookId: id });

    res.send({ success: true, message: "Book and related orders deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to delete book", error: err.message });
  }
});


  // UPDATE ORDER STATUS (pending -> shipped -> delivered)
app.patch("/orders/status/:id", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid Order ID" });
  }

  const result = await ordersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).send({ message: "Order not found" });
  }

  res.send({ success: true, message: "Order status updated" });
});



  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

run();

app.listen(port, () => console.log(`Server running on port ${port}`));
