import { ClinicalQuestion, SymptomOntologyBranch } from '@/types/ontology';

export const CHIEF_COMPLAINT_OPTIONS = [
  { value: 'chest_pain', labelEn: 'Chest Pain / Discomfort', labelHi: 'सीने में दर्द / बेचैनी', isRedFlag: true, iconName: 'HeartPulse' },
  { value: 'breathlessness', labelEn: 'Shortness of Breath / Breathing Difficulty', labelHi: 'सांस लेने में तकलीफ', isRedFlag: true, iconName: 'Wind' },
  { value: 'fever', labelEn: 'Fever / Chills', labelHi: 'बुखार / ठंड लगना', iconName: 'Thermometer' },
  { value: 'abdominal_pain', labelEn: 'Abdominal / Stomach Pain', labelHi: 'पेट में दर्द', iconName: 'Activity' },
  { value: 'headache_dizziness', labelEn: 'Severe Headache / Dizziness', labelHi: 'सिरदर्द / चक्कर आना', isRedFlag: true, iconName: 'Brain' },
  { value: 'joint_pain', labelEn: 'Joint Pain / Stiffness (Sandhigata Vata)', labelHi: 'जोड़ों का दर्द / जकड़न (संधिवात)', iconName: 'Bone' },
  { value: 'cough_cold', labelEn: 'Cough / Sore Throat / Cold', labelHi: 'खांसी / गले में खराश / सर्दी', iconName: 'Stethoscope' },
  { value: 'skin_rash', labelEn: 'Skin Rash / Itching / Lesions', labelHi: 'त्वचा पर चकत्ते / खुजली', iconName: 'Sparkles' },
  { value: 'diabetes_check', labelEn: 'Diabetes / Blood Sugar Follow-up', labelHi: 'मधुमेह (डायबिटीज) जांच', iconName: 'Droplet' },
  { value: 'hypertension_check', labelEn: 'High Blood Pressure Check', labelHi: 'हाई ब्लड प्रेशर (उच्च रक्तचाप)', iconName: 'Activity' },
];

