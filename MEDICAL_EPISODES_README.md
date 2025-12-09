# Medical Episode Tracking System

## Overview
The Medical Episode Tracking System allows users to easily record medical emergencies, incidents, and health events with automatic progression tracking (e.g., seizure → ambulance called → hospital visit).

## Features

### 🚨 Comprehensive Medical Issues List
**11 Categories with 50+ Medical Conditions:**

1. **Cardiovascular** ❤️
   - Chest Pain, Heart Attack, Stroke, Angina, Heart Palpitations, High Blood Pressure

2. **Neurological** 🧠
   - Seizure, Severe Migraine, Fainting, Vertigo, Confusion, Memory Loss

3. **Respiratory** 🫁
   - Difficulty Breathing, Asthma Attack, Choking, Pneumonia, Coughing Blood

4. **Trauma & Injury** 🩹
   - Severe Bleeding, Broken Bone, Head Injury, Severe Burn, Laceration, Fall Injury

5. **Gastrointestinal** 🫃
   - Severe Abdominal Pain, Vomiting Blood, Appendicitis, Food Poisoning

6. **Allergic Reactions** 🤧
   - Anaphylaxis, Severe Allergic Reaction, Allergic Rash

7. **Metabolic** ⚡
   - Diabetic Emergency, Hypoglycemia, Hyperglycemia, Dehydration

8. **Obstetric/Pregnancy** 🤰
   - Labor, Pregnancy Bleeding, Eclampsia, Pregnancy Complications

9. **Mental Health** 🧘
   - Panic Attack, Suicidal Thoughts, Psychotic Episode, Severe Anxiety

10. **Poisoning/Overdose** ☠️
    - Drug Overdose, Poisoning, Carbon Monoxide, Alcohol Poisoning

11. **Other Emergencies** 🆘
    - Electric Shock, Drowning, Hypothermia, Heat Stroke, Severe Infection

### 🔄 Automatic Progression Tracking
When recording a medical episode, the system automatically:
- Marks ambulance services as "visited" if ambulance was called
- Marks hospitals as "visited" if hospital treatment was received
- Increments visit counts for services
- Records timestamps for all events
- Links episodes to existing health records

### 📊 Severity Levels
Each medical issue has an assigned severity:
- **🔴 Critical**: Life-threatening emergencies (requires immediate 999 call)
- **🟠 High**: Serious conditions (typically requires emergency care)
- **🟡 Medium**: Concerning issues (may require urgent care)
- **🟢 Low**: Minor issues (can usually wait for GP)

### 📝 Episode Data Structure
```javascript
{
  id: "episode_1234567890",
  issueId: "seizure",
  issueName: "Seizure",
  category: "Neurological",
  severity: "critical",
  timestamp: "2024-12-09T10:30:00Z",
  notes: "Had a seizure at work, lasted about 2 minutes",
  progression: [
    {
      type: "ambulance_called",
      serviceName: "London Ambulance Service",
      arrivalTime: "10:45",
      timestamp: "2024-12-09T10:32:00Z"
    },
    {
      type: "hospital_arrival",
      hospitalName: "St. Thomas' Hospital",
      arrivalTime: "11:15",
      treatmentType: "emergency",
      timestamp: "2024-12-09T11:15:00Z"
    }
  ],
  status: "active",
  requiresAmbulance: true,
  requiresHospital: true
}
```

## User Flow

### Recording a Medical Episode

1. **Click "New Medical Episode" Button**
   - Large, prominent button on dashboard
   - Pink/purple gradient styling
   - Icon: 🚨

2. **Select Category & Issue**
   - Browse 11 medical categories
   - Click on specific medical issue
   - See severity level and icons (🚑🏥)

3. **Enter Episode Details**
   - Date/time of incident
   - Notes and description
   - Progression checkboxes:
     - ✅ Ambulance called → Enter service name & arrival time
     - ✅ Hospital visit → Enter hospital, arrival, treatment type

4. **Save Episode**
   - Automatic service marking
   - Counts updated
   - Success notification shown

## Integration Points

### Dashboard Statistics
- **Medical Episodes Count**: Total episodes recorded
- Updates in real-time when new episodes added

### Service Tracking
```javascript
// Automatically marks services as visited
await episodeManager.markAmbulanceService("London Ambulance");
await episodeManager.markHospitalVisit("Guy's Hospital");
```

### Data Manager Integration
```javascript
// Episodes stored in Firebase Firestore
data.medicalEpisodes = [
  { id: "episode_1", ... },
  { id: "episode_2", ... }
]
```

## API Methods

### MedicalEpisodeManager Class

```javascript
// Create new episode
const episode = episodeManager.createEpisode(issueId, categoryKey);

// Add progression step
await episodeManager.addProgression(episodeId, 'ambulance_called', {
  serviceName: 'NHS',
  arrivalTime: '10:45'
});

// Save to database
await episodeManager.saveEpisode(episode);

// Query episodes
const recent = episodeManager.getRecentEpisodes(10);
const dateRange = episodeManager.getEpisodesByDateRange(startDate, endDate);
```

## Visual Design

### Enhanced Dashboard Styling
- **Background**: Purple to pink gradient with subtle dot pattern
- **Stat Cards**: Animated gradient cards with hover effects
- **Buttons**: Pink gradient with ripple animation on click
- **Glass Morphism**: Frosted glass effect on list cards
- **Text**: White text on gradients with drop shadows

### Color Scheme
- Primary: Purple (#667eea) to Pink (#f5576c)
- Accent: Blue to Cyan for secondary elements
- Success: Green notifications
- Warning: Orange/Yellow for medium severity
- Error: Red for critical severity

## Future Enhancements

1. **Timeline View**: Visual timeline of episode progressions
2. **Export Reports**: PDF export for doctor visits
3. **Symptom Correlation**: Link episodes to tracked symptoms
4. **Medication Tracking**: Connect episodes to medication changes
5. **Emergency Contacts**: Quick call buttons during episode recording
6. **Voice Recording**: Audio notes during/after episode
7. **Photo Upload**: Attach medical images to episodes
8. **Sharing**: Share episode details with healthcare providers

## Usage Examples

### Example 1: Seizure with Full Progression
```
User clicks "New Medical Episode"
→ Selects "Neurological" → "Seizure"
→ Enters time: 10:30 AM
→ Checks "Ambulance called"
  → Enters: "London Ambulance Service", arrived 10:45
→ Checks "Hospital visit"
  → Enters: "King's College Hospital", arrived 11:30, "Emergency Department"
→ Adds notes: "First seizure, lasted 2 minutes, felt confused after"
→ Clicks "Save Episode"

Result:
✅ Episode recorded
✅ London Ambulance Service marked as visited (+1 count)
✅ King's College Hospital marked as visited (+1 count)
✅ Dashboard stats updated
🎉 Success notification shown
```

### Example 2: Minor Injury (No Services)
```
User clicks "New Medical Episode"
→ Selects "Trauma & Injury" → "Sprain/Strain"
→ Enters time: 2:00 PM
→ Adds notes: "Twisted ankle playing football"
→ Clicks "Save Episode"

Result:
✅ Episode recorded
📊 Stats updated (no services marked)
```

## Technical Notes

- All episodes stored in Firestore under `users/{userId}/medicalEpisodes`
- Timestamps in ISO 8601 format
- Service matching uses case-insensitive partial matching
- Progression steps are immutable once added
- Episodes can be queried by date, severity, category
- Real-time synchronization with Firebase

---

**Version**: 1.0  
**Last Updated**: December 9, 2024  
**File**: `/public/js/features/medicalEpisodes.js`
