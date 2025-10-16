require("dotenv").config();
var express = require("express");
var router = express.Router();
const userModel = require("./users");
const orderModel = require("./models/Order");

const localStrategy = require("passport-local");
const passport = require("passport");
passport.use(new localStrategy(userModel.authenticate()));

const { Resend } = require("resend");
const { link } = require("../app");
const resend = new Resend(process.env.RESEND_API_KEY);

// -------------------- MENU ROUTES --------------------
router.get("/", (req, res) => res.render("index"));
router.get("/about", (req, res) => res.render("about"));
router.get("/service", (req, res) => res.render("service"));
router.get("/gallery", (req, res) => res.render("gallery"));
router.get("/contact", (req, res) => res.render("contact"));
router.get("/review", (req, res) => res.render("review"));
router.get("/blog", (req, res) => res.render("blog"));
router.get("/temp", (req, res) => res.render("temp"));
router.get("/sucess", (req, res) => res.render("sucess"));
router.get("/blog1_card", (req, res) => res.render("blog1_card"));

// -------------------- AUTH --------------------
router.get("/signup", (req, res) => {
  res.render("signup", { error: "" });
});

router.post("/signup", async (req, res) => {
  const { username, email, password, mobile } = req.body;
  try {
    const userData = new userModel({ username, email, mobile });
    await userModel.register(userData, password);

    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Welcome! Signup successful.");
      res.redirect("/");
    });
  } catch (err) {
    console.error("Signup error:", err);
    let message = "Something went wrong, please try again.";
    if (err.name === "UserExistsError") {
      message = "Username already exists!";
    }
    res.render("signup", { error: message });
  }
});

router.get("/login", (req, res) => {
  // flash always returns an array, pass first element or empty string
  const errorMsg = req.flash("error")[0] || "";
  res.render("login", { error: errorMsg });
});


router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);


router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please log in first!");
  res.redirect("/login");
}

// -------------------- ORDER ROUTES --------------------
router.get("/order", isLoggedIn, (req, res) => {
  res.render("order");
});

router.post("/order", isLoggedIn, async (req, res) => {
  const { name, email, phone, address, product, quantity, message } = req.body;

  try {
    // 1️⃣ Save order to MongoDB
    const newOrder = new orderModel({
      name,
      email,
      phone,
      address,
      product,
      quantity,
      message,
    });
    await newOrder.save();

    // 2️⃣ Send email
    await resend.emails.send({
      from: "Craft With Astha <onboarding@resend.dev>",
      to: "shivakoshti121@gmail.com",
      subject: "🛍️ New Order Received",
      html: `
        <h2>New Order Details</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Product:</strong> ${product}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    console.log("✅ Email sent successfully via Resend");
    res.render("sucess", { name });
  } catch (error) {
    console.error("❌ Order processing error:", error);
    res.status(500).send("Something went wrong, please try again.");
  }
});



const products = [
  // Category: giftbox
  { name: "Luxury Gift Box", category: "giftbox", images: ["/images/trans.png","/images/giftbox.png","/images/Untitled (300 x 300 px) (3).png","/images/Birthday Surprise Box2.png"], description: "Handcrafted premium gift box" },
  { name: "Birthday Surprise Box", category: "giftbox", images: ["/images/Birthday Box1.png","/images/kostiantyn-li-xKggi7Gtfs4-unsplash.jpg","/images/kostiantyn-li-xKggi7Gtfs4-unsplash.jpg","/images/Birthday Box1.png"], description: "Perfect birthday gift" },
  // Category: decor
  { name: "Resin Wall Art", category: "decor", images: ["/images/Macrame Wall Hanging.png","/images/Macrame Wall Hanging1.png","/images/Macrame Wall Hanging3.png"], description: "Elegant decor for your home" },
  { name: "Handmade Lamp", category: "decor", images: ["/images/lamp1.png","/images/Handmade Lamp1.png","/images/lamp2.png","/images/lamp.png","/images/Handmade Lamp3.png"], description: "Brighten up your space" },
  { name: "Mini Frame", category: "decor", images: ["/images/Mini Frame1.png","/images/Mini Frame2.png","/images/Mini Frame3.png","/images/mini frame.png","/images/Mini Frame3.png"], description: "Perfect for memories" },
  // Category: personalized
  { name: "Name Chain", category: "personalized", images: ["/images/name chain1.png","/images/pppp.png",], description: "Customized name chain" },
  { name: "Engraved Pen", category: "personalized", images: ["/images/pen.png","/images/Engraved Pen (1).png","/images/Engraved Pen.png"], description: "Elegant gift pen" },
  // Category: accessory
  { name: "Handmade Wallet", category: "accessory", images: ["/images/3Wallet.png","/images/handmade wallet.png","/images/handmade wallet2.png",], description: "Stylish handmade wallet" },
  { name: "Phone Cover", category: "accessory", images: ["/images/ph.png","/images/Phone Cover1.png","/images/Phone Cover2.png"], description: "Protective and elegant" },
  // Category: jewelry
  { name: "Handmade Earrings", category: "jewelry", images: ["/images/Handmade Earrings1.png","/images/Handmade Earrings2.png","/images/Handmade Earrings3.png","/images/Handmade Earrings4.png"], description: "Elegant earrings set" },
  { name: "Bracelet Set", category: "jewelry", images: ["/images/Bracelet Set3.png","/images/Bracelet Set1.png"], description: "Handcrafted bracelet set" },
  // Add more products here till minimum 50
];

// GET /products
router.get('/products', (req, res) => {
  res.render('products', { products });
});




module.exports = router;


module.exports = router;


module.exports = router;
