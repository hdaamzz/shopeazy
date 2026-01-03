const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const session = require("express-session");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const passport = require("./controllers/user/googlePassport");

const logger = require("./utils/logger");
const morganMiddleware = require("./middleware/morgan.middleware");

const connectDB = require("./config/db");
connectDB(); 

app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(
  "/dashboard-assets",
  express.static(path.join(__dirname, "./public/dashboard-assets"))
);
app.use("/lib", express.static(path.join(__dirname, "public/lib")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", "./views"); 

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use(morganMiddleware);

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use((req, res, next) => {
  logger.warn(`404 - Page not found: ${req.method} ${req.originalUrl}`);
  if (req.originalUrl.startsWith("/admin")) {
    res.status(404).render("admin/admin404"); 
  } else {
    res.status(404).render("user/404");
  }
});

app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(3000, () => {
  logger.info('Server started successfully on port 3000');
  console.log(`http://localhost:3000`);
});
