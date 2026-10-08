import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, MedicalRecord, HealthMetric, FitnessRecord, NutritionRecord, MentalWellnessRecord, Medication, Condition, Appointment, Reminder, HealthAlert, Notification, EmergencyProfile, HealthSpherePost } from './models';

(async()=>{
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthmemory360');
  const uid = async () => {
    let u = await User.findOne({ email: 'alex.morgan@healthmail.com' });
    if (!u) u = await User.create({ name:'Alex Morgan', email:'alex.morgan@healthmail.com', passwordHash:await bcrypt.hash('ClinicalVault2025#',12), dateOfBirth:'2002-05-12', height:170, weight:72, bloodGroup:'O+' });
    else { u.passwordHash=await bcrypt.hash('ClinicalVault2025#',12); u.name='Alex Morgan'; u.dateOfBirth='2002-05-12'; u.height=170; u.weight=72; u.bloodGroup='O+'; await u.save(); }
    return u._id;
  };
  const userId = await uid();
  const models:any[]=[MedicalRecord,HealthMetric,FitnessRecord,NutritionRecord,MentalWellnessRecord,Medication,Condition,Appointment,Reminder,HealthAlert,Notification,EmergencyProfile,HealthSpherePost];
  await Promise.all(models.map((m:any)=>m.deleteMany({ userId })));
  const d=(s:string)=>new Date(s);

  await MedicalRecord.insertMany([
    {userId,title:'Blood Test',recordType:'Report',hospital:'Demo Health Center',doctor:'Dr. Maya Rao',recordDate:d('2026-08-12'),summary:'Fictional demo blood report. Values are synthetic.',extractedData:{followUp:{value:3,unit:'months'},values:[{name:'Hemoglobin',value:12.4,unit:'g/dL',uncertain:false},{name:'Glucose',value:108,unit:'mg/dL',uncertain:false},{name:'Cholesterol',value:212,unit:'mg/dL',uncertain:false}]}},
    {userId,title:'Health Check',recordType:'Visit Note',hospital:'Demo Health Center',doctor:'Dr. Maya Rao',recordDate:d('2026-07-14'),summary:'Routine fictional wellness review.',extractedData:{values:[{name:'Weight',value:72,unit:'kg',uncertain:false},{name:'Systolic BP',value:128,unit:'mmHg',uncertain:false}]}},
    {userId,title:'Prescription',recordType:'Prescription',hospital:'Demo Health Center',doctor:'Dr. Maya Rao',recordDate:d('2026-08-02'),summary:'Synthetic medication record for demonstration.',extractedData:{medications:[{name:'Demo medication',dosage:'As prescribed',frequency:'As directed'}]}},
    {userId,title:'Previous Blood Test',recordType:'Report',hospital:'Demo Health Center',doctor:'Dr. Maya Rao',recordDate:d('2026-06-12'),summary:'Fictional previous demo report.',extractedData:{values:[{name:'Hemoglobin',value:11.2,unit:'g/dL',uncertain:false},{name:'Glucose',value:118,unit:'mg/dL',uncertain:false},{name:'Cholesterol',value:230,unit:'mg/dL',uncertain:false}]}},
    {userId,title:'Lipid Panel',recordType:'Report',hospital:'Pacific Diagnostics',doctor:'Dr. Maya Rao',recordDate:d('2026-05-20'),summary:'Synthetic lipid panel for longitudinal comparison.',extractedData:{values:[{name:'Total Cholesterol',value:230,unit:'mg/dL',uncertain:false},{name:'LDL',value:150,unit:'mg/dL',uncertain:false},{name:'HDL',value:48,unit:'mg/dL',uncertain:false}]}},
    {userId,title:'CBC',recordType:'Report',hospital:'LabCorp Diagnostics',doctor:'Dr. Maya Rao',recordDate:d('2026-04-18'),summary:'Synthetic complete blood count.',extractedData:{values:[{name:'Hemoglobin',value:11.0,unit:'g/dL',uncertain:false},{name:'WBC',value:6.8,unit:'10^3/uL',uncertain:false}]}}
  ]);

  await HealthMetric.insertMany([
    {userId,metricType:'Weight',value:72,unit:'kg',recordedAt:d('2026-08-12'),source:'Demo'},
    {userId,metricType:'Blood Pressure',value:128,unit:'mmHg systolic',recordedAt:d('2026-08-12'),source:'Demo'},
    {userId,metricType:'Glucose',value:108,unit:'mg/dL',recordedAt:d('2026-08-12'),source:'Demo'},
    {userId,metricType:'Cholesterol',value:212,unit:'mg/dL',recordedAt:d('2026-08-12'),source:'Demo'},
    {userId,metricType:'SpO2',value:98,unit:'%',recordedAt:d('2026-08-12'),source:'Demo'},
    {userId,metricType:'Heart Rate',value:72,unit:'bpm',recordedAt:d('2026-08-12'),source:'Demo'}
  ]);

  for(let i=6;i>=0;i--){
    const dt=new Date(Date.now()-i*86400000);
    await FitnessRecord.create({userId,steps:6500+i*220,calories:380+i*8,heartRate:72,sleep:7.2,exerciseMinutes:35+i,recordedAt:dt});
    await NutritionRecord.create({userId,calories:1900+i*20,protein:92,carbs:220,fat:62,water:1.8,meal:'Daily summary',recordedAt:dt});
    await MentalWellnessRecord.create({userId,mood:i%3===0?'Good':'Okay',stress:i%2?'Moderate':'Low',sleepQuality:'Good',recordedAt:dt});
  }

  await Medication.create({userId,name:'Demo medication',dosage:'As prescribed',frequency:'As directed',startDate:d('2026-08-02'),status:'active'});
  await Condition.create({userId,name:'Demo health note',diagnosedDate:d('2026-07-14'),status:'active',notes:'Fictional demo data only'});
  await Appointment.create({userId,doctor:'Dr. Maya Rao',hospital:'Demo Health Center',appointmentDate:d('2026-10-20'),reason:'Routine review',status:'scheduled'});
  await Reminder.create({userId,title:'Prepare for routine health review',note:'Demo reminder. Review your stored record before treating any date as a confirmed appointment.',reminderDate:d('2026-10-15T09:00:00'),recurrence:'none',source:'seed',status:'pending'});
  await HealthAlert.create({userId,title:'Follow-up checkup is approaching',message:'A stored Blood Test contains a three-month follow-up interval. This is a record-derived estimate, not a confirmed appointment.',severity:'warning',sourceType:'MedicalRecord',metadata:{recordTitle:'Blood Test',recordDate:'2026-08-12'}});
  await Notification.create({userId,type:'alert',title:'HealthMemory is ready',message:'Your demo health memory contains records, a timeline, reminders and an upcoming appointment.',actionUrl:'/app/alerts'});
  await EmergencyProfile.create({userId,bloodGroup:'O+',allergies:['None recorded'],conditions:['Demo health note'],medications:['Demo medication — as prescribed'],emergencyContacts:[{name:'Demo Contact',relationship:'Family',phone:'+91 90000 00000'}]});
  await HealthSpherePost.insertMany([
    {userId,category:'Fitness',title:'What helps you stay consistent with walking?',body:'Sharing a fictional demo discussion: small, repeatable goals can be easier to maintain than dramatic changes.'},
    {userId,category:'Nutrition',title:'Hydration habits',body:'A synthetic community post for the hackathon demo. Keep private medical details out of community posts.'},
    {userId,category:'Wellness',title:'What helps you keep a steady sleep routine?',body:'Community discussion only. Do not share private medical information here.'}
  ]);
  console.log('Seed complete: alex.morgan@healthmail.com / ClinicalVault2025#');
  await mongoose.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
