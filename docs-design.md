# HEALTHMEMORY 360 — UI/UX DESIGN DOCUMENT

> **“Remember your health. Understand your journey. Live better.”**

**Hackathon:** HACKNOVA 24-Hour Hackathon  
**Theme:** Healthcare  
**Product:** HealthMemory 360  
**Platform:** Responsive Web App / PWA

---

## 1. Product Overview

HealthMemory 360 is an AI-powered personal health memory platform that brings medical records, physical health, fitness, mental wellness, nutrition, and personal health history into one organized health journey.

The product helps users:

1. Upload medical documents
2. Extract structured information using AI
3. Organize records chronologically
4. View their health timeline
5. Compare previous and latest reports
6. Track physical health
7. Track fitness
8. Track mental wellness
9. Track nutrition
10. Ask an AI assistant about stored records
11. Generate a concise doctor-visit brief

### Healthcare Boundary

HealthMemory 360 is **not a medical diagnosis application**.

It should:

- Organize information
- Visualize recorded information
- Compare user-provided values
- Summarize stored records
- Help users prepare for conversations with healthcare professionals

It should **not**:

- Diagnose diseases
- Prescribe medication
- Claim to replace doctors
- Make unsupported medical recommendations

Preferred wording:

- “Your records show…”
- “This value changed from…”
- “Consider discussing this with your healthcare professional.”

---

# 2. Platform Strategy

| Platform | Role | Priority |
|---|---|---|
| Responsive Web / PWA | Primary hackathon product and judge demo | HIGH |
| Desktop | Full dashboard, timeline, comparison and AI experience | HIGH |
| Mobile Responsive | Upload, timeline, AI chat and quick tracking | HIGH |

### Recommendation

Build the product as a **responsive web application / PWA**.

The desktop experience should be the primary hackathon demo, while the mobile layout should remain fully usable.

---

# 3. Brand & Visual Direction

### Visual Personality

- Premium
- Calm
- Trustworthy
- Intelligent
- Human
- Minimal
- Data-driven
- Modern
- Slightly futuristic
- Production-ready

The application should feel like a **premium health-tech startup**, not a traditional hospital portal, generic fitness app, or generic AI chatbot.

### Avoid

- Old-fashioned hospital UI
- Excessive medical blue
- Cartoon doctors
- Robot illustrations
- Excessive gradients
- Excessive glassmorphism
- Cluttered dashboards
- Too many colors
- Huge paragraphs
- Cheap-looking UI

Use generous whitespace and strong visual hierarchy.

---

# 4. Color System

| Token | Suggested Color | Usage |
|---|---|---|
| Primary | Deep Navy / Midnight | Navigation, major headings, brand |
| Secondary | Teal | Primary interactive elements |
| Accent | Soft Mint | Positive trends, wellness |
| AI | Subtle Purple | AI actions and assistant |
| Background | Warm Off-White | Main canvas |
| Text | Dark Charcoal | Body text |
| Warning | Amber | Attention |
| Urgent | Red | Urgent/emergency states only |

### Theme

Default:

**Light Mode**

The system should remain compatible with dark mode.

---

# 5. Typography

Use a modern sans-serif font such as:

- Inter
- Geist
- Manrope

### Typography hierarchy

- Large display headings for page titles
- Medium section headings
- Readable body text
- Strong numerical typography for health metrics
- Highly readable medical values

Do not use decorative fonts.

---

# 6. Information Architecture

## Main Navigation

- Dashboard
- My Health
- Medical Records
- Health Timeline
- Physical Health
- Fitness
- Mental Wellness
- Nutrition
- Health Insights
- Ask HealthMemory
- Doctor Brief

## Secondary Navigation

- Profile
- Settings
- Privacy & Security
- Notifications

---

# 7. Desktop Navigation

Use:

**Left Sidebar + Top Header + Main Content**

### Sidebar

HealthMemory 360 logo