export const CLINICAL_ONTOLOGY_QUESTIONS: Record<string, ClinicalQuestion[]> = {
  // Deep branch for Chest Pain
  chest_pain: [
    {
      id: 'cp-01',
      key: 'onset',
      category: 'hpi_onset',
      textEn: 'When did the chest pain or discomfort start?',
      textHi: 'सीने में दर्द या बेचैनी कब शुरू हुई?',
      audioPromptEn: 'Please tell or select when this chest pain started.',
      audioPromptHi: 'कृपया बताएं कि यह सीने का दर्द कब शुरू हुआ।',
      inputType: 'single_choice',
      options: [
        { labelEn: 'Less than 1 hour ago', labelHi: '1 घंटे से कम पहले', value: '<1_hour', isRedFlag: true },
        { labelEn: '1 to 6 hours ago', labelHi: '1 से 6 घंटे पहले', value: '1-6_hours', isRedFlag: true },
        { labelEn: '6 to 24 hours ago', labelHi: '6 से 24 घंटे पहले', value: '6-24_hours' },
        { labelEn: 'More than 1 day ago', labelHi: '1 दिन से अधिक पहले', value: '>1_day' },
        { labelEn: 'Recurrent for weeks/months', labelHi: 'हफ़्तों या महीनों से बार-बार', value: 'chronic_recurrent' },
      ],
    },
    {
      id: 'cp-02',
      key: 'character',
      category: 'hpi_character',
      textEn: 'What does the pain feel like?',
      textHi: 'दर्द किस प्रकार का महसूस होता है?',
      audioPromptEn: 'How would you describe the feeling of the pain in your chest?',
      audioPromptHi: 'सीने में दर्द का अहसास कैसा है?',
      inputType: 'single_choice',
      options: [
        { labelEn: 'Heavy crushing / Pressure / Squeezing', labelHi: 'भारी दबाव / जकड़न / भारीपन', value: 'crushing_pressure', isRedFlag: true },
        { labelEn: 'Sharp / Stabbing / Pricking', labelHi: 'तेज चुभन / सुई जैसा दर्द', value: 'sharp_stabbing' },
        { labelEn: 'Burning / Acidic', labelHi: 'जलन / एसिडिटी जैसा', value: 'burning' },
        { labelEn: 'Dull ache / Tightness', labelHi: 'हल्का धीमा दर्द / खिंचाव', value: 'dull_ache' },
      ],
    },
    {
      id: 'cp-03',
      key: 'severity',
      category: 'hpi_severity',
      textEn: 'How severe is the pain on a scale from 1 (Mild) to 10 (Worst ever)?',
      textHi: 'दर्द की तीव्रता 1 (हल्का) से 10 (असहनीय) के पैमाने पर कितनी है?',
      audioPromptEn: 'Rate your chest pain severity from 1 to 10.',
      audioPromptHi: 'अपने सीने के दर्द को 1 से 10 के पैमाने पर बताएं।',
      inputType: 'severity_slider',
      redFlagConditions: {
        severityGte: 7,
        alertText: 'High pain score (>=7/10) with suspected cardiovascular etiology',
        priority: 'RED',
      },
    },
    {
      id: 'cp-04',
      key: 'radiation',
      category: 'hpi_radiation',
      textEn: 'Does the pain spread (radiate) anywhere else?',
      textHi: 'क्या दर्द शरीर के किसी अन्य हिस्से में फैल रहा है?',
      audioPromptEn: 'Does the pain spread to your arm, neck, jaw, or back?',
      audioPromptHi: 'क्या दर्द आपके हाथ, गर्दन, जबड़े या पीठ की तरफ जा रहा है?',
      inputType: 'multi_choice',
      options: [
        { labelEn: 'Left arm / Shoulder', labelHi: 'बायां हाथ / कंधा', value: 'left_arm', isRedFlag: true },
        { labelEn: 'Neck / Jaw / Throat', labelHi: 'गर्दन / जबड़ा / गला', value: 'jaw_neck', isRedFlag: true },
        { labelEn: 'Upper Back (between shoulder blades)', labelHi: 'पीठ का ऊपरी हिस्सा', value: 'upper_back', isRedFlag: true },
        { labelEn: 'Upper Abdomen / Epigastrium', labelHi: 'पेट का ऊपरी हिस्सा', value: 'epigastrium' },
        { labelEn: 'No radiation (stays in center)', labelHi: 'कहीं नहीं फैलता (केवल सीने में)', value: 'none' },
      ],
    },
    {
      id: 'cp-05',
      key: 'associated_symptoms',
      category: 'associated_symptoms',
      textEn: 'Are you experiencing any of these associated symptoms?',
      textHi: 'क्या आपको इनमें से कोई अन्य लक्षण महसूस हो रहे हैं?',
      audioPromptEn: 'Select any additional symptoms you have right now.',
      audioPromptHi: 'कृपया साथ में महसूस होने वाले अन्य लक्षण चुनें।',
      inputType: 'multi_choice',
      options: [
        { labelEn: 'Cold sweats / Profuse sweating (Diaphoresis)', labelHi: 'ठंडा पसीना / अत्यधिक पसीना', value: 'sweating', isRedFlag: true },
        { labelEn: 'Shortness of breath / Breathing difficulty', labelHi: 'सांस फूलना / सांस लेने में कठिनाई', value: 'dyspnea', isRedFlag: true },
        { labelEn: 'Nausea or vomiting', labelHi: 'जी मिचलाना या उल्टी', value: 'nausea_vomiting' },
        { labelEn: 'Dizziness / Feeling faint (Lightheadedness)', labelHi: 'चक्कर आना / बेहोशी जैसा लगना', value: 'presyncope', isRedFlag: true },
        { labelEn: 'Rapid irregular heartbeat (Palpitations)', labelHi: 'दिल की धड़कन तेज या अनियमित होना', value: 'palpitations' },
        { labelEn: 'None of the above', labelHi: 'इनमें से कोई नहीं', value: 'none' },
      ],
    },
  ],

  // Joint Pain & AYUSH Sandhigata Vata Branch
  joint_pain: [
    {
      id: 'jp-01',
      key: 'location',
      category: 'hpi_onset',
      textEn: 'Which joints are primarily painful or swollen?',
      textHi: 'मुख्य रूप से किन जोड़ों में दर्द या सूजन है?',
      inputType: 'multi_choice',
      options: [
        { labelEn: 'Bilateral Knees (Janu Sandhi)', labelHi: 'दोनों घुटने (जानु संधि)', value: 'knees' },
        { labelEn: 'Lower Back / Spine (Kati Sandhi)', labelHi: 'कमर का निचला हिस्सा / रीढ़ (कटि)', value: 'lower_back' },
        { labelEn: 'Shoulders (Amsa Sandhi)', labelHi: 'कंधे (अंस संधि)', value: 'shoulders' },
        { labelEn: 'Small joints of hands / wrists', labelHi: 'हाथों और कलाई के छोटे जोड़', value: 'hands_wrists' },
        { labelEn: 'Ankles / Feet', labelHi: 'टखने / पैर', value: 'ankles' },
      ],
    },
    {
      id: 'jp-02',
      key: 'stiffness',
      category: 'hpi_character',
      textEn: 'Do you experience morning stiffness in the joints?',
      textHi: 'क्या सुबह उठने पर जोड़ों में जकड़न (Stiffness) महसूस होती है?',
      inputType: 'single_choice',
      options: [
        { labelEn: 'Yes, lasts > 1 hour (Severe stiffness)', labelHi: 'हाँ, 1 घंटे से अधिक समय तक', value: 'stiffness_gt_1hr' },
        { labelEn: 'Yes, lasts < 30 minutes (Mild stiffness)', labelHi: 'हाँ, 30 मिनट से कम समय तक', value: 'stiffness_lt_30min' },
        { labelEn: 'No morning stiffness', labelHi: 'सुबह कोई जकड़न नहीं होती', value: 'no_stiffness' },
      ],
    },
    {
      id: 'jp-03',
      key: 'aggravating_factors',
      category: 'hpi_triggers',
      textEn: 'What makes the pain worse?',
      textHi: 'दर्द किस स्थिति में बढ़ जाता है?',
      inputType: 'multi_choice',
      options: [
        { labelEn: 'Cold weather / exposure to cold water (Sheeta Vihara)', labelHi: 'ठंड का मौसम / ठंडे पानी से (शीत विहार)', value: 'cold_weather' },
        { labelEn: 'Walking, climbing stairs, or weight bearing', labelHi: 'चलने, सीढ़ियां चढ़ने या वजन उठाने पर', value: 'physical_strain' },
        { labelEn: 'Rest / Inactivity', labelHi: 'आराम करने पर', value: 'rest' },
      ],
    }
  ],

  // Fever Branch
  fever: [
    {
      id: 'fv-01',
      key: 'duration',
      category: 'hpi_duration',
      textEn: 'How many days have you had the fever?',
      textHi: 'आपको बुखार कितने दिनों से है?',
      inputType: 'single_choice',
      options: [
        { labelEn: '1 to 3 days', labelHi: '1 से 3 दिन', value: '1-3_days' },
        { labelEn: '4 to 7 days', labelHi: '4 से 7 दिन', value: '4-7_days' },
        { labelEn: 'More than 1 week', labelHi: '1 सप्ताह से अधिक', value: '>1_week' },
      ],
    },
    {
      id: 'fv-02',
      key: 'pattern',
      category: 'hpi_character',
      textEn: 'Does the fever come with chills or body aches?',
      textHi: 'क्या बुखार ठंड लगकर या बदन दर्द के साथ आता है?',
      inputType: 'multi_choice',
      options: [
        { labelEn: 'Shivering / Chills (Rigors)', labelHi: 'कपकपी / ठंड लगना', value: 'chills' },
        { labelEn: 'Severe headache or eye pain', labelHi: 'तेज सिरदर्द या आंखों में दर्द', value: 'headache' },
        { labelEn: 'Burning sensation during urination', labelHi: 'पेशाब में जलन', value: 'dysuria' },
        { labelEn: 'Abdominal pain / vomiting', labelHi: 'पेट दर्द / उल्टी', value: 'abd_pain' },
      ],
    }
  ]
};

