// authcontroller.ts:

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import User from "../models/user";
import CalendarAssociation from "../models/calendarAssociations";
import Meetings from "../models/meetings";
import * as validator from '../validations/validator';
import { encodeToken, decodeToken,convertToUTC } from '../utilities/utils';

require('dotenv').config(); 

const secretKey = "secret_Key";
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


export const signup = async (req: Request, res: Response) => {
  try {
    const errors =[];
    const { email, name, contactNo, password, role } = req.body;
    if(!email && !name && !contactNo && !password && !role){
      errors.push("all fields are required.")
    }

    if (!validator.nameRegex.test(name)) {
      errors.push( "Invalid name format" );
    }
    if (!validator.emailRegex.test(email)) {
      errors.push(  "Invalid email format" );
    }
    if (!validator.passwordRegex.test(password)) {
      errors.push( "Invalid password format" );
    }
    if (role !== "admin" && role !== "employee") {
      errors.push("role can be admin or employee only");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }
    // If there are any errors
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      name,
      contactNo,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    // // Create etry in  calendar association
    // const newCalendarAssociation = new CalendarAssociation({
    //   userId: newUser._id,
    //   email,
    // });
    // await newCalendarAssociation.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error: any) {
    res.status(500).json({ message: `Error creating user: ${error.message}` });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secretKey,
      { expiresIn: "24h" }
    );

    user.token = token; 
    await user.save(); 

    res.status(200).json({ message: "Login successful", user });
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: `Error logging in: ${error.message}` });
  }
};



export const createNewCalendar = async (req: Request, res: Response) => {
  console.log("===================")
  try {
    console.log(">>>>>>>>>>>>>>>>>>")

    const token = req.headers.token as string | string[];
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing." });
    }
    // If token is an array, use the first element
    const tokenString = Array.isArray(token) ? token[0] : token;


    const decoded = jwt.verify(tokenString, secretKey) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const { calendarName, email } = req.body;

    if (!calendarName || !email) {
      return res.status(400).json({ message: "Calendar name and email are required" });
    }
    
    // Check if a calendar already exists for the given email
    const existingAssociation = await CalendarAssociation.findOne({ email });

    if (existingAssociation) {
      return res.status(400).json({ message: "A calendar already exists for this email" });
    }

    // Retrieve the calendar association for the user and email
    let association = await CalendarAssociation.findOne({ userId: user._id, email });

    if (!association) {
      // If the association does not exist, create a new document
      association = new CalendarAssociation({
        userId: user._id,
        email,
      });
    }
    await association.save();

    // Generate auth URL and send to admin if tokens are missing
    if (!association.accessToken || !association.refreshToken) {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        state: JSON.stringify({ calendarName, email}),
      });

      return res.status(200).json({ message: "Please authorize access", authUrl });
    }

    // Set OAuth credentials for the client using existing tokens
    oauth2Client.setCredentials({
      access_token: decodeToken(association.accessToken) as string,
      refresh_token: decodeToken(association.refreshToken) as string,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const newCalendar = {
      summary: calendarName,
      timeZone: "Asia/Kolkata",
    };

    // Create a new calendar
    const response = await calendar.calendars.insert({
      requestBody: newCalendar,
    });

    // Save the calendar association
    association.calendarId = response.data.id;
    association.calendarName = calendarName;
    await association.save();

    res.status(201).json({ message: "Calendar created successfully", calendarId: response.data.id });
  } catch (error: any) {
    console.error("Error creating new calendar:", error);
    res.status(500).json({ message: `Error creating new calendar: ${error.message}` });
  }
};


