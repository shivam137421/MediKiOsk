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
  dimensionsCovered?: string[];
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
    const text = latestText.toLowerCase().trim();
    const slots: Required<Pick<ExtractedClinicalSlots, 'associatedSymptoms' | 'pastHistory' | 'redFlagSymptoms' | 'dimensionsCovered'>> & ExtractedClinicalSlots = {
      ...existingSlots,
      associatedSymptoms: [...(existingSlots.associatedSymptoms || [])],
      pastHistory: [...(existingSlots.pastHistory || [])],
      redFlagSymptoms: [...(existingSlots.redFlagSymptoms || [])],
      dimensionsCovered: [...(existingSlots.dimensionsCovered || [])],
    };

    // --------------------------------------------------------------------------
    // 1. ANATOMICAL REGION & CHIEF COMPLAINT (Only set/update if not already established)
    // --------------------------------------------------------------------------
    if (!slots.chiefComplaint || text.includes('pair') || text.includes('पैर') || text.includes('leg') || text.includes('chest') || text.includes('सीन') || text.includes('pet') || text.includes('पेट')) {
      
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
      // Fallback
      else if (!slots.chiefComplaint) {
        slots.chiefComplaint = latestText.slice(0, 60);
        slots.recommendedSpecialty = 'General Medicine';
      }
    }

    // --------------------------------------------------------------------------
    // 2. DURATION, ONSET & INJURY TRIGGER
    // --------------------------------------------------------------------------
    if (
      text.includes('hour') || text.includes('ghante') || text.includes('घंटे') || text.includes('minute') ||
      text.includes('day') || text.includes('din') || text.includes('दिन') || text.includes('kal') ||
      text.includes('week') || text.includes('hafta') || text.includes('month') || text.includes('mahine') ||
      text.includes('saal') || text.includes('year') || text.includes('november') || text.includes('december') ||
      text.includes('january') || text.includes('subah') || text.includes('aaj') || text.includes('teer') ||
      text.includes('chot') || text.includes('चोट') || text.includes('accident') || text.includes('gir') ||
      text.includes('lag') || text.includes('start') || text.includes('se')
    ) {
      slots.durationOnset = latestText;
      if (!slots.dimensionsCovered.includes('onset')) slots.dimensionsCovered.push('onset');
    }

    // --------------------------------------------------------------------------
    // 3. CHARACTER & QUALITY
    // --------------------------------------------------------------------------
    if (
      text.includes('crush') || text.includes('pressure') || text.includes('dabav') || text.includes('दबाव') ||
      text.includes('sharp') || text.includes('stabbing') || text.includes('chubhan') || text.includes('चुभन') ||
      text.includes('jalan') || text.includes('जलन') || text.includes('burning') ||
      text.includes('aithan') || text.includes('ऐंठन') || text.includes('cramp') || text.includes('kheencho') ||
      text.includes('akdan') || text.includes('अकड़न') || text.includes('stiff') ||
      text.includes('bhari') || text.includes('भारी') || text.includes('dull') || text.includes('meetha')
    ) {
      slots.characterQuality = latestText;
      if (!slots.dimensionsCovered.includes('character')) slots.dimensionsCovered.push('character');
    }

    // --------------------------------------------------------------------------
    // 4. SEVERITY (1-10 numerical or descriptive)
    // --------------------------------------------------------------------------
    const numMatch = text.match(/\b([1-9]|10)\b/);
    if (numMatch) {
      slots.severityNumber = parseInt(numMatch[1], 10);
      if (!slots.dimensionsCovered.includes('severity')) slots.dimensionsCovered.push('severity');
    } else if (text.includes('severe') || text.includes('bahut tej') || text.includes('बहुत ज्यादा') || text.includes('unbearable') || text.includes('bahut dard')) {
      slots.severityNumber = 8;
      if (!slots.dimensionsCovered.includes('severity')) slots.dimensionsCovered.push('severity');
    } else if (text.includes('halka') || text.includes('mild') || text.includes('theek')) {
      slots.severityNumber = 4;
      if (!slots.dimensionsCovered.includes('severity')) slots.dimensionsCovered.push('severity');
    }

    // --------------------------------------------------------------------------
    // 5. RADIATION & ASSOCIATED SYMPTOMS
    // --------------------------------------------------------------------------
    if (text.includes('sujan') || text.includes('सूजन') || text.includes('swelling') || text.includes('edema')) {
      if (!slots.associatedSymptoms?.includes('Swelling / Edema')) slots.associatedSymptoms?.push('Swelling / Edema');
      if (!slots.dimensionsCovered.includes('radiation_associated')) slots.dimensionsCovered.push('radiation_associated');
    }
    if (text.includes('sunn') || text.includes('सुन्न') || text.includes('numb') || text.includes('jhanjhana') || text.includes('tingling')) {
      if (!slots.associatedSymptoms?.includes('Numbness / Paresthesia')) slots.associatedSymptoms?.push('Numbness / Paresthesia');
      if (!slots.dimensionsCovered.includes('radiation_associated')) slots.dimensionsCovered.push('radiation_associated');
    }
    if (text.includes('chalne') || text.includes('walk') || text.includes('langda')) {
      if (!slots.associatedSymptoms?.includes('Difficulty Walking')) slots.associatedSymptoms?.push('Difficulty Walking');
      if (!slots.dimensionsCovered.includes('radiation_associated')) slots.dimensionsCovered.push('radiation_associated');
    }
    if (text.includes('sweat') || text.includes('pasina') || text.includes('पसीना')) {
      if (!slots.associatedSymptoms?.includes('Diaphoresis')) slots.associatedSymptoms?.push('Diaphoresis');
      slots.redFlagSymptoms?.push('Profuse Diaphoresis');
      slots.isRedFlagTriggered = true;
      if (!slots.dimensionsCovered.includes('radiation_associated')) slots.dimensionsCovered.push('radiation_associated');
    }
    if (text.includes('saans') || text.includes('सांस') || text.includes('breath') || text.includes('dyspnea')) {
      if (!slots.associatedSymptoms?.includes('Dyspnea')) slots.associatedSymptoms?.push('Dyspnea');
      slots.redFlagSymptoms?.push('Acute Dyspnea');
      slots.isRedFlagTriggered = true;
      if (!slots.dimensionsCovered.includes('radiation_associated')) slots.dimensionsCovered.push('radiation_associated');
    }

    // --------------------------------------------------------------------------
    // 6. MEDICAL HISTORY
    // --------------------------------------------------------------------------
    if (
      text.includes('bp') || text.includes('hypertension') || text.includes('sugar') ||
      text.includes('diabetes') || text.includes('uric') || text.includes('thyroid') ||
      text.includes('nhi') || text.includes('no') || text.includes('nahi') || text.includes('kuch nahi')
    ) {
      slots.pastHistory?.push(latestText);
      if (!slots.dimensionsCovered.includes('history')) slots.dimensionsCovered.push('history');
    }

    return slots;
  }

  public generateNextQuestion(
    slots: ExtractedClinicalSlots,
    language: 'hi' | 'en',
    patientTurnCount: number
  ): { questionText: string; isReadyForStep2: boolean } {
    const isHi = language === 'hi';
    const cc = (slots.chiefComplaint || '').toLowerCase();
    const isLeg = cc.includes('leg') || cc.includes('pair') || cc.includes('lower');
    const isKnee = cc.includes('knee') || cc.includes('joint');
    const isChest = cc.includes('chest') || cc.includes('precordial');
    const isAbdomen = cc.includes('abdomen') || cc.includes('dyspepsia');
    const covered = slots.dimensionsCovered || [];

    // Turn 1 / Step 1: Check Onset & Duration
    if (patientTurnCount <= 1 || (!covered.includes('onset') && !slots.durationOnset)) {
      slots.dimensionsCovered?.push('onset');
      if (isLeg) {
        return {
          questionText: isHi
            ? 'पैरों में यह दर्द कब से हो रहा है? क्या यह किसी चोट/खिंचाव के बाद हुआ या धीरे-धीरे शुरू हुआ?'
            : 'When did this leg pain start? Did it happen after an injury/strain or start gradually?',
          isReadyForStep2: false,
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों में यह तकलीफ कब से है? क्या यह कुछ दिनों से है या कई महीनों से बनी हुई है?'
            : 'How long have you had this knee discomfort? Has it been present for days or months?',
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
          ? 'यह समस्या कब से हो रही है और क्या यह अचानक शुरू हुई है?'
          : 'When did this symptom begin, and did it start suddenly?',
        isReadyForStep2: false,
      };
    }

    // Turn 2 / Step 2: Check Character & Quality of Sensation
    if (patientTurnCount === 2 || (!covered.includes('character') && !slots.characterQuality)) {
      slots.dimensionsCovered?.push('character');
      if (isLeg) {
        return {
          questionText: isHi
            ? 'समझ गया। कृपया बताएं कि पैरों में दर्द किस प्रकार का है? क्या मांसपेशियों में ऐंठन/खिंचाव है, पिंडलियों में भारीपन है, या नसों में दर्द है?'
            : 'Understood. What type of pain is it in your legs? Is it muscle cramping/spasm, heaviness in calves, or nerve tingling?',
          isReadyForStep2: false,
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों में दर्द के साथ क्या सुबह उठने पर अकड़न रहती है या मुड़ने में चटकने की आवाज आती है?'
            : 'Along with the knee pain, do you experience morning stiffness or a cracking sensation when bending?',
          isReadyForStep2: false,
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'सीने का दर्द किस प्रकार का महसूस होता है? क्या भारी दबाव/निचोड़ने जैसा है या जलन जैसा?'
            : 'How does the chest pain feel? Is it heavy crushing pressure/squeezing, or sharp/burning?',
          isReadyForStep2: false,
        };
      }
      return {
        questionText: isHi
          ? 'यह दर्द किस प्रकार का महसूस होता है? क्या यह तेज है, भारीपन जैसा है या चुभन जैसा?'
          : 'How would you describe the sensation? Is it sharp, heavy, throbbing, or burning?',
        isReadyForStep2: false,
      };
    }

    // Turn 3 / Step 3: Check Severity Scale (1-10)
    if (patientTurnCount === 3 || (!covered.includes('severity') && !slots.severityNumber)) {
      slots.dimensionsCovered?.push('severity');
      return {
        questionText: isHi
          ? '1 से 10 के पैमाने पर आप इस दर्द की तीव्रता को कितना अंक देंगे (जहाँ 1 हल्का और 10 असहनीय दर्द हो)?'
          : 'On a scale of 1 to 10 (where 1 is mild and 10 is unbearable), how severe is your pain?',
        isReadyForStep2: false,
      };
    }

    // Turn 4 / Step 4: Check Radiation / Spread / Swelling (Specific to complaint)
    if (patientTurnCount === 4 || !covered.includes('radiation_associated')) {
      slots.dimensionsCovered?.push('radiation_associated');
      if (isLeg) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द कमर या कूल्हे से नीचे पैर की तरफ फैलता है, और क्या पैरों में कोई सूजन (swelling) या सुन्नपन है?'
            : 'Does the pain radiate down from your lower back/hip, and is there any leg swelling or numbness?',
          isReadyForStep2: false,
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द आपके बाएँ हाथ, कंधे, गर्दन या जबड़े की तरफ भी फैल रहा है, और क्या पसीना आ रहा है?'
            : 'Does the pain radiate to your left arm, shoulder, neck, or jaw, and are you sweating?',
          isReadyForStep2: false,
        };
      }
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'क्या पेट का दर्द पीठ की तरफ भी फैलता है, और क्या उल्टी या जी मिचलाने की शिकायत है?'
            : 'Does the abdominal pain radiate to your back, and are you experiencing nausea or vomiting?',
          isReadyForStep2: false,
        };
      }
    }

    // Turn 5 / Step 5: Check Past Medical History & Medications
    if (patientTurnCount === 5 || !covered.includes('history')) {
      slots.dimensionsCovered?.push('history');
      return {
        questionText: isHi
          ? 'क्या आपको पहले से डायबिटीज (शुगर), यूरिक एसिड, हाई बीपी या थायरॉयड की कोई बीमारी है और क्या आप कोई दवा ले रहे हैं?'
          : 'Do you have any past medical history such as Diabetes, High Uric Acid, BP, or Thyroid, and are you taking any medicines?',
        isReadyForStep2: true,
      };
    }

    // Concluding Turn
    return {
      questionText: isHi
        ? 'धन्यवाद, आपके बताए लक्षणों का रिकॉर्ड तैयार कर लिया गया है। अब अगले चरण (आयुर्वेद एवं जीवनशैली परीक्षा) पर आगे बढ़ते हैं।'
        : 'Thank you, your clinical history has been accurately captured. Let us now proceed to Step 2 for the Ayurvedic & Lifestyle Assessment.',
      isReadyForStep2: true,
    };
  }
}

export const adaptiveInterviewEngine = new AdaptiveClinicalInterviewEngine();
