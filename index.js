require("dotenv").config();
const express = require("express");
const server = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const cookieParser = require("cookie-parser");
const { createProduct } = require("./controller/Product");
const productsRouter = require("./routes/Products");
const categoriesRouter = require("./routes/Categories");
const brandsRouter = require("./routes/Brands");
const usersRouter = require("./routes/User");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const ordersRouter = require("./routes/Order");
const { User } = require("./model/User");
const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");
const SECRET_KEY = "SECRET_KEY";
const path = require("path");
const stripe = require("stripe")("sk_test_tR3PYbcVNZZ796tH88S4VQ2u");
const cors = require("cors");
const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = "SECRET_KEY";

server.use(express.static(path.resolve(__dirname, "build")));

server.use(cookieParser());
server.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

server.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

server.use(passport.authenticate("session"));

server.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);
server.use(
  express.json({
    type: ["application/json", "text/plain"],
  })
);
// Todo: Implement security
server.use("/products", productsRouter.router);
server.use("/categories", isAuth(), categoriesRouter.router);
server.use("/brands", isAuth(), brandsRouter.router);
server.use("/users", isAuth(), usersRouter.router);
server.use("/auth", authRouter.router);
server.use("/cart", isAuth(), cartRouter.router);
server.use("/orders", isAuth(), ordersRouter.router);

passport.use(
  "local",

  new LocalStrategy({ usernameField: "email" }, async function (
    email,
    password,
    done
  ) {
    try {
      const user = await User.findOne({ email: email });
      console.log(email, password, user);
      if (!user) {
        done(null, false, { message: "inavlid credentials" });
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async function (err, hashedPassword) {
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return done(null, false, { message: "inavlid credentials" });
          }
          const token = jwt.sign(sanitizeUser(user), SECRET_KEY);
          done(null, { token });
        }
      );
    } catch (err) {
      done(err);
    }
  })
);

passport.use(
  "jwt",
  new JwtStrategy(opts, async function (jwt_payload, done) {
    console.log({ jwt_payload });
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, sanitizeUser(user));
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(null, false);
    }
  })
);

passport.serializeUser(function (user, cb) {
  console.log("serialize", user);
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

passport.deserializeUser(function (user, cb) {
  console.log("de-serialize", user);
  process.nextTick(function () {
    return cb(null, user);
  });
});

//stripe integration
server.post("/create-checkout-session", async (req, res) => {
  console.log(req);
  const session = await stripe.checkout.sessions.create({
    line_items: req.body,
    mode: "payment",
    success_url: "http://localhost:8080",
    cancel_url: "http://localhost:8080",
  });
  console.log(session.url);
  res.json({ url: session.url });
});

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb+srv://test:test@cluster0.elcthhj.mongodb.net/Blockchain?retryWrites=true&w=majority&appName=Cluster0");
  console.log("database connected");
}

server.listen(process.env.PORT, () => {
  console.log("server started");
});
