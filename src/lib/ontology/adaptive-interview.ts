export interface ClinicalConversationTurn {
  role: 'ai' | 'patient';
  content: string;
  timestamp: string;
  language?: 'hi' | 'en';
}

export interface ExtractedClinicalSlots {
  chiefComplaint?: string;
  anatomicalLocation?: string;
  durationOnset?: string;
  characterQuality?: string;
  severityNumber?: number;
  radiationLocation?: string;
  associatedSymptoms?: string[];
  aggravatingFactors?: string[];
  relievingFactors?: string[];
  pastHistory?: string[];
  allergies?: string[];
  currentMeds?: string[];
  isRedFlagTriggered?: boolean;
  redFlagSymptoms?: string[];
  recommendedSpecialty?: string;
}

export interface AdaptiveInterviewState {
  turns: ClinicalConversationTurn[];
  extractedSlots: ExtractedClinicalSlots;
  isComplete: boolean;
  nextSuggestedDimension?: string;
}

export class AdaptiveClinicalInterviewEngine {
  public parsePatientInput(
    latestText: string,
    existingSlots: ExtractedClinicalSlots
  ): ExtractedClinicalSlots {
    const text = latestText.toLowerCase();
    const slots: ExtractedClinicalSlots = {
      ...existingSlots,
      associatedSymptoms: [...(existingSlots.associatedSymptoms || [])],
      pastHistory: [...(existingSlots.pastHistory || [])],
      redFlagSymptoms: [...(existingSlots.redFlagSymptoms || [])],
    };

    // 1. Chief Complaint & Anatomical Location (Preserve established primary complaint unless empty)
    if (!slots.chiefComplaint || text.includes('chest') || text.includes('सीन') || text.includes('छाती') || text.includes('heart') || text.includes('knee') || text.includes('घुटन')) {
      if (
        text.includes('chest') ||
        text.includes('सीन') || // matches सीना, सीने, सीनों
        text.includes('छाती') ||
        text.includes('हार्ट') ||
        text.includes('हृदय') ||
        text.includes('seena') ||
        text.includes('dil') ||
        text.includes('heart') ||
        text.includes('chhati') ||
        text.includes('cardio')
      ) {
        slots.chiefComplaint = 'Chest Pain / Discomfort';
        slots.anatomicalLocation = 'Retrosternal / Precordial Area';
        slots.recommendedSpecialty = 'Cardiology';
      } else if (
        text.includes('knee') ||
        text.includes('joint') ||
        text.includes('घुटन') || // matches घुटना, घुटने
        text.includes('जोड़') ||
        text.includes('ghutna') ||
        text.includes('jod') ||
        text.includes('sandhi') ||
        text.includes('arthritis')
      ) {
        slots.chiefComplaint = 'Joint Pain / Stiffness';
        slots.anatomicalLocation = 'Knee / Peripheral Joints';
        slots.recommendedSpecialty = 'Ayurveda & AYUSH';
      } else if (
        text.includes('stomach') ||
        text.includes('pet') ||
        text.includes('पेट') ||
        text.includes('abdomen') ||
        text.includes('gas') ||
        text.includes('acidity')
      ) {
        slots.chiefComplaint = 'Abdominal Pain / Dyspepsia';
        slots.anatomicalLocation = 'Epigastric / Abdomen';
        slots.recommendedSpecialty = 'Gastroenterology';
      } else if (
        text.includes('fever') ||
        text.includes('bukhar') ||
        text.includes('बुखार') ||
        text.includes('temperature') ||
        (text.includes('cold') && !text.includes('sweat')) ||
        text.includes('cough')
      ) {
        slots.chiefComplaint = 'Febrile Illness / Pyrexia';
        slots.recommendedSpecialty = 'General Medicine';
      } else if (text.includes('skin') || text.includes('rash') || text.includes('itching') || text.includes('khujli') || text.includes('त्वचा')) {
        slots.chiefComplaint = 'Dermatological Rash / Pruritus';
        slots.recommendedSpecialty = 'Dermatology';
      } else if (!slots.chiefComplaint) {
        slots.chiefComplaint = latestText.slice(0, 50);
        slots.recommendedSpecialty = 'General Medicine';
      }
    }

    // 2. Character & Quality
    if (text.includes('crushing') || text.includes('pressure') || text.includes('dabav') || text.includes('दबाव') || text.includes('squeezing') || text.includes('bhari')) {
      slots.characterQuality = 'Crushing Pressure / Squeezing Heaviness';
    } else if (text.includes('sharp') || text.includes('stabbing') || text.includes('chubhan') || text.includes('चुभन')) {
      slots.characterQuality = 'Sharp / Stabbing';
    } else if (text.includes('burning') || text.includes('jalan') || text.includes('जलन')) {
      slots.characterQuality = 'Burning';
    } else if (text.includes('stiff') || text.includes('akdan') || text.includes('अकड़न') || text.includes('jamav')) {
      slots.characterQuality = 'Morning Stiffness / Joint Crepitus';
    } else if (text.includes('throbbing') || text.includes('dull')) {
      slots.characterQuality = 'Dull Throbbing Ache';
    }

    // 3. Duration & Onset
    if (text.includes('hour') || text.includes('ghante') || text.includes('घंटे') || text.includes('minute') || text.includes('subah') || text.includes('morning') || text.includes('aaj')) {
      slots.durationOnset = 'Acute onset (< 24 hours)';
    } else if (text.includes('day') || text.includes('din') || text.includes('दिन') || text.includes('kal') || text.includes('yesterday')) {
      slots.durationOnset = 'Recent onset (1-3 days)';
    } else if (text.includes('week') || text.includes('month') || text.includes('saal') || text.includes('year') || text.includes('hafta') || text.includes('महीने')) {
      slots.durationOnset = 'Chronic (> several weeks)';
    }

    // 4. Radiation Location
    if (text.includes('arm') || text.includes('left arm') || text.includes('haath') || text.includes('हाथ') || text.includes('baju')) {
      slots.radiationLocation = 'Left Arm / Shoulder';
    }
    if (text.includes('jaw') || text.includes('neck') || text.includes('gale') || text.includes('jabde') || text.includes('जबड़ा') || text.includes('gala')) {
      slots.radiationLocation = slots.radiationLocation ? `${slots.radiationLocation} & Jaw/Neck` : 'Jaw & Neck';
    }

    // 5. Associated Symptoms & Red Flags
    if (text.includes('sweat') || text.includes('pasina') || text.includes('पसीना') || text.includes('diaphoresis')) {
      if (!slots.associatedSymptoms?.includes('Cold Sweating / Diaphoresis')) {
        slots.associatedSymptoms?.push('Cold Sweating / Diaphoresis');
      }
      slots.redFlagSymptoms?.push('Profuse Diaphoresis');
      slots.isRedFlagTriggered = true;
    }
    if (text.includes('breath') || text.includes('saans') || text.includes('सांस') || text.includes('dyspnea') || text.includes('choking')) {
      if (!slots.associatedSymptoms?.includes('Shortness of Breath / Dyspnea')) {
        slots.associatedSymptoms?.push('Shortness of Breath / Dyspnea');
      }
      slots.redFlagSymptoms?.push('Acute Dyspnea');
      slots.isRedFlagTriggered = true;
    }
    if (text.includes('dizzy') || text.includes('chakkar') || text.includes('चक्कर') || text.includes('faint') || text.includes('behosh')) {
      if (!slots.associatedSymptoms?.includes('Dizziness / Presyncope')) {
        slots.associatedSymptoms?.push('Dizziness / Presyncope');
      }
      slots.redFlagSymptoms?.push('Presyncope / Dizziness');
      slots.isRedFlagTriggered = true;
    }
    if (text.includes('swelling') || text.includes('sujan') || text.includes('सूजन')) {
      if (!slots.associatedSymptoms?.includes('Peripheral Swelling / Edema')) {
        slots.associatedSymptoms?.push('Peripheral Swelling / Edema');
      }
    }

    // 6. Severity parsing (e.g. "8/10", "8", "bahut jyada", "severe")
    const numMatch = text.match(/\b([1-9]|10)\b/);
    if (numMatch) {
      slots.severityNumber = parseInt(numMatch[1], 10);
    } else if (text.includes('severe') || text.includes('bahut tej') || text.includes('बहुत ज्यादा') || text.includes('unbearable')) {
      slots.severityNumber = 9;
    } else if (text.includes('moderate') || text.includes('theek theek') || text.includes('madhyam')) {
      slots.severityNumber = 5;
    } else if (text.includes('mild') || text.includes('halka') || text.includes('हल्का')) {
      slots.severityNumber = 3;
    }

    // 7. Medical History
    if (text.includes('bp') || text.includes('hypertension') || text.includes('blood pressure')) {
      if (!slots.pastHistory?.includes('Hypertension')) slots.pastHistory?.push('Hypertension');
    }
    if (text.includes('sugar') || text.includes('diabetes') || text.includes('madhumeh')) {
      if (!slots.pastHistory?.includes('Diabetes Mellitus')) slots.pastHistory?.push('Diabetes Mellitus');
    }

    return slots;
  }

