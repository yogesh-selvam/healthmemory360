import mongoose, { Schema, Document } from 'mongoose';

const timestamps = {
  timestamps: true,
};

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
}

export const User = mongoose.model<IUser>(
  'User',
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, unique: true, required: true },
      passwordHash: { type: String, required: true },
      dateOfBirth: String,
      gender: String,
      height: Number,
      weight: Number,
      bloodGroup: String,
    },
    timestamps
  )
);

export const MedicalRecord = mongoose.model(
  'MedicalRecord',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      title: String,
      recordType: String,
      hospital: String,
      doctor: String,
      recordDate: Date,
      fileUrl: String,
      extractedText: String,
      summary: String,
      extractedData: Schema.Types.Mixed,
    },
    timestamps
  )
);

export const HealthMetric = mongoose.model(
  'HealthMetric',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      metricType: String,
      value: Number,
      unit: String,
      recordedAt: Date,
      source: String,
    },
    timestamps
  )
);

export const Medication = mongoose.model(
  'Medication',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
      status: String,
    },
    timestamps
  )
);

export const Condition = mongoose.model(
  'Condition',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      name: String,
      diagnosedDate: Date,
      status: String,
      notes: String,
    },
    timestamps
  )
);

export const Appointment = mongoose.model(
  'Appointment',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      doctor: String,
      hospital: String,
      appointmentDate: Date,
      reason: String,
      notes: String,
      status: String,
    },
    timestamps
  )
);

export const FitnessRecord = mongoose.model(
  'FitnessRecord',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      steps: Number,
      calories: Number,
      heartRate: Number,
      sleep: Number,
      exerciseMinutes: Number,
      recordedAt: Date,
    },
    timestamps
  )
);

export const NutritionRecord = mongoose.model(
  'NutritionRecord',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      water: Number,
      meal: String,
      recordedAt: Date,
    },
    timestamps
  )
);

export const MentalWellnessRecord = mongoose.model(
  'MentalWellnessRecord',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      mood: String,
      stress: String,
      sleepQuality: String,
      notes: String,
      recordedAt: Date,
    },
    timestamps
  )
);

export const AIInsight = mongoose.model(
  'AIInsight',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      type: String,
      title: String,
      description: String,
      severity: String,
    },
    timestamps
  )
);

export const DoctorBrief = mongoose.model(
  'DoctorBrief',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      summary: String,
      keyConditions: [String],
      medications: [String],
      recentReports: [String],
      questions: [String],
      generatedAt: Date,
    },
    timestamps
  )
);

export const Reminder = mongoose.model(
  'Reminder',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      title: { type: String, required: true },
      note: String,
      reminderDate: { type: Date, required: true },
      recurrence: { type: String, enum: ['none', 'monthly', 'quarterly', 'half-yearly', 'yearly'], default: 'none' },
      source: { type: String, default: 'user' },
      status: { type: String, enum: ['pending', 'completed', 'dismissed'], default: 'pending' },
      lastNotifiedAt: Date,
    },
    timestamps
  )
);


export const HealthAlert = mongoose.model(
  'HealthAlert',
  new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    message: String,
    severity: { type: String, enum: ['info','warning','urgent'], default: 'info' },
    sourceRecordId: { type: Schema.Types.ObjectId },
    sourceType: String,
    read: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    metadata: Schema.Types.Mixed,
  }, timestamps)
);

export const Notification = mongoose.model(
  'Notification',
  new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: String, title: { type: String, required: true }, message: String,
    read: { type: Boolean, default: false },
    actionUrl: String, metadata: Schema.Types.Mixed,
  }, timestamps)
);

export const EmergencyProfile = mongoose.model(
  'EmergencyProfile',
  new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
    bloodGroup: String, allergies: [String], conditions: [String], medications: [String],
    emergencyContacts: [{ name: String, relationship: String, phone: String }],
    notes: String,
  }, timestamps)
);

export const EmergencyEvent = mongoose.model(
  'EmergencyEvent',
  new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventId: { type: String, required: true, unique: true },
    status: { type: String, default: 'prepared' },
    latitude: Number, longitude: Number,
    cardSnapshot: Schema.Types.Mixed,
  }, timestamps)
);

export const HealthSpherePost = mongoose.model(
  'HealthSpherePost',
  new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    category: { type: String, enum: ['Health','Fitness','Nutrition','Wellness'], default: 'Health' },
    title: { type: String, required: true }, body: { type: String, required: true },
    likes: { type: Number, default: 0 },
  }, timestamps)
);

export const HealthSphereComment = mongoose.model(
  'HealthSphereComment',
  new Schema({
    postId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    body: { type: String, required: true },
  }, timestamps)
);

export const HealthSphereFollow = mongoose.model(
  'HealthSphereFollow',
  new Schema({
    followerId: { type: Schema.Types.ObjectId, required: true, index: true },
    followingId: { type: Schema.Types.ObjectId, required: true, index: true },
  }, timestamps)
);
