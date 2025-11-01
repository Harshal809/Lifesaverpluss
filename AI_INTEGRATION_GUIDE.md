# AI Integration Guide

This project now includes AI-powered features using Google Gemini API.

## 🚀 Setup

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 2. Restart Dev Server
```bash
npm run dev
```

## 🤖 AI Features Implemented

### 1. **AI Symptom Checker** (User Dashboard)
- **Location**: User Dashboard header (purple "AI Check" button)
- **Features**:
  - Symptom analysis with possible conditions
  - Urgency assessment (low/medium/high/critical)
  - Medical recommendations
  - Suggested actions
  - Direct SOS trigger for critical cases
- **Component**: `src/components/AISymptomChecker.tsx`

### 2. **AI-Enhanced SOS Descriptions** (SOS Button)
- **Location**: Automatically enhances SOS request descriptions
- **Features**:
  - Improves emergency descriptions with AI
  - Adds medical context for better responder understanding
- **Integration**: `src/components/r/SOSButton.tsx`

### 3. **AI Priority Suggestions** (Hospital Dashboard)
- **Location**: Hospital Dashboard Emergency tab
- **Features**:
  - Auto-analyzes active SOS requests
  - Suggests priority levels (critical/high/medium/low)
  - Provides reasoning for priority assignments
- **Component**: `src/components/AIPrioritySuggestor.tsx`

### 4. **AI Hook** (`useGeminiAI`)
- **Location**: `src/hooks/useGeminiAI.tsx`
- **Functions Available**:
  - `callGemini(prompt, systemPrompt)` - General AI calls
  - `prioritizeEmergency(symptoms, location)` - Emergency prioritization
  - `suggestBestResponder(type, symptoms, responders)` - Responder matching
  - `predictCapacity(requests, time, day)` - Capacity predictions
  - `enhanceDescription(description)` - Description enhancement

## 📋 Additional AI Integration Ideas

### Responder Dashboard
```typescript
// AI-powered responder matching
const { suggestBestResponder } = useGeminiAI();
const bestMatch = await suggestBestResponder(
  emergencyType,
  symptoms,
  availableResponders
);
```

### Hospital Dashboard
```typescript
// AI capacity prediction
const { predictCapacity } = useGeminiAI();
const prediction = await predictCapacity(
  activeRequests,
  currentTime,
  dayOfWeek
);
```

### Medical Reports
```typescript
// AI health insights
const insights = await callGemini(
  `Analyze this medical history: ${medicalData}`,
  'You are a medical AI assistant providing health insights.'
);
```

## 🔧 Usage Examples

### Example 1: Symptom Checker
```typescript
import AISymptomChecker from '@/components/AISymptomChecker';

const [showChecker, setShowChecker] = useState(false);

<AISymptomChecker 
  isOpen={showChecker} 
  onClose={() => setShowChecker(false)} 
/>
```

### Example 2: Custom AI Function
```typescript
import { useGeminiAI } from '@/hooks/useGeminiAI';

const { callGemini } = useGeminiAI();

const response = await callGemini(
  'What should I do for a headache?',
  'You are a helpful medical assistant.'
);
```

### Example 3: Emergency Prioritization
```typescript
import { useGeminiAI } from '@/hooks/useGeminiAI';

const { prioritizeEmergency } = useGeminiAI();

const analysis = await prioritizeEmergency(
  'Chest pain and shortness of breath',
  'Hospital location'
);
// Returns: { priority: 'high', reasoning: '...' }
```

## 🛡️ Error Handling

All AI functions include error handling:
- Returns empty result if API key missing
- Shows user-friendly error messages
- Falls back gracefully on failures
- Logs errors to console for debugging

## ⚠️ Important Notes

1. **API Key Security**: Never commit API keys to git
2. **Rate Limits**: Be mindful of Gemini API rate limits
3. **Cost**: Monitor API usage costs
4. **Medical Disclaimer**: AI suggestions are not medical advice
5. **Responsibility**: Always verify AI outputs before critical actions

## 🎯 Future Enhancements

- [ ] AI-powered responder route optimization
- [ ] Predictive analytics for emergency patterns
- [ ] Natural language query interface
- [ ] AI chat assistant for users
- [ ] Automated report generation
- [ ] Voice-to-text symptom input
- [ ] Multi-language support via AI translation

