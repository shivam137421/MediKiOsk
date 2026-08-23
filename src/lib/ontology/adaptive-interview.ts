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
  pastHistory?: string[];
  allergies?: string[];
  currentMeds?: string[];
  isRedFlagTriggered?: boolean;
  redFlagSymptoms?: string[];
  recommendedSpecialty?: string;
}

export class AdaptiveClinicalInterviewEngine {
  public parsePatientInput(
    latestText: string,
    existingSlots: ExtractedClinicalSlots
  ): ExtractedClinicalSlots {
    const text = latestText.toLowerCase().trim();
    const slots: ExtractedClinicalSlots = {
      ...existingSlots,
      associatedSymptoms: [...(existingSlots.associatedSymptoms || [])],
      pastHistory: [...(existingSlots.pastHistory || [])],
      redFlagSymptoms: [...(existingSlots.redFlagSymptoms || [])],
    };

    // --------------------------------------------------------------------------
    // 1. ANATOMICAL REGION & CHIEF COMPLAINT
    // --------------------------------------------------------------------------
    if (!slots.chiefComplaint || text.includes('pair') || text.includes('पैर') || text.includes('leg') || text.includes('chest') || text.includes('सीन') || text.includes('pet') || text.includes('पेट') || text.includes('head') || text.includes('सिर')) {
      
      // Leg / Lower Extremity
      if (
        text.includes('pair') ||
        text.includes('पैर') ||
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
      // Knee / Joint / AYUSH
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
        text.includes('seen') ||
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
      // Head / Neuro / Headache
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
      else if (!slots.chiefComplaint) {
        slots.chiefComplaint = latestText.slice(0, 60);
        slots.recommendedSpecialty = 'General Medicine';
      }
    }

    // --------------------------------------------------------------------------
    // 2. DURATION, ONSET & INJURY TRIGGER
    // --------------------------------------------------------------------------
    if (
      !slots.durationOnset &&
      (
        text.includes('hour') || text.includes('ghante') || text.includes('घंटे') || text.includes('minute') ||
        text.includes('day') || text.includes('din') || text.includes('दिन') || text.includes('kal') ||
        text.includes('week') || text.includes('hafta') || text.includes('month') || text.includes('mahine') ||
        text.includes('saal') || text.includes('year') || text.includes('november') || text.includes('december') ||
        text.includes('january') || text.includes('february') || text.includes('march') || text.includes('subah') ||
        text.includes('aaj') || text.includes('teer') || text.includes('chot') || text.includes('चोट') ||
        text.includes('accident') || text.includes('gir') || text.includes('lagi') || text.includes('shuru') ||
        text.includes('since') || text.includes('started') || /\b(se|ago)\b/.test(text) || text.includes('से')
      )
    ) {
      slots.durationOnset = latestText;
    }

    // --------------------------------------------------------------------------
    // 3. CHARACTER & QUALITY OF SENSATION (Specific descriptive quality only)
    // --------------------------------------------------------------------------
    if (
      !slots.characterQuality &&
      (
        text.includes('crush') || text.includes('pressure') || text.includes('dabav') || text.includes('दबाव') ||
        text.includes('sharp') || text.includes('stabbing') || text.includes('chubhan') || text.includes('चुभन') ||
        text.includes('jalan') || text.includes('जलन') || text.includes('burning') ||
        text.includes('aithan') || text.includes('ऐंठन') || text.includes('cramp') || text.includes('kheencho') ||
        text.includes('akdan') || text.includes('अकड़न') || text.includes('stiff') ||
        text.includes('bhari') || text.includes('भारी') || text.includes('dull') || text.includes('meetha dard') ||
        text.includes('throbbing') || text.includes('spasm')
      )
    ) {
      slots.characterQuality = latestText;
    }

    // --------------------------------------------------------------------------
    // 4. SEVERITY INTENSITY (Pain scale 1-10 or explicit score)
    // --------------------------------------------------------------------------
    const scaleMatch = text.match(/([1-9]|10)\s*(\/|out\s*of)\s*10/) || text.match(/(intensity|score|scale|level|severity|dard)\s*(is|:|=)?\s*([1-9]|10)\b/);
    if (scaleMatch) {
      const val = parseInt(scaleMatch[1] === 'intensity' || scaleMatch[1] === 'score' || scaleMatch[1] === 'scale' || scaleMatch[1] === 'dard' ? scaleMatch[3] : scaleMatch[1], 10);
      if (!isNaN(val) && val >= 1 && val <= 10) {
        slots.severityNumber = val;
      }
    } else if (slots.severityNumber === undefined) {
      if (text.includes('/10') || text.includes('out of 10') || text.includes('scale') || text.includes('rate')) {
        const num = text.match(/\b([1-9]|10)\b/);
        if (num) slots.severityNumber = parseInt(num[1], 10);
      } else if (text.includes('severe') || text.includes('bahut tej') || text.includes('बहुत ज्यादा') || text.includes('unbearable') || text.includes('asahniya')) {
        slots.severityNumber = 8;
      } else if (text.includes('halka') || text.includes('mild') || text.includes('kam dard')) {
        slots.severityNumber = 4;
      }
    }

    // --------------------------------------------------------------------------
    // 5. RADIATION & ASSOCIATED SYMPTOMS
    // --------------------------------------------------------------------------
    if (
      !slots.radiationLocation &&
      (
        text.includes('kamar') || text.includes('कमर') || text.includes('hip') || text.includes('koolhe') ||
        text.includes('arm') || text.includes('shoulder') || text.includes('haath') || text.includes('neck') ||
        text.includes('jaw') || text.includes('jabde') || text.includes('gale') || text.includes('peeth') ||
        text.includes('spread') || text.includes('radiat') || text.includes('fail')
      )
    ) {
      slots.radiationLocation = latestText;
    }

    if (text.includes('sujan') || text.includes('सूजन') || text.includes('swelling') || text.includes('edema')) {
      if (!slots.associatedSymptoms?.includes('Swelling / Edema')) slots.associatedSymptoms?.push('Swelling / Edema');
    }
    if (text.includes('sunn') || text.includes('सुन्न') || text.includes('numb') || text.includes('jhanjhana') || text.includes('tingling')) {
      if (!slots.associatedSymptoms?.includes('Numbness / Paresthesia')) slots.associatedSymptoms?.push('Numbness / Paresthesia');
    }
    if (text.includes('chalne') || text.includes('walk') || text.includes('langda') || text.includes('chalne me')) {
      if (!slots.associatedSymptoms?.includes('Difficulty Walking')) slots.associatedSymptoms?.push('Difficulty Walking');
    }
    if (text.includes('sweat') || text.includes('pasina') || text.includes('पसीना')) {
      if (!slots.associatedSymptoms?.includes('Diaphoresis')) slots.associatedSymptoms?.push('Diaphoresis');
      slots.redFlagSymptoms?.push('Profuse Diaphoresis');
      slots.isRedFlagTriggered = true;
    }
    if (text.includes('saans') || text.includes('सांस') || text.includes('breath') || text.includes('dyspnea')) {
      if (!slots.associatedSymptoms?.includes('Dyspnea')) slots.associatedSymptoms?.push('Dyspnea');
      slots.redFlagSymptoms?.push('Acute Dyspnea');
      slots.isRedFlagTriggered = true;
    }

    // --------------------------------------------------------------------------
    // 6. PAST MEDICAL HISTORY & MEDICATIONS
    // --------------------------------------------------------------------------
    if (
      slots.pastHistory?.length === 0 &&
      (
        text.includes('bp') || text.includes('hypertension') || text.includes('sugar') ||
        text.includes('diabetes') || text.includes('uric') || text.includes('thyroid') ||
        text.includes('heart') || text.includes('purani bimari') || text.includes('पुरानी बीमारी') ||
        /\b(no|nahi|nhi|none|nil|kuch nahi|koi nahi)\b/.test(text) || text.includes('कोई बीमारी नहीं')
      )
    ) {
      slots.pastHistory?.push(latestText);
    }

    return slots;
  }

  /**
   * Generates the next question strictly based on UNMET CLINICAL INFORMATION GAPS.
   * If a piece of information is already known, it SKIPS that question completely!
   */
  public generateNextQuestion(
    slots: ExtractedClinicalSlots,
    language: 'hi' | 'en'
  ): { questionText: string; isReadyForStep2: boolean; targetSlot: string } {
    const isHi = language === 'hi';
    const cc = (slots.chiefComplaint || '').toLowerCase();
    const isLeg = cc.includes('leg') || cc.includes('pair') || cc.includes('lower');
    const isKnee = cc.includes('knee') || cc.includes('joint');
    const isChest = cc.includes('chest') || cc.includes('precordial');
    const isAbdomen = cc.includes('abdomen') || cc.includes('dyspepsia');

    // --------------------------------------------------------------------------
    // GAP 1: ONSET / DURATION (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (!slots.durationOnset) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'पैरों में यह दर्द कब से शुरू हुआ? क्या यह किसी चोट/खिंचाव के बाद हुआ या अचानक बिना किसी कारण के?'
            : 'When did this leg pain start? Did it happen after an injury/strain or begin suddenly?',
          isReadyForStep2: false,
          targetSlot: 'durationOnset',
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों में यह तकलीफ कब से है? क्या यह कुछ दिनों से है या कई महीनों से बनी हुई है?'
            : 'How long have you had this knee discomfort? Has it been present for days or several months?',
          isReadyForStep2: false,
          targetSlot: 'durationOnset',
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'सीने में यह तकलीफ कितने समय से हो रही है? क्या यह अचानक शुरू हुई है?'
            : 'When did this chest discomfort start? Did it begin suddenly within the last few hours?',
          isReadyForStep2: false,
          targetSlot: 'durationOnset',
        };
      }
      return {
        questionText: isHi
          ? 'यह समस्या कब से शुरू हुई और क्या यह अचानक हुई है?'
          : 'When did this problem start, and did it begin suddenly?',
        isReadyForStep2: false,
        targetSlot: 'durationOnset',
      };
    }

    // --------------------------------------------------------------------------
    // GAP 2: CHARACTER OF SENSATION (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (!slots.characterQuality) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'पैरों का दर्द किस प्रकार का महसूस होता है? क्या मांसपेशियों में ऐंठन/खिंचाव है, पिंडलियों में भारीपन है, या नसों में दर्द है?'
            : 'What type of pain is it in your legs? Is it muscle cramping/spasm, heaviness in calves, or nerve tingling?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों में दर्द के साथ क्या सुबह अकड़न रहती है या मुड़ने में चटकने की आवाज आती है?'
            : 'Along with the knee pain, do you experience morning stiffness or a cracking sensation when bending?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'सीने का दर्द किस प्रकार का महसूस होता है? क्या भारी दबाव/निचोड़ने जैसा है या जलन जैसा?'
            : 'How does the chest pain feel? Is it heavy crushing pressure/squeezing, or sharp/burning?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      return {
        questionText: isHi
          ? 'यह दर्द किस प्रकार का महसूस होता है? क्या यह तेज है, भारीपन जैसा है या चुभन जैसा?'
          : 'How would you describe the feeling? Is it sharp, heavy, throbbing, or burning?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
      };
    }

    // --------------------------------------------------------------------------
    // GAP 3: SEVERITY SCALE (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (slots.severityNumber === undefined) {
      return {
        questionText: isHi
          ? '1 से 10 के पैमाने पर आप इस दर्द की तीव्रता को कितना अंक देंगे (जहाँ 1 हल्का और 10 असहनीय दर्द हो)?'
          : 'On a scale of 1 to 10 (where 1 is mild and 10 is unbearable), how severe is your pain?',
        isReadyForStep2: false,
        targetSlot: 'severityNumber',
      };
    }

    // --------------------------------------------------------------------------
    // GAP 4: RADIATION / SPREAD / SWELLING (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (!slots.radiationLocation && (!slots.associatedSymptoms || slots.associatedSymptoms.length === 0)) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द कमर या कूल्हे से नीचे पैर की तरफ फैलता है, और क्या पैरों में कोई सूजन (swelling) या सुन्नपन है?'
            : 'Does the pain radiate down from your lower back/hip, and is there any leg swelling or numbness?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द आपके बाएँ हाथ, कंधे, गर्दन या जबड़े की तरफ भी फैल रहा है, और क्या पसीना आ रहा है?'
            : 'Does the pain radiate to your left arm, shoulder, neck, or jaw, and are you sweating?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'क्या पेट का दर्द पीठ की तरफ भी फैलता है, और क्या उल्टी या जी मिचलाने की शिकायत है?'
            : 'Does the abdominal pain radiate to your back, and are you experiencing nausea or vomiting?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
    }

    // --------------------------------------------------------------------------
    // GAP 5: PAST MEDICAL HISTORY & MEDICATIONS (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (!slots.pastHistory || slots.pastHistory.length === 0) {
      return {
        questionText: isHi
          ? 'क्या आपको पहले से डायबिटीज (शुगर), यूरिक एसिड, हाई बीपी या थायरॉयड की कोई बीमारी है और क्या आप कोई नियमित दवा ले रहे हैं?'
          : 'Do you have any past medical history such as Diabetes, High Uric Acid, BP, or Thyroid, and are you taking any medicines?',
        isReadyForStep2: true,
        targetSlot: 'pastHistory',
      };
    }

    // --------------------------------------------------------------------------
    // ALL GAPS SATISFIED -> SMOOTH CONCLUSION TO STEP 2
    // --------------------------------------------------------------------------
    return {
      questionText: this.getClosingStatement(language),
      isReadyForStep2: true,
      targetSlot: 'completed',
    };
  }

  public getClosingStatement(language: 'hi' | 'en'): string {
    return language === 'hi'
      ? 'धन्यवाद, आपके लक्षणों और चिकित्सीय इतिहास का पूर्ण रिकॉर्ड तैयार कर लिया गया है। अब अगले चरण (आयुर्वेद एवं जीवनशैली परीक्षा) पर आगे बढ़ते हैं।'
      : 'Thank you, your clinical symptoms and medical history have been thoroughly recorded. Now proceeding to Step 2 for the Ayurvedic & Lifestyle Assessment.';
  }

  public isClosingStatement(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return (
      lower.includes('धन्यवाद') ||
      lower.includes('दर्ज कर लिया') ||
      lower.includes('तैयार कर लिया') ||
      lower.includes('चरण 2') ||
      lower.includes('आयुर्वेद') ||
      lower.includes('step 2') ||
      lower.includes('ayurvedic') ||
      lower.includes('assessment') ||
      lower.includes('proceed to') ||
      lower.includes('recorded') ||
      lower.includes('intake complete') ||
      lower.includes('thank you')
    );
  }

  public isClinicalIntakeComplete(slots: ExtractedClinicalSlots, patientTurnCount?: number): boolean {
    // If patient has completed 4 turns, automatically complete to prevent interrogation fatigue
    if (patientTurnCount && patientTurnCount >= 4) return true;

    const hasChiefComplaint = Boolean(slots.chiefComplaint && slots.chiefComplaint.trim().length > 0);
    const hasOnset = Boolean(slots.durationOnset && slots.durationOnset.trim().length > 0);
    const hasHistory = Boolean(slots.pastHistory && slots.pastHistory.length > 0);
    const hasDetail =
      slots.severityNumber !== undefined ||
      Boolean(slots.characterQuality && slots.characterQuality.trim().length > 0) ||
      Boolean(slots.radiationLocation) ||
      Boolean(slots.associatedSymptoms && slots.associatedSymptoms.length > 0);

    // If chief complaint + onset + any details or history are present, intake is complete
    if (hasChiefComplaint && hasOnset && (hasHistory || hasDetail)) {
      return true;
    }

    return false;
  }
}

export const adaptiveInterviewEngine = new AdaptiveClinicalInterviewEngine();