export const SYSTEMIC_HISTORY_QUESTIONS: ClinicalQuestion[] = [
  {
    id: 'sh-01',
    key: 'past_medical_history',
    category: 'past_medical_history',
    textEn: 'Do you have any existing chronic medical conditions?',
    textHi: 'क्या आपको पहले से कोई पुरानी बीमारी या समस्या है?',
    inputType: 'multi_choice',
    options: [
      { labelEn: 'High Blood Pressure (Hypertension)', labelHi: 'हाई ब्लड प्रेशर (उच्च रक्तचाप)', value: 'hypertension' },
      { labelEn: 'Diabetes (High Blood Sugar)', labelHi: 'शुगर / मधुमेह (डायबिटीज)', value: 'diabetes' },
      { labelEn: 'Heart Disease / Prior Stent or Heart Attack', labelHi: 'हृदय रोग / स्टेंट / दिल का दौरा', value: 'cardiac_disease', isRedFlag: true },
      { labelEn: 'Asthma / Chronic Breathing Issues (COPD)', labelHi: 'दमा / सांस की पुरानी बीमारी (अस्थमा)', value: 'asthma' },
      { labelEn: 'Kidney Disease / Dialysis', labelHi: 'गुर्दे (किडनी) की बीमारी', value: 'kidney_disease' },
      { labelEn: 'Thyroid Disorder', labelHi: 'थायराइड विकार', value: 'thyroid' },
      { labelEn: 'None of the above', labelHi: 'इनमें से कोई नहीं', value: 'none' },
    ],
  },
  {
    id: 'sh-02',
    key: 'allergies',
    category: 'allergies',
    textEn: 'Do you have any known allergies to medicines, foods, or injections?',
    textHi: 'क्या आपको किसी दवा, भोजन या इंजेक्शन से कोई एलर्जी है?',
    inputType: 'single_choice',
    options: [
      { labelEn: 'Yes — Allergic to Penicillin / Antibiotics', labelHi: 'हाँ — पेनिसिलिन / एंटीबायोटिक से एलर्जी है', value: 'penicillin_allergy', isRedFlag: true },
      { labelEn: 'Yes — Allergic to Painkillers (NSAIDs / Paracetamol)', labelHi: 'हाँ — दर्दनिवारक दवाओं से एलर्जी है', value: 'nsaid_allergy' },
      { labelEn: 'Yes — Other Drug / Food Allergy', labelHi: 'हाँ — अन्य दवा या खाद्य एलर्जी', value: 'other_allergy' },
      { labelEn: 'No known allergies', labelHi: 'कोई ज्ञात एलर्जी नहीं है', value: 'no_known_allergies' },
      { labelEn: 'Not sure / Unanswered', labelHi: 'मुझे निश्चित रूप से पता नहीं है', value: 'unsure' },
    ],
  }
];