- Dashboard
- My Health
- Medical Records
- Health Timeline
- Physical Health
- Fitness
- Mental Wellness
- Nutrition
- Health Insights
- Ask HealthMemory
- Doctor Brief

Bottom:

- Profile
- Settings
- Privacy

### Top Header

- Search
- Notifications
- Ask HealthMemory
- User avatar

Active navigation should have:

- Subtle accent background
- Clear icon state
- Strong text hierarchy

---

# 8. Mobile Navigation

Bottom navigation:

1. Home
2. Timeline
3. Records
4. Fitness
5. AI

Additional modules:

- Physical Health
- Mental Wellness
- Nutrition
- Doctor Brief
- Settings

Use a floating or prominent:

**Ask HealthMemory**

action.

---

# 9. Screen Inventory

HealthMemory 360 contains **15 primary screens**.

| # | Screen | Purpose |
|---:|---|---|
| 01 | Landing Page | Product story and CTA |
| 02 | Login / Signup | Authentication |
| 03 | Dashboard | Central health overview |
| 04 | Medical Records | Document vault |
| 05 | Upload Medical Record | Upload PDF/image |
| 06 | AI Processing | AI document analysis |
| 07 | Extracted Record Review | Review/edit extracted data |
| 08 | Health Timeline | Chronological health journey |
| 09 | Report Comparison | Previous vs latest report |
| 10 | Physical Health | Recorded health metrics |
| 11 | Fitness | Age-aware activity dashboard |
| 12 | Mental Wellness | Mood, stress, sleep and energy |
| 13 | Nutrition | Nutrition overview |
| 14 | Ask HealthMemory | AI assistant |
| 15 | Doctor Brief | Record-based visit summary |

---

# 10. Screen 01 — Landing Page

## Hero

### HEALTHMEMORY 360

> **Your complete health journey, remembered intelligently.**

Supporting text:

> Bring your medical records, health activity, wellness and personal health history together in one intelligent health memory.

### Actions

- **Get Started**
- **Explore Demo**

### Hero Visual

Show:

```text
Medical Records
       ↓
      AI
       ↓
Health Timeline
       ↓
   Insights
       ↓
Personal Health Journey
```

### Landing Page Sections

1. The Problem
2. The Solution
3. How It Works
4. Core Features
5. AI Health Memory
6. Health Timeline
7. Report Comparison
8. Privacy
9. Final CTA

---

# 11. Screen 02 — Login / Signup

Create a clean authentication experience.

### Elements

- Logo
- Welcome back
- Email
- Password
- Sign In
- Continue with Google
- Create account
- Forgot password

Use a premium minimal layout.

---

# 12. Screen 03 — Dashboard

This is the **main product screen**.

### Header

> Good morning, Alex 👋

> Here's your health overview.

### Primary Actions

- `+ Upload Record`
- `✨ Ask HealthMemory`

### Health Overview

#### Physical Health

- Weight: 72 kg
- Blood Pressure: 128/82
- Blood Glucose: 108 mg/dL
- Cholesterol: 212 mg/dL

#### Fitness

- Steps: 7,820
- Active Time: 42 min
- Workout: 32 min

#### Mental Wellness

- Mood: 🙂 Good
- Stress: Moderate
- Sleep: 7h 12m

#### Nutrition

- Water: 1.8 L
- Protein: Good
- Fruit & Vegetables: Good

### Additional Sections

- Recent Health Changes
- Health Timeline Preview
- Recent Medical Records
- Ask HealthMemory CTA

Use fictional demo data and label it as demo data.

---

# 13. Screen 04 — Medical Records

### Header

**Medical Records**

> All your health documents, organized in one place.

### Primary Action

`+ Upload Record`

### Filters

- All
- Reports
- Prescriptions
- Scans
- Other

### Document Cards

Example:

**Blood Test**  
12 Aug 2026  
PDF

**Prescription**  
02 Aug 2026  
Image

**Health Check**  
14 Jul 2026  
PDF

