export interface AyurvedicQuestionOption {
  key: string;
  labelEn: string;
  labelHi: string;
  doshaWeight?: 'vata' | 'pitta' | 'kapha' | 'sama';
}

export interface AyurvedicQuestion {
  id: string;
  dimension: 'prakriti' | 'vikriti' | 'agni' | 'koshtha' | 'ahara_vihara' | 'nidana' | 'dhatu';
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  options: AyurvedicQuestionOption[];
}

export interface AyurvedicAssessmentAnswers {
  prakritiPrimary?: string;
  prakritiSecondary?: string;
  prakritiNotes?: string;
  vikritiDosha?: string;
  vikritiNotes?: string;
  agniType?: string;
  agniNotes?: string;
  koshthaType?: string;
  koshthaNotes?: string;
  aharaHabits?: string;
  viharaHabits?: string;
  nidanaFactors?: string[];
  nidanaFreeText?: string;
  dhatuAffected?: string[];
  dhatuNotes?: string;
  customComments?: string;
}

export const AYURVEDIC_QUESTIONS: AyurvedicQuestion[] = [
  {
    id: 'prakriti',
    dimension: 'prakriti',
    titleEn: '1. Constitutional Type (Prakriti / Deha Prakriti)',
    titleHi: '1. शारीरिक प्रकृति (देह प्रकृति)',
    descriptionEn: 'Which constitutional profile best describes your natural body frame and tendencies since childhood?',
    descriptionHi: 'बचपन से आपकी स्वाभाविक शारीरिक बनावट और आदतें किस प्रकार की रही हैं?',
    options: [
      { key: 'vata', labelEn: 'Vata Predominant — Lean frame, dry skin, quick moving, variable energy', labelHi: 'वात प्रधान — दुबला शरीर, रूखी त्वचा, चंचल स्वभाव, बदलती ऊर्जा', doshaWeight: 'vata' },
      { key: 'pitta', labelEn: 'Pitta Predominant — Medium athletic build, high body warmth, sharp hunger', labelHi: 'पित्त प्रधान — मध्यम सुडौल शरीर, गर्मी सहन न होना, तीक्ष्ण भूख', doshaWeight: 'pitta' },
      { key: 'kapha', labelEn: 'Kapha Predominant — Sturdy solid frame, calm composed nature, smooth skin', labelHi: 'कफ प्रधान — गठीला मजबूत शरीर, शांत स्वभाव, चिकनी त्वचा', doshaWeight: 'kapha' },
      { key: 'vata_pitta', labelEn: 'Vata-Pitta Dual — Slender/medium, sensitive digestion, active mind', labelHi: 'वात-पित्त द्वंद्व — मध्यम/पतला शरीर, संवेदनशील पाचन, सक्रिय बुद्धि' },
      { key: 'pitta_kapha', labelEn: 'Pitta-Kapha Dual — Strong physique, balanced stamina, warm skin', labelHi: 'पित्त-कफ द्वंद्व — बलवान शरीर, अच्छी सहनशक्ति, गर्म त्वचा' },
      { key: 'vata_kapha', labelEn: 'Vata-Kapha Dual — Cold sensitivity, fluctuating weight, dry/oily mix', labelHi: 'वात-कफ द्वंद्व — ठंड अधिक लगना, वजन में उतार-चढ़ाव' },
    ],
  },
  {
    id: 'vikriti',
    dimension: 'vikriti',
    titleEn: '2. Current Imbalance (Vikriti / Dosha Dushti)',
    titleHi: '2. वर्तमान दोष विकृति (दोष असंतुलन)',
    descriptionEn: 'What is the dominant nature of your current illness symptoms?',
    descriptionHi: 'आपकी वर्तमान तकलीफ में किस प्रकार के लक्षण सबसे ज्यादा दिखाई दे रहे हैं?',
    options: [
      { key: 'vata_vriddhi', labelEn: 'Vata Imbalance — Pain, stiffness, cracking joints, gas, dryness, sleep issues', labelHi: 'वात वृद्धि — दर्द, जकड़न, जोड़ों में आवाज, पेट में गैस, रूखापन, अनिद्रा', doshaWeight: 'vata' },
      { key: 'pitta_vriddhi', labelEn: 'Pitta Imbalance — Burning sensation, acidity, skin heat, excessive thirst/sweating', labelHi: 'पित्त वृद्धि — जलन, खट्टी डकार, त्वचा में लाली, अत्यधिक प्यास या पसीना', doshaWeight: 'pitta' },
      { key: 'kapha_vriddhi', labelEn: 'Kapha Imbalance — Heaviness in body, lethargy, excessive phlegm, slow digestion', labelHi: 'कफ वृद्धि — शरीर में भारीपन, सुस्ती, अत्यधिक बलगम, धीमा चयापचय', doshaWeight: 'kapha' },
      { key: 'sannipata', labelEn: 'Tridoshic / Mixed — Severe combination of pain, heat, and heavy swelling', labelHi: 'सन्निपात — दर्द, जलन और सूजन का मिश्रित गंभीर प्रभाव' },
    ],
  },
  {
    id: 'agni',
    dimension: 'agni',
    titleEn: '3. Digestive Fire Capacity (Jatharagni Pariksha)',
    titleHi: '3. जठराग्नि परीक्षा (पाचन शक्ति)',
    descriptionEn: 'How is your daily digestive fire, appetite, and assimilation after meals?',
    descriptionHi: 'भोजन करने के बाद आपकी पाचन शक्ति और भूख का स्तर कैसा रहता है?',
    options: [
      { key: 'sama_agni', labelEn: 'Sama Agni — Regular healthy appetite, easily digests on time with no discomfort', labelHi: 'समाग्नि — समय पर उचित भूख लगना और बिना किसी परेशानी के सही पाचन' },
      { key: 'vishama_agni', labelEn: 'Vishama Agni (Vata) — Irregular appetite; sometimes very hungry, sometimes no hunger, bloating', labelHi: 'विषमाग्नि (वात) — अनियमित भूख; कभी बहुत भूख कभी बिल्कुल नहीं, पेट फूलना' },
      { key: 'tikshna_agni', labelEn: 'Tikshna Agni (Pitta) — Intense ravenous hunger, burning acid reflux if meals delayed', labelHi: 'तीक्ष्णाग्नि (पित्त) — अत्यधिक तीव्र भूख, भोजन में देरी होने पर जलन व एसिडिटी' },
      { key: 'manda_agni', labelEn: 'Manda Agni (Kapha) — Sluggish digestion, feeling heavy for 5-6 hours after light meal', labelHi: 'मंदाग्नि (कफ) — कमजोर/धीमा पाचन, हल्का खाना खाने पर भी घंटों भारीपन' },
    ],
  },
  {
    id: 'koshtha',
    dimension: 'koshtha',
    titleEn: '4. Bowel Nature (Koshtha Pariksha)',
    titleHi: '4. कोष्ठ परीक्षा (मल निष्कासन प्रवृत्ति)',
    descriptionEn: 'What is the characteristic pattern of your bowel movements?',
    descriptionHi: 'आपके पेट साफ होने और मल त्याग की प्रवृत्ति कैसी है?',
    options: [
      { key: 'mridu', labelEn: 'Mridu Koshtha — Soft/loose stools, very sensitive (even milk causes quick evacuation)', labelHi: 'मृदु कोष्ठ — नरम मल, आसानी से पेट साफ, दूध पीने पर भी तुरंत दस्त लगना' },
      { key: 'madhyama', labelEn: 'Madhyama Koshtha — Normal regular evacuation once or twice daily without strain', labelHi: 'मध्यम कोष्ठ — दिन में एक या दो बार स्वाभाविक रूप से सामान्य पेट साफ होना' },
      { key: 'krura', labelEn: 'Krura Koshtha — Hard, dry stools, chronic constipation requiring laxatives/warm water', labelHi: 'क्रूर कोष्ठ — कठोर/कब्जियत युक्त मल, पेट साफ होने में कठिनाई' },
    ],
  },
  {
    id: 'ahara_vihara',
    dimension: 'ahara_vihara',
    titleEn: '5. Diet & Lifestyle Routine (Ahara & Vihara)',
    titleHi: '5. आहार एवं विहार (खान-पान व दिनचर्या)',
    descriptionEn: 'Select which dietary and lifestyle factors apply to your daily routine:',
    descriptionHi: 'अपनी दैनिक खान-पान व रहन-सहन की आदतों का चयन करें:',
    options: [
      { key: 'sheeta_ruksha', labelEn: 'Frequent cold drinks, raw salads, dry/packaged snacks, irregular eating times', labelHi: 'शीत-रूक्ष आहार — ठंडा पानी/पेय, कच्चा सलाद, सूखा/पैकेटबंद भोजन, अनियमित समय' },
      { key: 'katu_vidahi', labelEn: 'Spicy, deep fried, fermented (idli/dosa/alcohol), highly salted foods', labelHi: 'कटु-विदाही — अत्यधिक मिर्च-मसाला, तला-भुना, खमीरयुक्त व खट्टा भोजन' },
      { key: 'guru_snigdha', labelEn: 'Heavy sweets, dairy products, bakery items, sedentary desk routine', labelHi: 'गुरु-स्निग्ध — भारी मीठा भोजन, डेयरी, बेकरी उत्पाद, दिनभर बैठे रहने की दिनचर्या' },
      { key: 'ratri_jagarana', labelEn: 'Late night waking / screen time past midnight, day sleep (Diva-Swapna)', labelHi: 'रात्रि जागरण — देर रात तक जागना, स्क्रीन देखना, दिन में सोना (दिवास्वप्न)' },
    ],
  },
  {
    id: 'dhatu',
    dimension: 'dhatu',
    titleEn: '6. Tissues Affected (Dhatu & Srotas Dushti)',
    titleHi: '6. दूषित धातु एवं स्रोतस (प्रभावित संस्थान)',
    descriptionEn: 'Which body systems/tissues feel most affected by this condition?',
    descriptionHi: 'इस समस्या से शरीर का कौन सा संस्थान सबसे अधिक प्रभावित महसूस हो रहा है?',
    options: [
      { key: 'asthi_majja', labelEn: 'Asthi & Majja (Bones & Joint Marrow) — Joint pain, osteoporosis, nerve weakness', labelHi: 'अस्थि एवं मज्जा धातु — जोड़ों का दर्द, हड्डियों में कमजोरी, नसों का खिंचाव' },
      { key: 'rasa_rakta', labelEn: 'Rasa & Rakta (Plasma & Blood) — Fatigue, pale skin, blood pressure, skin eruptions', labelHi: 'रस एवं रक्त धातु — अत्यधिक थकान, रक्तचाप असंतुलन, त्वचा रोग' },
      { key: 'mamsa_meda', labelEn: 'Mamsa & Meda (Muscles & Fat Metabolism) — Muscle cramps, obesity, lipid changes', labelHi: 'मांस एवं मेद धातु — मांसपेशियों में ऐंठन, मोटापा, कोलेस्ट्रॉल विकार' },
      { key: 'pranavaha', labelEn: 'Pranavaha Srotas (Respiratory & Cardiovascular) — Breathlessness, chest tightness', labelHi: 'प्राणवह स्रोतस — सांस फूलना, सीने में जकड़न, घबराहट' },
    ],
  },
];
