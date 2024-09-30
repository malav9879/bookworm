const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); 
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB setup
const uri = "mongodb+srv://malav:malav@bookworm.tyan4.mongodb.net/?retryWrites=true&w=majority&appName=BookWorm";
let userCollection, bookCollection;

const client = new MongoClient(uri);

async function initializeMongoDBConnection() {
  try {
      await client.connect();
      console.log('Connected to MongoDB successfully!');
      // Initialize the userCollection after successful connection
      userCollection = client.db("bookworm").collection("users");
      bookCollection = client.db("bookworm").collection("books");
      console.log("Collections initialized successfully!");
  } catch (err) {
      console.error('Error connecting to MongoDB:', err);
  }
}

initializeMongoDBConnection();


// Test server
app.get('/', (req, res) => {
  res.send('<h3>Welcome to the Bookworm app server!</h3>');
});

// Signup Route
app.post('/signup', async (req, res) => {
  try {
      console.log("POST request received for signup:", req.body);

      const { email, password, firstName, lastName } = req.body;
      if (!email || !password || !firstName || !lastName) {
          return res.status(400).send({ message: "All fields are required" });
      }

      const newUser = { email, password, firstName, lastName };
      const result = await userCollection.insertOne(newUser);

      console.log("User created with ID:", result.insertedId);
      res.status(201).send({ message: "User created successfully", userId: result.insertedId });
  } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).send({ error: "Signup failed" });
  }
});

// Login Route
app.post('/verifyUser', async (req, res) => {
  try {
      console.log("POST request received for login:", req.body);

      const { email, password } = req.body;
      if (!email || !password) {
          return res.status(400).send({ message: "Email and password are required" });
      }

      const user = await userCollection.findOne({ email, password });
      if (!user) {
          return res.status(400).send({ message: "Invalid credentials" });
      }

      res.status(200).send([user]);
  } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send({ error: "Login failed" });
  }
});

app.post('/addBook', async (req, res) => {
  try {
      console.log("POST request received to add a book:", req.body);

      const { userId, title, author, totalPages } = req.body;

      // Check if all fields are provided
      if (!userId || !title || !author || !totalPages) {
          return res.status(400).send({ message: "All fields are required" });
      }

      // Create new book object
      const newBook = {
          userId: new ObjectId(userId),  // Use new ObjectId for userId
          title,
          author,
          totalPages: parseInt(totalPages, 10),  // Ensure totalPages is a number
          pagesRead: 0,  // Initial pages read
          status: 'Currently Reading',  // Default status
          created_at: new Date(),
          updated_at: new Date()
      };

      // Insert the book into MongoDB
      const result = await bookCollection.insertOne(newBook);
      console.log("Book added with ID:", result.insertedId);

      res.status(201).send({ message: "Book added successfully", bookId: result.insertedId });
  } catch (error) {
      console.error("Error adding book:", error);
      res.status(500).send({ error: "Failed to add book" });
  }
});

app.post('/getBooks', async (req, res) => {
  try {
      const { userId } = req.body;

      if (!userId) {
          return res.status(400).send({ message: "User ID is required" });
      }

      // Fetch all books for the user
      const books = await bookCollection.find({ userId: new ObjectId(userId) }).toArray();

      if (books.length === 0) {
          return res.status(404).send({ message: "No books found for this user" });
      }

      console.log(`Books retrieved for user ${userId}:`, books);
      res.status(200).send(books);
  } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).send({ error: "Failed to fetch books" });
  }
});

app.put('/updatePagesRead', async (req, res) => {
  try {
      const { bookId, pagesRead } = req.body;

      if (!bookId || pagesRead === undefined) {
          return res.status(400).send({ message: "Book ID and pages read are required" });
      }

      // Update the book's pagesRead and updated_at timestamp
      const result = await bookCollection.updateOne(
          { _id: new ObjectId(bookId) },
          { $set: { pagesRead: pagesRead, updated_at: new Date() } }
      );

      if (result.modifiedCount === 0) {
          return res.status(404).send({ message: "Book not found or no changes made" });
      }

      console.log(`Pages read updated for book ${bookId}: ${pagesRead}`);
      res.status(200).send({ message: "Pages read updated successfully" });
  } catch (error) {
      console.error("Error updating pages:", error);
      res.status(500).send({ error: "Failed to update pages read" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Bookworm app server is listening at http://localhost:${port}`);
});