Each card should contain:

- Document icon
- Name
- Date
- Type
- AI Extracted badge
- View
- Compare
- More

---

# 14. Screen 05 — Upload Medical Record

### Header

**Upload Medical Record**

Create a large upload zone:

> Drop your medical report here

> or choose a file

Supported:

- PDF
- JPG
- PNG

Actions:

- Choose File
- Take Photo

`Take Photo` is particularly useful on mobile.

---

# 15. Screen 06 — AI Processing

This is a **hero demo screen**.

### Header

> Analyzing your health record...

### Processing Stages

```text
✓ Reading document

✓ Extracting information

✓ Identifying dates

✓ Structuring health data

● Updating health timeline
```

Use a sophisticated AI/data-processing animation.

Avoid cartoon robots.

Possible animation concepts:

- Document scan
- Neural lines
- Data particles
- Structured data appearing
- Timeline update

Final state:

> **Your health record has been organized.**

CTA:

**View Record**

---

# 16. Screen 07 — Extracted Record Review

Example:

### Blood Test

**12 August 2026**

Badge:

**AI Extracted**

### Extracted Information

| Metric | Value |
|---|---:|
| Hemoglobin | 12.4 g/dL |
| Glucose | 108 mg/dL |
| Cholesterol | 212 mg/dL |
| Vitamin D | 21 ng/mL |

Each field should be editable.

Actions:

- Edit
- Confirm & Save

Include:

> Extracted from uploaded document.

---

# 17. Screen 08 — Health Timeline

## SIGNATURE SCREEN #1

### Header

**My Health Journey**

> Your health story, organized over time.

Create a beautiful vertical chronological timeline.

Example:

```text
2026

│
├── 🩸 Blood Test
│   Aug 12
│
├── 💊 Prescription
│   Aug 02
│
├── 🩺 Health Check
│   Jul 14
│
└── 🏃 Fitness Milestone
    Jul 01

2025

├── 🩸 Blood Test
└── 🩺 Health Check
```

### Filters

- All
- Medical
- Fitness
- Wellness
- Nutrition

Each timeline event should contain:

- Date
- Icon
- Title
- Short description
- Source
- View Details

The timeline should become the **visual identity of HealthMemory 360**.

---

# 18. Screen 09 — Report Comparison

## SIGNATURE SCREEN #2

### Header

**Compare Health Reports**

Selectors:

- Previous Report
- Latest Report

Example:

| Metric | Previous | Latest |
|---|---:|---:|
| Hemoglobin | 11.2 | 12.4 |
| Glucose | 118 | 108 |
| Cholesterol | 230 | 212 |
| Vitamin D | 18 | 21 |

Use visual indicators:

- Increased
- Decreased
- Stable

### Changes Detected

**Hemoglobin**

11.2 → 12.4

**Glucose**

118 → 108

**Cholesterol**

230 → 212

Create a beautiful trend visualization.

### AI Summary

> Your latest report contains several changes compared with the previous report.

Do not diagnose.

---

# 19. Screen 10 — Physical Health

### Header

**Physical Health**

Sections:

- Body Metrics
- Blood Pressure
- Blood Glucose
- Cholesterol
- Heart Health Records

Example:

```text
Weight
72 kg

BMI
24.8

Blood Pressure
128/82

Glucose
108 mg/dL

Cholesterol
212 mg/dL
```

### Time Filters

- 7D
- 30D
- 6M
- 1Y

Use wording such as:

> Recorded values

rather than implying diagnosis.

---

# 20. Screen 11 — Fitness

### Header

**Fitness**

### Age Selector

- 10–16
- 18–40
- 40–60
- 60–80

Default:

**18–40**

### Metrics

- Steps: 7,820
- Active Minutes: 42
- Workout: 32 min
- Calories: Demo value

### Weekly Activity

Create a beautiful activity chart.

### Activity Categories

- Cardio
- Strength
- Flexibility
- Mobility
- Outdoor Activity

