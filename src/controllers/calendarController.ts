import { Request, Response } from 'express';
import User from "../models/user";
import bcrypt from 'bcrypt';
import Meetings from '../models/meetings';
import { google } from "googleapis";
import CalendarAssociation from "../models/calendarAssociations";
import { encodeToken, decodeToken } from '../utilities/utils';


require('dotenv').config(); 

const secretKey = "secret_Key";
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);



// Create user function
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, contactNo, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email,
      name,
      contactNo,
      password: hashedPassword,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    res.status(200).json({ message: "User created successfully", savedUser });
  } catch (error: any) {
    res.status(500).json({ message: `Error creating user: ${error.message}` });
  }
};




export const findSlots = async (req: Request, res: Response) => {
  try {
    const { unbooked } = req.query; 

    let query = {};
    if (unbooked === 'true') {
      query = { isBooked: false };
    } else if (unbooked === 'false') {
      query = { isBooked: true };
    }

    const slots = await Meetings.find(query);

    res.status(200).json({ slots });
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving slots: ${error.message}` });
  }
};

// API endpoint to list events
export const fetchEvents = async (req: any, res: Response) => {
  try {
    const { calendarId } = req.query as { calendarId: string }; // Calendar ID from query parameter
    const { accessToken, refreshToken } = req.user.tokens; 
    console.log(req.user)

    // Set OAuth2 credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Create Google Calendar instance
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Retrieve events
    const response = await calendar.events.list({
      calendarId,
      maxResults: 10, // Maximum number of events to fetch (adjust as needed)
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    res.status(200).json({ events });
  } catch (error:any) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ message: `Error fetching events: ${error.message}` });
  }
};


export const fetchEventsFromCalendar = async (calendarId: string, tokens: { accessToken: string, refreshToken: string }, date: string) => {
  console.log("calendarid is :", calendarId);
  console.log("tokens are : ", tokens);
  console.log("date is :", date);
  try {
    const decodedAccessToken = tokens.accessToken;
    const decodedRefreshToken = tokens.refreshToken;

    if (!decodedAccessToken || !decodedRefreshToken) {
      throw new Error('Invalid tokens');
    }

    oauth2Client.setCredentials({
      access_token: decodedAccessToken,
      refresh_token: decodedRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startOfDay = new Date(date + 'T00:00:00Z');
    const endOfDay = new Date(date + 'T23:59:59Z');

    console.log("Fetching events with the following parameters:");
    console.log(`calendarId: ${calendarId}`);
    console.log(`timeMin: ${startOfDay.toISOString()}`);
    console.log(`timeMax: ${endOfDay.toISOString()}`);

    const events = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      timeZone: "UTC",
      singleEvents: false, // Set to false to get recurring events as a single entry
    });

    console.log(`Fetched events: ${JSON.stringify(events.data.items)}`);
    return events.data.items || [];
  } catch (error) {
    console.error(`Failed to fetch events for calendarId ${calendarId}:`, error);
    throw error;
  }
};

// fetch event depending on role - token present 
// export const fetchEventsFromAllCalendars = async (req: any, res: Response) => {
//   try {
//     const { date } = req.body;
//     const { user } = req; // User object is attached to the request by the authorize middleware

//     if (!user) {
//       return res.status(400).json({ message: "User not found in request" });
//     }

//     const query = user.role === 'admin' ? { userId: user._id } : { userId: user._id, email: user.email };
//     const calendarAssociations = await CalendarAssociation.find(query);

//     if (!calendarAssociations.length) {
//       return res.status(404).json({ message: "No calendars found for this user" });
//     }

//     let allEvents: any[] = [];
//     for (const association of calendarAssociations) {
//       try {
//         console.log(`Fetching events for calendarId: ${association.calendarId}`);
//         const events = await fetchEventsFromCalendar(association.calendarId!, {
//           accessToken: decodeToken(association.accessToken!) || '',
//           refreshToken: decodeToken(association.refreshToken!) || '',
//         }, date);
//         console.log("events are : ", events)
//         console.log(`Fetched events: ${JSON.stringify(events)}`);

//         allEvents = allEvents.concat(events);
//       } catch (fetchError) {
//         console.error(`Error fetching events for calendarId: ${association.calendarId}`, fetchError);
//       }
//     }

//     res.status(200).json({ events: allEvents });
//   } catch (error: any) {
//     console.error("Error fetching events from calendars:", error);
//     res.status(500).json({ message: `Error fetching events from calendars: ${error.message}` });
//   }
// };



export const fetchEventsFromAllCalendars = async (req: Request, res: Response) => {
  try {
    const { userId, date } = req.body;

    if (!userId || !date ) {
      return res.status(400).json({ message: "User ID, date are required" });
    }
    const calendarAssociations = await CalendarAssociation.find({ userId });


    // // Fetch calendar associations based on role
    // let calendarAssociations;
    // if (role === 'admin') {
    //   calendarAssociations = await CalendarAssociation.find({});
    // } else if (role === 'employee') {
    //   calendarAssociations = await CalendarAssociation.find({ userId });
    // } else {
    //   return res.status(403).json({ message: "Invalid role" });
    // }

    if (!calendarAssociations.length) {
      return res.status(404).json({ message: "No calendars found for this user" });
    }

    let allEvents: any[] = [];
    for (const association of calendarAssociations) {
      try {
        console.log(`Fetching events for calendarId: ${association.calendarId}`);
        const events = await fetchEventsFromCalendar(association.calendarId!, {
          accessToken: decodeToken(association.accessToken!) || '',
          refreshToken: decodeToken(association.refreshToken!) || '',
        }, date);
        console.log("events are : ", events)
        console.log(`Fetched events: ${JSON.stringify(events)}`);

        allEvents = allEvents.concat(events);
      } catch (fetchError) {
        console.error(`Error fetching events for calendarId: ${association.calendarId}`, fetchError);
      }
    }

    res.status(200).json({ events: allEvents });
  } catch (error: any) {
    console.error("Error fetching events from calendars:", error);
    res.status(500).json({ message: `Error fetching events from calendars: ${error.message}` });
  }
};


