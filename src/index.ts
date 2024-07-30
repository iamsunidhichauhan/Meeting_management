// index.ts:

import express, { NextFunction, Request, Response } from "express";
const basicAuth = require('express-basic-auth'); 
import mongoose from "mongoose";
import {
  signup,
  login,
  oauth2callback,
  createEvent,
  createNewCalendar,
  completeCalendarCreation,
  // provideAccess,
  // assignCalendar,
} from "./controllers/authControllers";
import { bookevent } from "./controllers/bookingController";
import { authorize } from "./middleware/middleware";
import { findSlots,fetchEventsFromAllCalendars } from "./controllers/calendarController";
import bodyParser from "body-parser";
const swaggerUi = require('swagger-ui-express');
const swaggerAuth = require ("./swagger/swagger");

// setup express
const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const userAuth = basicAuth({
  users: { calendar_integration: "calendar_integration" },
  challenge: true,
});

var swaggerHtmlV1 = swaggerUi.generateHTML(swaggerAuth);
app.use(
  "/api-docs",
  userAuth,
  swaggerUi.serveFiles(swaggerAuth),
  (req, res) => {
    res.send(swaggerHtmlV1);
  }
);

// // Other routes and middleware setup
// app.get('/', (req, res) => {
//   res.send('Hello World');
// });





// define routs:
app.post("/signup", signup);
app.post("/login", login);
app.get("/oauth2callback", oauth2callback);
app.post("/create-event", createEvent);
app.post("/createNewCalendar", /*authorize(["admin"]),*/ createNewCalendar);
app.post("/bookevent", bookevent);
app.get("/findSlots", findSlots);
app.get("/complete-calendar-creation",completeCalendarCreation);
app.post("/fetchEventsFromAllCalendars",fetchEventsFromAllCalendars)
// app.get("/provideAccess", provideAccess);
// app.post("/assignCalendar", assignCalendar);



// server configuration:
mongoose
  .connect("mongodb://localhost:27017/calendar_integration")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