### Age 10–16

- Cardio
- Bodyweight Strength
- Flexibility
- Bone Strengthening
- Outdoor Play

### Age 40–60

- Cardio
- Strength Maintenance
- Mobility
- Flexibility

### Age 60–80

- Mobility
- Balance
- Flexibility
- Safe Physical Activity

Use general wellness guidance.

---

# 21. Screen 12 — Mental Wellness

### Header

**Mental Wellness**

> Check in with yourself.

### Mood Check-In

- 😊 Great
- 🙂 Good
- 😐 Okay
- 😟 Difficult
- 😔 Very difficult

### Additional Metrics

- Stress
- Sleep
- Energy

Create a weekly mood visualization.

Add:

**Wellness Journal**

This screen must remain supportive and non-diagnostic.

---

# 22. Screen 13 — Nutrition

### Header

**Nutrition**

### Today's Overview

- Water: 1.8 L
- Protein: Good
- Fruits & Vegetables: Good
- Whole Grains: Good
- Processed Food: Moderate
- Sugary Drinks: Low

Create elegant progress indicators.

Add:

**Weekly Nutrition**

Use simple visualizations.

Keep nutrition guidance general rather than presenting medical dietary prescriptions.

---

# 23. Screen 14 — Ask HealthMemory

## SIGNATURE SCREEN #3

### Header

**Ask HealthMemory**

> Ask questions about your stored health records.

Create a premium AI chat interface.

### Suggested Questions

- “When was my last blood test?”
- “What changed in my latest report?”
- “Show my health history.”
- “What records did I upload this year?”
- “Compare my latest reports.”

### Example AI Response

> Your latest blood test was recorded on 12 August 2026.
>
> Compared with your previous report:
>
> - Hemoglobin: 11.2 → 12.4
> - Glucose: 118 → 108
> - Cholesterol: 230 → 212
>
> Sources:
> - Blood Test — 12 Aug 2026
> - Blood Test — 14 Jun 2025

Show clickable source chips.

Example:

`[ Blood Test · Aug 2026 ]`

The AI interface should feel premium and trustworthy, not like a generic chatbot.

---

# 24. Screen 15 — Doctor Brief

### Header

**Prepare for Your Doctor Visit**

> Create a concise summary from your stored records.

Primary action:

**Generate Doctor Brief**

### Show

- Recent Medical Records
- Recent Reports
- Important Timeline Events
- Recent Recorded Metrics

### Generated Summary

- Recent Health Records
- Recent Reports
- Recorded Values
- Recent Medications
- Timeline Events
- Questions to Discuss

Action:

**Export PDF**

Clearly state:

> Generated from your stored records.

Do not make medical recommendations.

---

# 25. Reusable Component Library

Create reusable components for:

- Button
- Icon Button
- Badge
- Metric Card
- Health Metric Card
- Medical Record Card
- Timeline Event
- Upload Zone
- Chart
- Trend Indicator
- Progress Bar
- Tabs
- Filter
- Dropdown
- AI Chat Message
- Source Citation
- Modal
- Drawer
- Toast
- Notification
- Search
- Date Picker
- Profile Avatar
- Navigation Item

---

# 26. Empty States

Create polished empty states.

### No Medical Records

> **Your health story starts here.**

CTA:

`Upload Your First Record`

Also create empty states for:

- No fitness data
- No wellness check-ins
- No nutrition records
- No timeline events

---

# 27. Loading States

Create skeleton loaders for:

- Dashboard
- Timeline
- Medical Records
- Charts
- AI responses

---

# 28. Error States

Create:

- Upload failed
- Unsupported file
- AI extraction failed
- Network error
- No comparison data
- AI unavailable

Every error must provide a clear recovery action.

---

# 29. Micro-Interactions

Use subtle premium animations.

### Upload

File appears → progress → AI scan → success

### Timeline

Events smoothly appear.

### Charts

Animate on load.

### AI

