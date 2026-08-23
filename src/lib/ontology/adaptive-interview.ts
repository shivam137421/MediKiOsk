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

    // --------------------------------------------------------------------------
    // 1. ANATOMICAL REGION & CHIEF COMPLAINT PARSING
    // --------------------------------------------------------------------------
    
    // Leg / Lower Limb (Pair / Taang / Foot / Calf)
    if (
      text.includes('pair') ||
      text.includes('पैर') ||
      text.includes('पैर में') ||
      text.includes('taang') ||
      text.includes('टांग') ||
      text.includes('leg') ||
      text.includes('pindli') ||
      text.includes('पिंडली') ||
      text.includes('calf') ||
      text.includes('thigh') ||
      text.includes('ankle') ||
      text.includes('foot') ||
      text.includes('feet')
    ) {
      slots.chiefComplaint = 'Leg Pain / Lower Limb Discomfort';
      slots.anatomicalLocation = 'Lower Extremity / Legs';
      slots.recommendedSpecialty = 'Orthopedics / General Medicine';
    } 
    // Knee & Joint / AYUSH
    else if (
      text.includes('knee') ||
      text.includes('joint') ||
      text.includes('घुटन') ||
      text.includes('जोड़') ||
      text.includes('ghutna') ||
      text.includes('jod') ||
      text.includes('sandhi') ||
      text.includes('arthritis')
    ) {
      slots.chiefComplaint = 'Knee & Joint Stiffness';
      slots.anatomicalLocation = 'Knee / Peripheral Joints';
      slots.recommendedSpecialty = 'Ayurveda & AYUSH';
    }
    // Chest / Precordial
    else if (
      text.includes('chest') ||
      text.includes('सीन') ||
      text.includes('छाती') ||
      text.includes('हार्ट') ||
      text.includes('हृदय') ||
      text.includes('seen') || // matches seena, seene, seeno
      text.includes('dil') ||
      text.includes('heart') ||
      text.includes('chhati') ||
      text.includes('cardio')
    ) {
      slots.chiefComplaint = 'Chest Pain / Discomfort';
      slots.anatomicalLocation = 'Retrosternal / Precordial Area';
      slots.recommendedSpecialty = 'Cardiology';
    }
    // Abdomen / GI / Stomach
    else if (
      text.includes('stomach') ||
      text.includes('pet') ||
      text.includes('पेट') ||
      text.includes('abdomen') ||
      text.includes('gas') ||
      text.includes('acidity') ||
      text.includes('dast') ||
      text.includes('vomit') ||
      text.includes('ulti')
    ) {
      slots.chiefComplaint = 'Abdominal Pain / Dyspepsia';
      slots.anatomicalLocation = 'Epigastric / Abdomen';
      slots.recommendedSpecialty = 'Gastroenterology';
    }
    // Head / Neuro / Cephalea
    else if (
      text.includes('head') ||
      text.includes('sir') ||
      text.includes('सिर') ||
      text.includes('matha') ||
      text.includes('माथा') ||
      text.includes('migraine')
    ) {
      slots.chiefComplaint = 'Headache / Cephalea';
      slots.anatomicalLocation = 'Head / Cranial';
      slots.recommendedSpecialty = 'Neurology';
    }
    // Fever / Pyrexia
    else if (
      text.includes('fever') ||
      text.includes('bukhar') ||
      text.includes('बुखार') ||
      text.includes('temperature') ||
      (text.includes('cold') && !text.includes('sweat')) ||
      text.includes('cough') ||
      text.includes('khansi')
    ) {
      slots.chiefComplaint = 'Febrile Illness / Pyrexia';
      slots.recommendedSpecialty = 'General Medicine';
    }
    // Dermatology
    else if (text.includes('skin') || text.includes('rash') || text.includes('itching') || text.includes('khujli') || text.includes('त्वचा')) {
      slots.chiefComplaint = 'Dermatological Rash / Pruritus';
      slots.recommendedSpecialty = 'Dermatology';
    }
    // Fallback if not yet set
    else if (!slots.chiefComplaint) {
      slots.chiefComplaint = latestText.slice(0, 50);
      slots.recommendedSpecialty = 'General Medicine';
    }

    // --------------------------------------------------------------------------
    // 2. CHARACTER & QUALITY
    // --------------------------------------------------------------------------
    if (text.includes('crushing') || text.includes('pressure') || text.includes('dabav') || text.includes('दबाव') || text.includes('squeezing') || text.includes('bhari')) {
      slots.characterQuality = 'Crushing Pressure / Squeezing Heaviness';
    } else if (text.includes('sharp') || text.includes('stabbing') || text.includes('chubhan') || text.includes('चुभन')) {
      slots.characterQuality = 'Sharp / Stabbing';
    } else if (text.includes('burning') || text.includes('jalan') || text.includes('जलन')) {
      slots.characterQuality = 'Burning Sensation';
    } else if (text.includes('stiff') || text.includes('akdan') || text.includes('अकड़न') || text.includes('jamav')) {
      slots.characterQuality = 'Stiffness & Restricted Motion';
    } else if (text.includes('throbbing') || text.includes('dull') || text.includes('meetha dard')) {
      slots.characterQuality = 'Dull Throbbing Ache';
    } else if (text.includes('cramp') || text.includes('aithan') || text.includes('ऐंठन') || text.includes('kheencho')) {
      slots.characterQuality = 'Muscle Cramp / Spasm';
    }

    // --------------------------------------------------------------------------
    // 3. DURATION & ONSET
    // --------------------------------------------------------------------------
    if (text.includes('hour') || text.includes('ghante') || text.includes('घंटे') || text.includes('minute') || text.includes('subah') || text.includes('morning') || text.includes('aaj')) {
      slots.durationOnset = 'Acute onset (< 24 hours)';
    } else if (text.includes('day') || text.includes('din') || text.includes('दिन') || text.includes('kal') || text.includes('yesterday')) {
      slots.durationOnset = 'Recent onset (1-3 days)';
    } else if (text.includes('week') || text.includes('month') || text.includes('saal') || text.includes('year') || text.includes('hafta') || text.includes('महीने')) {
      slots.durationOnset = 'Chronic (> several weeks)';
    }

    // --------------------------------------------------------------------------
    // 4. RADIATION
    // --------------------------------------------------------------------------
    if (text.includes('arm') || text.includes('left arm') || text.includes('haath') || text.includes('हाथ') || text.includes('baju')) {
      slots.radiationLocation = 'Left Arm / Shoulder';
    }
    if (text.includes('jaw') || text.includes('neck') || text.includes('gale') || text.includes('jabde') || text.includes('जबड़ा')) {
      slots.radiationLocation = slots.radiationLocation ? `${slots.radiationLocation} & Jaw/Neck` : 'Jaw & Neck';
    }
    if (text.includes('back') || text.includes('kamar') || text.includes('कमर') || text.includes('spine')) {
      slots.radiationLocation = 'Radiating from Lower Back / Lumbar Spine';
    }

    // --------------------------------------------------------------------------
    // 5. ASSOCIATED SYMPTOMS & RED FLAGS
    // --------------------------------------------------------------------------
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
    if (text.includes('swelling') || text.includes('sujan') || text.includes('सूजन') || text.includes('edema')) {
      if (!slots.associatedSymptoms?.includes('Peripheral Swelling / Edema')) {
        slots.associatedSymptoms?.push('Peripheral Swelling / Edema');
      }
    }
    if (text.includes('chalne') || text.includes('walk') || text.includes('chalne me') || text.includes('लंगड़ा')) {
      if (!slots.associatedSymptoms?.includes('Difficulty Walking / Antalgic Gait')) {
        slots.associatedSymptoms?.push('Difficulty Walking / Antalgic Gait');
      }
    }
    if (text.includes('jhanjhana') || text.includes('tingling') || text.includes('numb') || text.includes('sunn') || text.includes('सुन्न')) {
      if (!slots.associatedSymptoms?.includes('Paresthesia / Numbness')) {
        slots.associatedSymptoms?.push('Paresthesia / Numbness');
      }
    }

    // --------------------------------------------------------------------------
    // 6. SEVERITY
    // --------------------------------------------------------------------------
    const numMatch = text.match(/\b([1-9]|10)\b/);
    if (numMatch) {
      slots.severityNumber = parseInt(numMatch[1], 10);
    } else if (text.includes('severe') || text.includes('bahut tej') || text.includes('बहुत ज्यादा') || text.includes('unbearable') || text.includes('bahut dard')) {
      slots.severityNumber = 8;
    } else if (text.includes('moderate') || text.includes('theek theek') || text.includes('madhyam')) {
      slots.severityNumber = 5;
    } else if (text.includes('mild') || text.includes('halka') || text.includes('हल्का')) {
      slots.severityNumber = 3;
    }

    // --------------------------------------------------------------------------
    // 7. MEDICAL HISTORY
    // --------------------------------------------------------------------------
    if (text.includes('bp') || text.includes('hypertension') || text.includes('blood pressure')) {
      if (!slots.pastHistory?.includes('Hypertension')) slots.pastHistory?.push('Hypertension');
    }
    if (text.includes('sugar') || text.includes('diabetes') || text.includes('madhumeh')) {
      if (!slots.pastHistory?.includes('Diabetes Mellitus')) slots.pastHistory?.push('Diabetes Mellitus');
    }
    if (text.includes('uric acid') || text.includes('gout')) {
      if (!slots.pastHistory?.includes('Gout / Hyperuricemia')) slots.pastHistory?.push('Gout / Hyperuricemia');
    }

    return slots;
  }

  public generateNextQuestion(
    slots: ExtractedClinicalSlots,
    language: 'hi' | 'en',
    turnCount: number
  ): { questionText: string; isReadyForStep2: boolean } {
    const isHi = language === 'hi';
    const cc = (slots.chiefComplaint || '').toLowerCase();
    const isLeg = cc.includes('leg') || cc.includes('pair') || cc.includes('lower');
    const isKnee = cc.includes('knee') || cc.includes('joint');
    const isChest = cc.includes('chest') || cc.includes('precordial');
    const isAbdomen = cc.includes('abdomen') || cc.includes('dyspepsia');
    const isHead = cc.includes('head');

    // Priority 1: Duration & Onset
    if (!slots.durationOnset) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'पैरों में यह दर्द कब से हो रहा है? क्या यह किसी चोट/ज्यादा चलने के बाद शुरू हुआ या अचानक बिना किसी वजह के?'
            : 'How long have you had this leg pain? Did it start after walking/injury or suddenly without any clear cause?',
          isReadyForStep2: false,
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों या जोड़ों में यह तकलीफ कब से है? क्या यह कुछ दिनों से है या कई महीनों से बनी हुई है?'
            : 'How long have you had this knee or joint pain? Has it been present for days or several months?',
          isReadyForStep2: false,
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'सीने में यह तकलीफ कितने समय से हो रही है? क्या यह अचानक शुरू हुई है?'
            : 'When did this chest discomfort start? Did it begin suddenly within the last few hours?',
          isReadyForStep2: false,
        };
      }
      return {
        questionText: isHi
          ? 'यह समस्या कब से हो रही है? क्या यह अचानक शुरू हुई है या कुछ दिनों से है?'
          : 'When did this problem start? Did it begin suddenly or has it been ongoing for some days?',
        isReadyForStep2: false,
      };
    }

    // Priority 2: Character of Pain (Specific to anatomical organ!)
    if (!slots.characterQuality) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'पैरों का दर्द किस प्रकार का है? क्या मांसपेशियों में ऐंठन/खिंचाव है, पिंडलियों में भारीपन है, या हड्डियों/जोड़ों में दर्द है?'
            : 'What type of pain is it in your legs? Is it a muscle cramp/tightness, heaviness in calves, or deep bone/joint ache?',
          isReadyForStep2: false,
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों में दर्द के साथ क्या सुबह अकड़न रहती है या चलने में चटकने (crepitus) की आवाज आती है?'
            : 'Along with the knee pain, do you experience morning stiffness or a cracking sensation when bending?',
          isReadyForStep2: false,
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'सीने का दर्द किस प्रकार का है? क्या यह भारी दबाव/निचोड़ने जैसा है, या चुभन/जलन जैसा है?'
            : 'How does the chest pain feel? Is it heavy crushing pressure/squeezing, or sharp/burning?',
          isReadyForStep2: false,
        };
      }
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'पेट में किस प्रकार का दर्द है? क्या मरोड़ (cramps) है, जलन है, या लगातार भारी दर्द है?'
            : 'What type of abdominal pain is it? Is it cramping, burning acid reflux, or constant dull ache?',
          isReadyForStep2: false,
        };
      }
      return {
        questionText: isHi
          ? 'यह दर्द किस प्रकार का महसूस होता है? क्या यह तेज है, भारीपन जैसा है या चुभन जैसा?'
          : 'How would you describe the feeling? Is it sharp, heavy, throbbing, or burning?',
        isReadyForStep2: false,
      };
    }

    // Priority 3: Severity (1-10)
    if (!slots.severityNumber) {
      return {
        questionText: isHi
          ? '1 से 10 के पैमाने पर आप इस दर्द की तीव्रता को कितना अंक देंगे (जहाँ 1 हल्का और 10 असहनीय हो)?'
          : 'On a scale of 1 to 10 (where 1 is mild and 10 is unbearable), how severe is your pain?',
        isReadyForStep2: false,
      };
    }

    // Priority 4: Anatomical Radiation / Spread (ONLY CHEST GETS ARM/JAW!)
    if (!slots.radiationLocation) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द कमर या कूल्हे से नीचे पैर की तरफ जाता है, या दोनों पैरों में सूजन व सुन्नपन (numbness) भी है?'
            : 'Does the pain radiate down from your lower back/hip into the leg, or is there swelling or numbness in your feet?',
          isReadyForStep2: false,
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द आपके बाएँ हाथ, कंधे, गर्दन या जबड़े की तरफ भी फैल रहा है?'
            : 'Does the pain spread anywhere else, such as your left arm, shoulder, neck, or jaw?',
          isReadyForStep2: false,
        };
      }
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द पीठ की तरफ या पसलियों के नीचे भी फैलता है?'
            : 'Does the abdominal pain radiate to your back or under your ribs?',
          isReadyForStep2: false,
        };
      }
    }

    // Priority 5: Associated Symptoms (Tailored to Leg vs Chest vs GI)
    if (!slots.associatedSymptoms || slots.associatedSymptoms.length === 0) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'क्या आपको पैरों में सूजन, चलने में असमर्थता, नसों का उभार (varicose veins) या रात में ऐंठन की समस्या होती है?'
            : 'Are you having any leg swelling, difficulty walking, visible swollen veins, or night calf cramps?',
          isReadyForStep2: false,
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'क्या आपको इसके साथ ठंडा पसीना, सांस लेने में तकलीफ, घबराहट या चक्कर जैसा महसूस हो रहा है?'
            : 'Are you experiencing any other symptoms along with this, like cold sweating, breathlessness, or dizziness?',
          isReadyForStep2: false,
        };
      }
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'क्या इसके साथ उल्टी, जी मिचलाना, दस्त या खाना न पचने जैसी समस्या भी है?'
            : 'Are you experiencing any nausea, vomiting, loose stools, or loss of appetite?',
          isReadyForStep2: false,
        };
      }
    }

    // Priority 6: Medical History
    if (!slots.pastHistory || slots.pastHistory.length === 0) {
      return {
        questionText: isHi
          ? 'क्या आपको पहले से डायबिटीज (शुगर), यूरिक एसिड, हाई बीपी या थायरॉयड की कोई बीमारी है और क्या आप कोई दवा ले रहे हैं?'
          : 'Do you have any past medical history such as Diabetes, High Uric Acid, BP, or Thyroid, and are you taking any medicines?',
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
