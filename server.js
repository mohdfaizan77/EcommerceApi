// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/userModel");
const Auth = require("./models/authModel");
const Product = require("./models/productModel");
const Cart = require("./models/cart");
const { verifyToken } = require("./middleware/jwtmiddleware");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("Connected to MongoDB database");
});

// Registration
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Create a new cart and link it to the user
    const newCart = await Cart.create({ user: newUser._id });

    // Update the user's cart field with the newly created cart's ID
    newUser.cart = newCart._id;
    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", userId: newUser._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = {
      userId: user._id,
    };
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d", // Token will expire in 30 days
    });

    await Auth.create({ userId: user._id, token });
    res.setHeader("Authorization", `Bearer ${token}`);

    res.json({
      message: "Login successful",
      name: user.name,
      email: user.email,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Add Products
app.post("/api/addproduct", async (req, res) => {
  try {
    const { title, image, description, price, category, countInStock } =
      req.body;

    // Create a new product document
    const newProduct = new Product({
      title,
      image,
      description,
      price,
      category,
      countInStock,
    });

    // Save the new product to the database
    const savedProduct = await newProduct.save();

    res
      .status(201)
      .json({ message: "Product added successfully", product: savedProduct });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

//Get All products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Add to Cart
app.post("/api/addtocart", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.body.productId; // Assuming the new product details are provided in the request body.

    // Find the cart by user ID
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for the user" });
    }

    // Add the new product to the products array
    cart.products.push(productId);

    // Save the updated cart back to the database
    const updatedCart = await cart.save();

    return res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating the cart" });
  }
});

//Get CartItem
app.post("/api/getcartitems", verifyToken, async (req, res) => {
  try {
    const cartItems = await Cart.findOne({ user: req.user._id }).populate(
      "products"
    );

    if (!cartItems) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json(cartItems.products);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving the cart items" });
  }
});

// app.delete('/api/removeItem/:Id', verifyToken, async (req, res) => {
//   try {
//     const productId = req.params.Id;
//     const cartItems = await Cart.findOne({ user: req.user._id })

//     // if (!cartItems) {
//     //   return res.status(404).json({ message: "Cart not found" });
//     // }

//     // // Filter out the product to be removed from the products array
//      const filterResult = cartItems.products.filter((item) => item !== productId);

//     // // Save the updated cartItems back to the database
//     //  await cartItems.save();

//     res.status(200).json({data : filterResult ,
//     productId : productId });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "An error occurred while removing the product from the cart" });
//   }
// });

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