Subtle typing indicator.

### Buttons

Small hover/press feedback.

Do not overanimate.

---

# 30. Data Visualization

Use:

- Line charts
- Bar charts
- Progress rings
- Trend indicators
- Timeline graphics

Charts must be:

- Minimal
- Readable
- Accessible

Always show:

- Metric
- Unit
- Date/time period

---

# 31. Demo Data

Use fictional demo data.

### User

**Alex Morgan**

Age: 24

### Records

- Blood Test — 12 Aug 2026
- Prescription — 02 Aug 2026
- Health Check — 14 Jul 2026

### Metrics

- Weight: 72 kg
- Blood Pressure: 128/82
- Glucose: 108 mg/dL
- Cholesterol: 212 mg/dL
- Steps: 7,820
- Sleep: 7h 12m

Clearly indicate:

**Demo data**

---

# 32. Privacy & Security

Create a trustworthy privacy experience.

Show:

- Secure account
- Privacy controls
- Data export
- Delete data
- Data access history

Do not claim:

- “HIPAA certified”
- “100% secure”
- Other unsupported certifications

Use:

> **Designed with privacy in mind.**

---

# 33. Accessibility

Use:

- High contrast
- Readable typography
- Visible focus states
- Accessible buttons
- Meaningful labels
- Icons + text where necessary

Never rely only on color to communicate information.

---

# 34. Healthcare UX Boundaries

HealthMemory 360:

- Organizes user-provided health information
- Visualizes recorded values
- Compares records
- Summarizes stored records

It does not:

- Diagnose disease
- Prescribe medication
- Replace a healthcare professional

Preferred language:

> “Your records show…”

> “This value changed from…”

> “Consider discussing this with your healthcare professional.”

Mental wellness screens must not diagnose depression, anxiety or other disorders.

If a user indicates immediate danger or self-harm, the product should provide appropriate emergency/crisis support rather than attempting to manage the crisis with AI.

---

# 35. Hackathon Judge Demo Flow

Target duration:

**2–3 minutes**

### Step 1

Open Dashboard.

↓

### Step 2

Click:

**Upload Record**

↓

### Step 3

Upload sample medical report.

↓

### Step 4

Show AI Processing.

↓

### Step 5

Show extracted values.

↓

### Step 6

Confirm and save.

↓

### Step 7

Open Health Timeline.

Show the new event automatically added.

↓

### Step 8

Open Report Comparison.

Show previous vs latest values.

↓

### Step 9

Open Ask HealthMemory.

↓

### Step 10

Ask:

> “What changed in my latest report?”

↓

### Step 11

Show AI answer with source records.

↓

### Step 12

Generate Doctor Brief.

---

# 36. 24-Hour MVP Priority

## P0 — Must Build

1. Dashboard
2. Medical Records
3. Upload
4. AI Processing
5. Extracted Record
6. Health Timeline
7. Report Comparison

## P1 — Build If Time

8. Ask HealthMemory
9. Physical Health
10. Fitness
11. Mental Wellness
12. Nutrition

## P2 — Optional

13. Doctor Brief
14. Landing Page
15. Login / Profile / Settings

---

# 37. Signature Product Moments

The four most important moments are:

### 1. Upload → AI Extraction → Timeline Update

This demonstrates the product's intelligence.

### 2. Health Timeline

This becomes the visual identity of HealthMemory 360.

### 3. Report Comparison

This demonstrates meaningful use of stored health data.

### 4. Ask HealthMemory

This demonstrates AI grounded in the user's own records.

---

# 38. Final Product Statement

> **HealthMemory 360 transforms scattered health information into one intelligent, understandable health journey.**

The final UI should look:

- Premium
- Modern
- Trustworthy
- Intelligent
- Human
- Minimal
- Professional
- Production-ready
- Hackathon-ready

It should not look like:

- A college assignment
- A basic CRUD dashboard
- A generic healthcare template
- A generic AI chatbot