  public generateNextQuestion(
    slots: ExtractedClinicalSlots,
    language: 'hi' | 'en',
    turnCount: number
  ): { questionText: string; isReadyForStep2: boolean } {
    const isHi = language === 'hi';

    // Priority 1: Check Onset & Duration if missing
    if (!slots.durationOnset) {
      return {
        questionText: isHi
          ? 'यह समस्या कब शुरू हुई? क्या यह अचानक शुरू हुई है या कुछ दिनों/हफ्तों से बनी हुई है?'
          : 'When did this issue start? Did it begin suddenly or has it been ongoing for several days/weeks?',
        isReadyForStep2: false,
      };
    }

    // Priority 2: Check Pain Character & Sensation if missing
    if (!slots.characterQuality) {
      return {
        questionText: isHi
          ? 'यह दर्द या अहसास किस प्रकार का है? क्या यह भारी दबाव जैसा है, चुभन जैसा, जलन जैसा या तेज दर्द है?'
          : 'How would you describe the feeling? Is it heavy pressure/squeezing, sharp stabbing, burning, or a dull ache?',
        isReadyForStep2: false,
      };
    }

    // Priority 3: Check Severity if missing
    if (!slots.severityNumber) {
      return {
        questionText: isHi
          ? '1 से 10 के पैमाने पर आप इस दर्द या तकलीफ की तीव्रता को कितना अंक देंगे (जहाँ 1 हल्का और 10 असहनीय हो)?'
          : 'On a scale of 1 to 10 (where 1 is mild and 10 is unbearable), how severe is your discomfort?',
        isReadyForStep2: false,
      };
    }

    // Priority 4: Check Radiation / Spread if Chest or Joint
    if (!slots.radiationLocation && (slots.chiefComplaint?.includes('Chest') || slots.chiefComplaint?.includes('Pain'))) {
      return {
        questionText: isHi
          ? 'क्या यह दर्द आपके बाएँ हाथ, कंधे, गर्दन या जबड़े की तरफ भी फैल रहा है?'
          : 'Does the pain spread anywhere else, such as your left arm, shoulder, neck, or jaw?',
        isReadyForStep2: false,
      };
    }

    // Priority 5: Associated Red-Flag Check
    if (!slots.associatedSymptoms || slots.associatedSymptoms.length === 0) {
      return {
        questionText: isHi
          ? 'क्या आपको इसके साथ ठंडा पसीना, सांस लेने में तकलीफ, घबराहट या चक्कर जैसा महसूस हो रहा है?'
          : 'Are you experiencing any other symptoms along with this, like cold sweating, breathlessness, or dizziness?',
        isReadyForStep2: false,
      };
    }

    // Priority 6: Past Medical History & Medications
    if (!slots.pastHistory || slots.pastHistory.length === 0) {
      return {
        questionText: isHi
          ? 'क्या आपको पहले से हाई बीपी, शुगर (डायबिटीज), थायरॉयड या हृदय की कोई बीमारी है और क्या आप कोई दवा ले रहे हैं?'
          : 'Do you have any past medical history like High BP, Diabetes, Thyroid, or Heart disease, or currently take medications?',
        isReadyForStep2: turnCount >= 3,
      };
    }

    // Concluding Turn
    return {
      questionText: isHi
        ? 'धन्यवाद, आपके बताए लक्षणों का रिकॉर्ड तैयार कर लिया गया है। अब अगले चरण में कुछ विशिष्ट आयुर्वेदिक और जीवनशैली प्रश्न देखते हैं।'
        : 'Thank you, your clinical history has been accurately captured. Let us now proceed to Step 2 for the Ayurvedic & Lifestyle Assessment.',
      isReadyForStep2: true,
    };
  }
}

export const adaptiveInterviewEngine = new AdaptiveClinicalInterviewEngine();
