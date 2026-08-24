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
  /**
   * Robust clinical slot parser combining expanded synonym dictionaries
   * with context-aware targetSlot recognition to prevent repeat questions.
   */
  public parsePatientInput(
    latestText: string,
    existingSlots: ExtractedClinicalSlots = {},
    targetSlot?: string
  ): ExtractedClinicalSlots {
    const text = latestText.toLowerCase().trim();
    const slots: ExtractedClinicalSlots = {
      ...existingSlots,
      associatedSymptoms: [...(existingSlots.associatedSymptoms || [])],
      pastHistory: [...(existingSlots.pastHistory || [])],
      redFlagSymptoms: [...(existingSlots.redFlagSymptoms || [])],
    };

    // Determine what information gap was targeted if not explicitly passed
    const effectiveTargetSlot = targetSlot || this.generateNextQuestion(existingSlots, 'hi').targetSlot;
    const isSubstantive = text.length >= 2 && !/^(hi|hello|hey|namaste|नमस्ते|ok|okay|theek hai|ठीक है|achha|accha)$/i.test(text);

    // --------------------------------------------------------------------------
    // 1. ANATOMICAL REGION & CHIEF COMPLAINT
    // --------------------------------------------------------------------------
    if (!slots.chiefComplaint || text.includes('pair') || text.includes('पैर') || text.includes('leg') || text.includes('chest') || text.includes('सीन') || text.includes('pet') || text.includes('पेट') || text.includes('head') || text.includes('सिर') || text.includes('fever') || text.includes('bukhar') || text.includes('बुखार')) {

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
        text.includes('tapman') ||
        text.includes('तापमान') ||
        (text.includes('cold') && !text.includes('sweat')) ||
        text.includes('cough') ||
        text.includes('khansi')
      ) {
        slots.chiefComplaint = 'Febrile Illness / Pyrexia';
        slots.recommendedSpecialty = 'General Medicine';
      }
      else if (!slots.chiefComplaint && isSubstantive) {
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
        text.includes('hour') || text.includes('ghante') || text.includes('घंटे') || text.includes('minute') || text.includes('min') ||
        text.includes('day') || text.includes('din') || text.includes('दिन') || text.includes('kal') || text.includes('कल') ||
        text.includes('parso') || text.includes('परसों') || text.includes('week') || text.includes('hafta') || text.includes('हफ्ता') ||
        text.includes('hafte') || text.includes('हफ्ते') || text.includes('month') || text.includes('mahine') || text.includes('महीने') ||
        text.includes('saal') || text.includes('year') || text.includes('वर्ष') || text.includes('sal') ||
        text.includes('november') || text.includes('december') || text.includes('january') || text.includes('february') || text.includes('march') ||
        text.includes('subah') || text.includes('सुबह') || text.includes('shaam') || text.includes('शाम') || text.includes('raat') || text.includes('रात') ||
        text.includes('aaj') || text.includes('आज') || text.includes('teer') || text.includes('chot') || text.includes('चोट') ||
        text.includes('accident') || text.includes('gir') || text.includes('lagi') || text.includes('shuru') || text.includes('शुरू') ||
        text.includes('since') || text.includes('started') || /\b(se|ago)\b/.test(text) || text.includes('से') ||
        (effectiveTargetSlot === 'durationOnset' && isSubstantive)
      )
    ) {
      slots.durationOnset = latestText.trim();
    }

    // --------------------------------------------------------------------------
    // 3. CHARACTER & QUALITY OF SENSATION (Expanded synonyms + context fallback)
    // --------------------------------------------------------------------------
    if (
      !slots.characterQuality &&
      (
        text.includes('crush') || text.includes('pressure') || text.includes('dabav') || text.includes('दबाव') || text.includes('dabna') ||
        text.includes('sharp') || text.includes('stabbing') || text.includes('chubhan') || text.includes('चुभन') || text.includes('chubhta') || text.includes('चुभता') ||
        text.includes('jalan') || text.includes('जलन') || text.includes('jalna') || text.includes('burning') ||
        text.includes('aithan') || text.includes('ऐंठन') || text.includes('cramp') || text.includes('kheencho') || text.includes('khinchav') || text.includes('खिंचाव') ||
        text.includes('marod') || text.includes('मरोड़') || text.includes('spasm') ||
        text.includes('akdan') || text.includes('अकड़न') || text.includes('stiff') || text.includes('stiffness') ||
        text.includes('toot') || text.includes('टूट') || text.includes('tootan') || text.includes('टूटना') || text.includes('tootna') ||
        text.includes('dukhna') || text.includes('दुखना') || text.includes('dukh') || text.includes('dard') || text.includes('ache') || text.includes('aching') ||
        text.includes('fatan') || text.includes('फटना') || text.includes('kasaav') || text.includes('कसाव') || text.includes('tight') ||
        text.includes('bhari') || text.includes('भारी') || text.includes('bhareepan') || text.includes('भारीपन') || text.includes('dull') || text.includes('meetha dard') ||
        text.includes('throbbing') || text.includes('pulsat') || text.includes('dhadkan') || text.includes('धड़कन') || text.includes('thanak') || text.includes('ठनक') ||
        text.includes('thand') || text.includes('ठंड') || text.includes('chill') || text.includes('chills') || text.includes('shiver') || text.includes('shivering') ||
        text.includes('kampan') || text.includes('कंपकंपी') || text.includes('kapkapi') || text.includes('badan dard') || text.includes('बदन दर्द') || text.includes('body ache') ||
        (effectiveTargetSlot === 'characterQuality' && isSubstantive)
      )
    ) {
      slots.characterQuality = latestText.trim();
    }

    // --------------------------------------------------------------------------
    // 4. SEVERITY INTENSITY (Pain scale 1-10, fever temperature, or descriptive)
    // --------------------------------------------------------------------------
    const scaleMatch = text.match(/([1-9]|10)\s*(\/|out\s*of)\s*10/) || text.match(/(intensity|score|scale|level|severity|dard|temperature|bukhar|tapman)\s*(is|:|=)?\s*([1-9]|10|\d{2,3}(?:\.\d)?)\b/);
    if (scaleMatch) {
      const parsedVal = parseFloat(scaleMatch[3] || scaleMatch[1]);
      if (!isNaN(parsedVal)) {
        if (parsedVal <= 10 && parsedVal >= 1) {
          slots.severityNumber = Math.round(parsedVal);
        } else if (parsedVal >= 102) {
          slots.severityNumber = 8; // High fever
        } else if (parsedVal >= 100) {
          slots.severityNumber = 6; // Moderate fever
        } else if (parsedVal >= 99) {
          slots.severityNumber = 4; // Mild fever
        }
      }
    } else if (slots.severityNumber === undefined) {
      if (text.includes('102') || text.includes('103') || text.includes('104') || text.includes('high fever') || text.includes('bahut tej bukhar') || text.includes('तेज बुखार') || text.includes('severe') || text.includes('unbearable') || text.includes('asahniya')) {
        slots.severityNumber = 8;
      } else if (text.includes('100') || text.includes('101') || text.includes('moderate fever') || text.includes('madhyam') || text.includes('theek thaak')) {
        slots.severityNumber = 6;
      } else if (text.includes('99') || text.includes('halka bukhar') || text.includes('हल्का बुखार') || text.includes('mild') || text.includes('kam dard') || text.includes('halka')) {
        slots.severityNumber = 4;
      } else if (text.includes('/10') || text.includes('out of 10') || text.includes('scale') || text.includes('rate') || text.includes('नंबर') || text.includes('number')) {
        const num = text.match(/\b([1-9]|10)\b/);
        if (num) slots.severityNumber = parseInt(num[1], 10);
      } else if (effectiveTargetSlot === 'severityNumber') {
        const num = text.match(/\b([1-9]|10)\b/);
        if (num) {
          slots.severityNumber = parseInt(num[1], 10);
        } else if (text.includes('bahut') || text.includes('बहुत') || text.includes('tej') || text.includes('तेज') || text.includes('zyada') || text.includes('ज्यादा')) {
          slots.severityNumber = 8;
        } else if (text.includes('kam') || text.includes('कम') || text.includes('halka') || text.includes('हल्का')) {
          slots.severityNumber = 4;
        } else if (isSubstantive) {
          slots.severityNumber = 6; // Default substantive response to moderate
        }
      }
    }

    // --------------------------------------------------------------------------
    // 5. RADIATION & ASSOCIATED SYMPTOMS
    // --------------------------------------------------------------------------
    if (
      !slots.radiationLocation &&
      (
        text.includes('kamar') || text.includes('कमर') || text.includes('hip') || text.includes('koolhe') || text.includes('कूल्हे') ||
        text.includes('arm') || text.includes('shoulder') || text.includes('haath') || text.includes('हाथ') || text.includes('baanh') || text.includes('बांह') ||
        text.includes('neck') || text.includes('gardan') || text.includes('गर्दन') || text.includes('jaw') || text.includes('jabde') || text.includes('जबड़े') ||
        text.includes('gale') || text.includes('गले') || text.includes('peeth') || text.includes('पीठ') || text.includes('back') ||
        text.includes('spread') || text.includes('radiat') || text.includes('fail') || text.includes('फैल') ||
        (effectiveTargetSlot === 'radiationLocation' && isSubstantive)
      )
    ) {
      if (/^(nahi|no|kuch nahi|kahi nahi|koi nahi|none|nil|नहीं)$/i.test(text)) {
        slots.radiationLocation = 'None reported / No radiation';
      } else {
        slots.radiationLocation = latestText.trim();
      }
    }

    if (text.includes('sujan') || text.includes('सूजन') || text.includes('swelling') || text.includes('edema')) {
      if (!slots.associatedSymptoms?.includes('Swelling / Edema')) slots.associatedSymptoms?.push('Swelling / Edema');
    }
    if (text.includes('sunn') || text.includes('सुन्न') || text.includes('numb') || text.includes('jhanjhana') || text.includes('tingling')) {
      if (!slots.associatedSymptoms?.includes('Numbness / Paresthesia')) slots.associatedSymptoms?.push('Numbness / Paresthesia');
    }
    if (text.includes('chalne') || text.includes('चलने') || text.includes('walk') || text.includes('langda') || text.includes('chalne me')) {
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
    if (text.includes('cough') || text.includes('khansi') || text.includes('खांसी') || text.includes('sardi') || text.includes('सर्दी') || text.includes('cold') || text.includes('jukam') || text.includes('जुकाम')) {
      if (!slots.associatedSymptoms?.includes('Cough / Respiratory Symptoms')) slots.associatedSymptoms?.push('Cough / Respiratory Symptoms');
    }
    if (text.includes('vomit') || text.includes('ulti') || text.includes('उल्टी') || text.includes('nausea') || text.includes('ji michlana') || text.includes('जी मिचलाना')) {
      if (!slots.associatedSymptoms?.includes('Nausea / Vomiting')) slots.associatedSymptoms?.push('Nausea / Vomiting');
    }
    if (text.includes('gala') || text.includes('गले') || text.includes('throat') || text.includes('kharaash') || text.includes('खराश')) {
      if (!slots.associatedSymptoms?.includes('Sore Throat / Pharyngitis')) slots.associatedSymptoms?.push('Sore Throat / Pharyngitis');
    }
    if (text.includes('peshab') || text.includes('पेशाब') || text.includes('urine') || text.includes('jalan')) {
      if (!slots.associatedSymptoms?.includes('Dysuria / Urinary Discomfort')) slots.associatedSymptoms?.push('Dysuria / Urinary Discomfort');
    }

    // --------------------------------------------------------------------------
    // 6. PAST MEDICAL HISTORY & MEDICATIONS (Keywords + context fallback)
    // --------------------------------------------------------------------------
    if (
      (!slots.pastHistory || slots.pastHistory.length === 0) &&
      (
        text.includes('bp') || text.includes('hypertension') || text.includes('sugar') ||
        text.includes('diabetes') || text.includes('मधुमेह') || text.includes('uric') || text.includes('यूरिक') ||
        text.includes('thyroid') || text.includes('थायरॉयड') || text.includes('heart') || text.includes('हार्ट') ||
        text.includes('purani bimari') || text.includes('पुरानी बीमारी') ||
        text.includes('dawa') || text.includes('dawai') || text.includes('दवा') || text.includes('दवाई') || text.includes('medicine') || text.includes('tablet') || text.includes('गोली') ||
        text.includes('paracetamol') || text.includes('pcm') || text.includes('dolo') || text.includes('डोलो') || text.includes('crocin') || text.includes('क्रॉसिन') ||
        text.includes('calpol') || text.includes('combiflam') || text.includes('meftal') ||
        /\b(no|nahi|nhi|none|nil|kuch nahi|koi nahi|na|never)\b/.test(text) || text.includes('कोई बीमारी नहीं') ||
        text.includes('नहीं है') || text.includes('कोई दवा नहीं') ||
        (effectiveTargetSlot === 'pastHistory' && isSubstantive)
      )
    ) {
      if (/^(no|nahi|nhi|none|nil|kuch nahi|koi nahi|na|never|नहीं|कोई बीमारी नहीं|नहीं है|कोई दवा नहीं)$/i.test(text)) {
        slots.pastHistory = ['None reported / No pre-existing conditions or regular medications'];
      } else {
        slots.pastHistory = [latestText.trim()];
      }
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
    const isLeg = cc.includes('leg') || cc.includes('pair') || cc.includes('lower') || cc.includes('calf');
    const isKnee = cc.includes('knee') || cc.includes('joint') || cc.includes('घुटन');
    const isChest = cc.includes('chest') || cc.includes('precordial') || cc.includes('सीन');
    const isAbdomen = cc.includes('abdomen') || cc.includes('dyspepsia') || cc.includes('pet') || cc.includes('पेट');
    const isHead = cc.includes('head') || cc.includes('sir') || cc.includes('सिर') || cc.includes('migraine');
    const isFever = cc.includes('fever') || cc.includes('bukhar') || cc.includes('बुखार') || cc.includes('pyrexia');

    // --------------------------------------------------------------------------
    // GAP 1: ONSET / DURATION (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (!slots.durationOnset) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'पैरों में यह दर्द कब से शुरू हुआ है? क्या यह अचानक शुरू हुआ या किसी खिंचाव/चोट के बाद हुआ?'
            : 'When did this leg pain start? Did it begin suddenly or after an injury/strain?',
          isReadyForStep2: false,
          targetSlot: 'durationOnset',
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों में यह तकलीफ कितने समय से है? क्या यह कुछ दिनों से है या कई महीनों से बनी हुई है?'
            : 'How long have you had this knee discomfort? Has it been present for a few days or several months?',
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
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'पेट में यह दर्द कब से शुरू हुआ है और क्या यह कुछ खाने-पीने के बाद बढ़ा?'
            : 'When did this abdominal pain begin, and did it start after eating or drinking anything?',
          isReadyForStep2: false,
          targetSlot: 'durationOnset',
        };
      }
      if (isHead) {
        return {
          questionText: isHi
            ? 'सिरदर्द कब से शुरू हुआ है? क्या यह अचानक तेज हुआ है या धीरे-धीरे बढ़ रहा है?'
            : 'When did this headache start? Did it begin suddenly or build up gradually?',
          isReadyForStep2: false,
          targetSlot: 'durationOnset',
        };
      }
      if (isFever) {
        return {
          questionText: isHi
            ? 'बुखार कितने दिनों से आ रहा है और क्या यह लगातार बना रहता है?'
            : 'How many days have you had this fever, and is it continuous or coming in spikes?',
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
            ? 'पैरों का दर्द किस प्रकार का महसूस होता है? क्या मांसपेशियों में ऐंठन/खिंचाव है, पिंडलियों में भारीपन है, या नसों में चुभन है?'
            : 'What type of pain is it in your legs? Is it muscle cramping/spasm, heaviness in calves, or sharp nerve tingling?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'घुटनों में दर्द के साथ क्या सुबह अकड़न रहती है या मुड़ने में चटकने की आवाज और खिंचाव महसूस होता है?'
            : 'Along with the knee pain, do you experience morning stiffness or a cracking sensation when bending?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'सीने का दर्द किस प्रकार का महसूस होता है? क्या भारी दबाव/निचोड़ने जैसा है या तेज जलन/चुभन जैसा?'
            : 'How does the chest pain feel? Is it heavy crushing pressure/squeezing, or sharp/burning?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'पेट का दर्द कैसा महसूस हो रहा है? क्या मरोड़ (ऐंठन) है, भारी जलन है या लगातार मीठा दर्द बना है?'
            : 'How does the abdominal pain feel? Is it cramping/colicky, sharp burning, or a constant dull ache?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      if (isHead) {
        return {
          questionText: isHi
            ? 'सिरदर्द किस प्रकार का है? क्या नसों में धड़कन (throbbing) जैसा है, भारीपन है या माथे में तेज चुभन है?'
            : 'What type of headache is it? Is it pulsating/throbbing, a heavy tight band, or sharp localized pain?',
          isReadyForStep2: false,
          targetSlot: 'characterQuality',
        };
      }
      if (isFever) {
        return {
          questionText: isHi
            ? 'बुखार के साथ क्या ठंड लगकर कंपकंपी (chills/shivering) आ रही है, तेज पसीना आ रहा है, या पूरे शरीर व मांसपेशियों में दर्द/टूटना महसूस हो रहा है?'
            : 'Along with the fever, do you experience chills, shivering, profuse sweating, or severe body aches?',
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
      if (isFever) {
        return {
          questionText: isHi
            ? 'बुखार कितना तेज रहता है (थर्मामीटर में कितना तापमान आया, या 1 से 10 के पैमाने पर कमजोरी व बुखार की तीव्रता कितनी है)?'
            : 'How high is your fever (thermometer reading, or on a 1 to 10 scale how severe is the fever and fatigue)?',
          isReadyForStep2: false,
          targetSlot: 'severityNumber',
        };
      }
      return {
        questionText: isHi
          ? '1 से 10 के पैमाने पर आप इस दर्द/तकलीफ की तीव्रता को कितना अंक देंगे (जहाँ 1 हल्का और 10 असहनीय दर्द हो)?'
          : 'On a scale of 1 to 10 (where 1 is mild discomfort and 10 is unbearable pain), how would you rate the severity?',
        isReadyForStep2: false,
        targetSlot: 'severityNumber',
      };
    }

    // --------------------------------------------------------------------------
    // GAP 4: RADIATION / ASSOCIATED SYMPTOMS / TRIGGERS (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (!slots.radiationLocation && (!slots.associatedSymptoms || slots.associatedSymptoms.length === 0)) {
      if (isLeg) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द कमर या कूल्हे से नीचे पैर की तरफ फैलता है, और क्या पैरों में कोई सूजन (swelling) या चलने में तकलीफ है?'
            : 'Does the pain radiate down from your lower back/hip, and is there any swelling or difficulty walking?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      if (isKnee) {
        return {
          questionText: isHi
            ? 'क्या जोड़ों में कोई सूजन (swelling) या लाली है, और क्या सीढ़ियां चढ़ने या बैठने पर दर्द ज्यादा बढ़ता है?'
            : 'Is there any joint swelling or redness, and does the pain worsen while climbing stairs or sitting down?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      if (isChest) {
        return {
          questionText: isHi
            ? 'क्या यह दर्द आपके बाएँ हाथ, कंधे, गर्दन या जबड़े की तरफ भी फैल रहा है, और क्या सांस फूलने या पसीना आने की शिकायत है?'
            : 'Does the pain radiate to your left arm, shoulder, neck, or jaw, and are you having breathlessness or cold sweating?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      if (isAbdomen) {
        return {
          questionText: isHi
            ? 'क्या पेट का दर्द पीठ की तरफ भी फैलता है, और क्या उल्टी, जी मिचलाना या दस्त की शिकायत है?'
            : 'Does the abdominal pain radiate to your back, and are you experiencing nausea, vomiting, or loose stools?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      if (isHead) {
        return {
          questionText: isHi
            ? 'क्या सिरदर्द के साथ आँखों में भारीपन, उल्टी का मन या रोशनी/आवाज से परेशानी हो रही है?'
            : 'Along with the headache, do you have nausea, eye strain, or sensitivity to light/sound?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      if (isFever) {
        return {
          questionText: isHi
            ? 'क्या बुखार के साथ खांसी, जुकाम, गले में खराश, सिरदर्द, उल्टी या पेशाब में जलन जैसी कोई अन्य शिकायत भी है?'
            : 'Along with fever, do you have cough, cold, sore throat, headache, vomiting, or burning during urination?',
          isReadyForStep2: false,
          targetSlot: 'radiationLocation',
        };
      }
      return {
        questionText: isHi
          ? 'क्या इस दर्द के साथ कोई अन्य लक्षण (जैसे सूजन, सुन्नपन या कमजोरी) भी महसूस हो रहे हैं?'
          : 'Are there any other associated symptoms like swelling, numbness, or weakness?',
        isReadyForStep2: false,
        targetSlot: 'radiationLocation',
      };
    }

    // --------------------------------------------------------------------------
    // GAP 5: PAST MEDICAL HISTORY & MEDICATIONS (Only ask if UNKNOWN)
    // --------------------------------------------------------------------------
    if (!slots.pastHistory || slots.pastHistory.length === 0) {
      if (isFever) {
        return {
          questionText: isHi
            ? 'क्या आपने बुखार के लिए पेरासिटामोल (Dolo/Crocin) या कोई अन्य दवा ली है, और क्या आपको पहले से बीपी, शुगर या कोई पुरानी बीमारी है?'
            : 'Have you taken Paracetamol or any other medication for this fever, and do you have any past medical conditions like BP or Diabetes?',
          isReadyForStep2: false,
          targetSlot: 'pastHistory',
        };
      }
      return {
        questionText: isHi
          ? 'क्या आपको पहले से डायबिटीज (शुगर), हाई बीपी, यूरिक एसिड या थायरॉयड की कोई बीमारी है और क्या आप कोई नियमित दवा ले रहे हैं?'
          : 'Do you have any past medical conditions such as Diabetes, High BP, Uric Acid, or Thyroid, and are you taking any regular medications?',
        isReadyForStep2: false,
        targetSlot: 'pastHistory',
      };
    }

    // --------------------------------------------------------------------------
    // ALL 5 CORE PILLARS GENUINELY SATISFIED -> SMOOTH CONCLUSION TO STEP 2
    // --------------------------------------------------------------------------
    return {
      questionText: this.getClosingStatement(language),
      isReadyForStep2: true,
      targetSlot: 'completed',
    };
  }

  public getClosingStatement(language: 'hi' | 'en'): string {
    return language === 'hi'
      ? 'धन्यवाद, आपके मुख्य लक्षणों, तीव्रता और चिकित्सीय इतिहास का पूर्ण रिकॉर्ड तैयार कर लिया गया है। अब अगले चरण (आयुर्वेद एवं जीवनशैली परीक्षा) पर आगे बढ़ते हैं।'
      : 'Thank you, your clinical symptoms, severity, and medical history have been thoroughly recorded. Now proceeding to Step 2 for the Ayurvedic & Lifestyle Assessment.';
  }

  /**
   * Deterministically verifies if an AI response is a pure closing statement.
   * STRICT GUARD: If the message contains a question mark '?' or active question words,
   * it returns FALSE to ensure the patient is never skipped.
   */
  public isClosingStatement(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const clean = sanitizeAIResponse(text);
    const lower = clean.toLowerCase().trim();
    if (!lower) return false;

    // GUARD 1: Any question mark indicates a pending question -> NEVER a closing statement!
    if (lower.includes('?') || lower.includes('？')) {
      return false;
    }

    // GUARD 2: Any question-pattern words directed at the patient -> NEVER a closing statement!
    const questionPatterns = [
      /\b(kya|kab|kahan|kaha|kaisa|kaisi|kaise|kitna|kitne|kitni|kaun|bataiye|bataye|batao)\b/i,
      /\b(do you|are you|can you|is there|how|what|when|where|please tell)\b/i,
      /(क्या|कब|कहाँ|कहां|कैसा|कैसी|कैसे|कितना|कितने|कितनी|कौन|बताइए|बताएं|बताओ)/
    ];
    for (const qPattern of questionPatterns) {
      if (qPattern.test(lower)) {
        return false;
      }
    }

    // Direct explicit closing phrases (when NO question is present)
    const explicitClosingPhrases = [
      'step 2',
      'चरण 2',
      'चरण दो',
      'आयुर्वेद एवं जीवनशैली',
      'ayurvedic & lifestyle assessment',
      'ayurvedic assessment',
      'thoroughly recorded',
      'intake is complete',
      'intake complete',
      'proceeding to step 2',
      'proceed to step 2',
      'अगले चरण पर आगे बढ़ते हैं',
      'अगले चरण पर आगे बढ़ते हैं',
      'चरण 2 पर आगे बढ़ते हैं',
      'चरण 2 पर आगे बढ़ते हैं',
      'पूर्ण रिकॉर्ड तैयार',
      'रिकॉर्ड तैयार कर लिया गया है',
      'विवरण दर्ज कर लिया गया है',
      'सभी लक्षण दर्ज कर लिए गए हैं',
      'symptoms have been recorded',
      'symptoms are recorded',
      'details have been recorded',
      'information has been recorded',
      'all details recorded',
      'ready for triage',
    ];

    for (const phrase of explicitClosingPhrases) {
      if (lower.includes(phrase)) return true;
    }

    // Hindi Closing Combinations (धन्यवाद + दर्ज/रिकॉर्ड/तैयार/अगले चरण without questions)
    if (
      lower.includes('धन्यवाद') &&
      (
        lower.includes('दर्ज कर लिया') ||
        lower.includes('रिकॉर्ड तैयार') ||
        lower.includes('पूर्ण रिकॉर्ड') ||
        lower.includes('अगले चरण') ||
        lower.includes('चरण 2') ||
        lower.includes('तैयार कर लिया')
      )
    ) {
      return true;
    }

    // English Closing Combinations (thank you / noted + recorded / proceed without questions)
    if (
      (lower.includes('thank you') || lower.includes('thanks') || lower.includes('understood')) &&
      (lower.includes('recorded') || lower.includes('proceed to step 2') || lower.includes('proceeding to step 2'))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Evaluates if the clinical interview is ready for Step 2.
   * - Rule 1 (Proper slot-based completion): All essential clinical pillars genuinely captured.
   * - Rule 2 (Thorough multi-turn): 5+ patient exchanges with at least 4 core dimensions.
   * - Rule 3 (Emergency loop prevention ONLY): 7+ turns with at least 3 core dimensions.
   */
  public isClinicalIntakeComplete(slots: ExtractedClinicalSlots, patientTurnCount?: number): boolean {
    const hasChiefComplaint = Boolean(slots.chiefComplaint && slots.chiefComplaint.trim().length > 0);
    const hasOnsetAndDuration = Boolean(slots.durationOnset && slots.durationOnset.trim().length > 0);
    const hasCharacter = Boolean(slots.characterQuality && slots.characterQuality.trim().length > 0);
    const hasSeverity = slots.severityNumber !== undefined && slots.severityNumber !== null;
    const hasFollowUpDetail =
      Boolean(slots.radiationLocation && slots.radiationLocation.trim().length > 0) ||
      Boolean(slots.associatedSymptoms && slots.associatedSymptoms.length > 0);
    const hasHistoryOrMeds = Boolean(slots.pastHistory && slots.pastHistory.length > 0);

    const validSlotCount = [hasOnsetAndDuration, hasCharacter, hasSeverity, hasFollowUpDetail, hasHistoryOrMeds].filter(Boolean).length;

    // Rule 1: Full core coverage: Chief Complaint + Onset + (Character OR Severity) + Follow-up detail + History/Meds
    if (hasChiefComplaint && hasOnsetAndDuration && (hasCharacter || hasSeverity) && hasFollowUpDetail && hasHistoryOrMeds) {
      return true;
    }

    // Rule 2: Minimum 5 exchanges with chief complaint and at least 4 of the 5 core dimensions filled
    if (patientTurnCount && patientTurnCount >= 5 && hasChiefComplaint && validSlotCount >= 4) {
      return true;
    }

    // Rule 3: Safety limit — emergency loop-breaker only for long/confused conversations (7+ turns) with at least 3 dimensions
    if (patientTurnCount && patientTurnCount >= 7 && hasChiefComplaint && validSlotCount >= 3) {
      return true;
    }

    return false;
  }
}

/**
 * Robustly sanitizes raw AI outputs to prevent reasoning leakage (<think> blocks, markdown meta-headers)
 */
export function sanitizeAIResponse(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Strip completed <think>...</think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 2. Strip unclosed <think> blocks (e.g. <think> to end of text when tokens hit mid-thought)
  text = text.replace(/<think>[\s\S]*$/gi, '');

  // 3. Strip stray tags
  text = text.replace(/<\/?think>/gi, '');

  // 4. Strip internal meta-reasoning patterns
  text = text.replace(/(?:Here'?s\s+(?:a\s+)?thinking\s+process|Thinking\s+Process|Reasoning\s+Process)[\s\S]*?(?=\n\n|[A-Z][a-z]+:|\d+\.|\?|$)/gi, '');
  text = text.replace(/\*\*(?:Analyze\s+User\s+Input|Clinical\s+Analysis|Internal\s+Reasoning|Plan)\*\*[\s\S]*?(?=\n\n|[A-Z][a-z]+:|\?|$)/gi, '');

  // 5. Clean markdown headers and extra symbols
  text = text.replace(/[*_#`~|]/g, '').trim();

  return text;
}

export const adaptiveInterviewEngine = new AdaptiveClinicalInterviewEngine();
