// calendarAssociation.ts
import mongoose from 'mongoose';

const calendarAssociationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    // required: true,
    trim: true,
    lowercase: true,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  calendarId: {
    type: String,
    // required: true,
  },
  calendarName:{
    type: String
  },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

});

const CalendarAssociation = mongoose.model('CalendarAssociation', calendarAssociationSchema);

export default CalendarAssociation;