export const completeCalendarCreation = async (req: any, res: Response) => {
  try {
    const { calendarName, email } = req.query;
    console.log("calendarName is :",calendarName)

    if (!calendarName || !email) {
      return res.status(400).json({ message: "Calendar name and email are required" });
    }

    // Retrieve the calendar association by email
    const association = await CalendarAssociation.findOne({ email });

    if (!association || !association.accessToken || !association.refreshToken) {
      return res.status(403).json({ message: "Please provide Google Calendar access" });
    }

    // Set OAuth credentials for the client using existing tokens
    oauth2Client.setCredentials({
      access_token: decodeToken(association.accessToken) as string,
      refresh_token: decodeToken(association.refreshToken) as string,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const newCalendar = {
      summary: calendarName,
      timeZone: "Asia/Kolkata",
    };

    // Create a new calendar
    const response = await calendar.calendars.insert({
      requestBody: newCalendar,
    });

    // Save the calendar association
    association.calendarId = response.data.id;
    association.calendarName = calendarName as string;
    await association.save();

    res.status(201).json({ message: "Calendar created successfully", calendarId: response.data.id });
  } catch (error: any) {
    console.error("Error completing calendar creation:", error);
    res.status(500).json({ message: `Error completing calendar creation: ${error.message}` });
  }
};

// OAuth Callback
export async function oauth2callback(req: Request, res: Response): Promise<void> {
  try {
    const { code, state } = req.query;
    const { email, calendarName } = JSON.parse(state as string);
    console.log("calendarName json.parse",calendarName)

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);

    // Find or create the calendar association by email
    let association = await CalendarAssociation.findOne({ email });

    if (!association) {
      association = new CalendarAssociation({
        email,
      });
    }

    // Save tokens to association
    association.accessToken = encodeToken(tokens.access_token!);
    association.refreshToken = encodeToken(tokens.refresh_token!);
    association.calendarName = calendarName; // Save calendar name to association
    await association.save(); // Save updates to database

    // Redirect to the original create calendar request
    res.redirect(`/complete-calendar-creation?calendarName=${encodeURIComponent(calendarName)}&email=${encodeURIComponent(email)}`);
    console.log("calendarName at redirect :",calendarName)
  } catch (error: any) {
    console.error("Error during OAuth2 callback:", error);
    res.status(500).json({ message: `Error during OAuth2 callback: ${error.message}` });
  }
}


export const createEvent = async (req: Request, res: Response) => {
  try {
    const { email, calendarName, date, startTime, endTime, summary, description } = req.body;
    console.log("req.body is :",req.body)

    // Find the calendar association by email and calendar name
    const association = await CalendarAssociation.findOne({ email: email, calendarName: calendarName });
    console.log("email is : ",email);
    console.log("calendarName is :", calendarName)
    console.log("association is :", association)

    if (!association) {
      return res.status(400).json({ message: "Calendar association not found" });
    }

    if (!association.calendarId) {
      return res.status(400).json({ message: "Calendar not found for the specified association" });
    }

    // Set OAuth credentials for the client using existing tokens from the association
    oauth2Client.setCredentials({
      access_token: decodeToken(association.accessToken!) as string || '',
      refresh_token: decodeToken(association.refreshToken!) as string || '',
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Convert local times to UTC
    const startDateTimeUTC = convertToUTC(date, startTime, "Asia/Kolkata");
    const endDateTimeUTC = convertToUTC(date, endTime, "Asia/Kolkata");


    const event = {
      summary,
      description,
      start: {
        // dateTime: new Date(`${date}T${startTime}`).toISOString(),
        // timeZone: "Asia/Kolkata",
        dateTime: startDateTimeUTC,
        timeZone: "UTC",
      },
      end: {
        // dateTime: new Date(`${date}T${endTime}`).toISOString(),
        // timeZone: "Asia/Kolkata",
        dateTime:endDateTimeUTC,
        timeZone:"UTC",
      },
    };

    // Insert event into Google Calendar
    const response = await calendar.events.insert({
      calendarId: association.calendarId!,
      requestBody: event,
    });

    // Save the event details in MongoDB
    const meeting = new Meetings({
      creator: association.userId,
      // date: new Date(`${date}T00:00:00Z`),
      // startTime,
      // endTime,
      date: new Date(Date.UTC(new Date(date).getUTCFullYear(), new Date(date).getUTCMonth(), new Date(date).getUTCDate())), // Store date in UTC
      startTime: startDateTimeUTC, 
      endTime: endDateTimeUTC, 
      title: summary,
      description,
      eventId: response.data.id,
      bookingId: null,
    });

    await meeting.save();

    res.status(201).json({ message: "Event created successfully", eventId: response.data.id });
  } catch (error: any) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: `Error creating event: ${error.message}` });
  }
};



