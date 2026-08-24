export interface AyurvedicQuestionOption {
  key: string;
  labelEn: string;
  labelHi: string;
  doshaWeight?: 'vata' | 'pitta' | 'kapha' | 'sama';
}

export interface AyurvedicQuestion {
  id: string;
  dimension: 
    | 'prakriti' 
    | 'vikriti' 
    | 'agni' 
    | 'koshtha' 
    | 'mutra' 
    | 'jihva' 
    | 'satva_nidra' 
    | 'bala' 
    | 'ahara' 
    | 'vihara' 
    | 'dhatu' 
    | 'nidana';
  categoryTagEn: string;
  categoryTagHi: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  isMultiSelect?: boolean;
  options: AyurvedicQuestionOption[];
}

export interface AyurvedicAssessmentAnswers {
  prakritiPrimary?: string;
  prakritiNotes?: string;
  vikritiSymptoms?: string[];
  vikritiDosha?: string;
  vikritiNotes?: string;
  agniType?: string;
  agniNotes?: string;
  koshthaType?: string;
  koshthaNotes?: string;
  mutraPattern?: string[];
  mutraNotes?: string;
  jihvaStatus?: string;
  jihvaNotes?: string;
  sleepMind?: string[];
  sleepNotes?: string;
  balaEnergy?: string;
  balaNotes?: string;
  aharaHabits?: string[] | string;
  aharaNotes?: string;
  viharaHabits?: string[] | string;
  viharaNotes?: string;
  dhatuAffected?: string[];
  dhatuNotes?: string;
  nidanaTriggers?: string[];
  nidanaNotes?: string;
  customComments?: string;
  [key: string]: any;
}

export const AYURVEDIC_QUESTIONS: AyurvedicQuestion[] = [
  {
    id: 'prakriti',
    dimension: 'prakriti',
    categoryTagEn: 'Dashavidha · Prakriti',
    categoryTagHi: 'दशविध · प्रकृति परीक्षा',
    titleEn: '1. Natural Body Frame & Tendency (Prakriti)',
    titleHi: '1. आपका स्वाभाविक शरीर प्रकार (प्रकृति / Prakriti)',
    descriptionEn: 'Which body type best describes your natural frame and habits since childhood? (Choose one)',
    descriptionHi: 'बचपन से आपकी स्वाभाविक शारीरिक बनावट और आदतें किस प्रकार की रही हैं? (एक चुनें)',
    isMultiSelect: false,
    options: [
      { key: 'vata', labelEn: 'Vata — Lean frame, dry skin, quick moving, light sleeper', labelHi: 'वात (Vata) — दुबला-पतला शरीर, रूखी त्वचा, जल्दी थकना, हल्का स्वभाव', doshaWeight: 'vata' },
      { key: 'pitta', labelEn: 'Pitta — Medium build, warm body, sharp hunger, sensitive to heat', labelHi: 'पित्त (Pitta) — मध्यम सुडौल शरीर, ज्यादा गर्मी लगना, तेज भूख, जल्दी पसीना', doshaWeight: 'pitta' },
      { key: 'kapha', labelEn: 'Kapha — Sturdy frame, calm nature, smooth skin, gains weight easily', labelHi: 'कफ (Kapha) — भारी व मजबूत शरीर, शांत स्वभाव, चिकनी त्वचा, वजन जल्दी बढ़ना', doshaWeight: 'kapha' },
      { key: 'vata_pitta', labelEn: 'Vata-Pitta — Slender/medium build, sensitive digestion, active mind', labelHi: 'वात-पित्त मिश्रित — हल्का/मध्यम शरीर, मौसम बदलने पर जल्दी असर' },
      { key: 'pitta_kapha', labelEn: 'Pitta-Kapha — Strong physique, good stamina, warm body', labelHi: 'पित्त-कफ मिश्रित — बलवान शरीर, अच्छी सहनशक्ति, अधिक गर्मी' },
      { key: 'vata_kapha', labelEn: 'Vata-Kapha — Cold sensitivity, fluctuating weight & digestion', labelHi: 'वात-कफ मिश्रित — ठंड ज्यादा लगना, वजन व पाचन में उतार-चढ़ाव' },
    ],
  },
  {
    id: 'vikriti',
    dimension: 'vikriti',
    categoryTagEn: 'Trividha · Prashna & Vikriti',
    categoryTagHi: 'त्रिविध · प्रश्न व दोष विकृति',
    titleEn: '2. Current Imbalance & Symptoms (Vikriti)',
    titleHi: '2. आपकी वर्तमान मुख्य तकलीफें (विकृति / Vikriti)',
    descriptionEn: 'What symptoms are you currently experiencing? (Select all that apply)',
    descriptionHi: 'अभी आपको शरीर में क्या-क्या लक्षण या परेशानियां महसूस हो रही हैं? (एक से अधिक चुन सकते हैं)',
    isMultiSelect: true,
    options: [
      { key: 'vata_pain', labelEn: 'Joint/nerve pain, stiffness, dryness, cracking joints (Vata)', labelHi: 'जोड़ों व नसों में दर्द, जकड़न, शरीर में रूखापन या अकड़न (वात)', doshaWeight: 'vata' },
      { key: 'pitta_heat', labelEn: 'Burning sensation, acid reflux, skin redness, excess heat (Pitta)', labelHi: 'सीने में जलन, एसिडिटी, अत्यधिक गर्मी, त्वचा में लाली या जलन (पित्त)', doshaWeight: 'pitta' },
      { key: 'kapha_heavy', labelEn: 'Body heaviness, lethargy, excess phlegm, sluggishness (Kapha)', labelHi: 'शरीर में भारीपन, सुस्ती, लगातार बलगम/खांसी, आलस (कफ)', doshaWeight: 'kapha' },
      { key: 'sleep_anxiety', labelEn: 'Sleep issues, restlessness, anxiety, or high mental worry', labelHi: 'नींद न आना, बेचैनी, अत्यधिक घबराहट या तनाव' },
      { key: 'swelling_edema', labelEn: 'Swelling in hands/feet or fluid retention', labelHi: 'हाथ-पैरों में सूजन या भारीपन' },
    ],
  },
  {
    id: 'agni',
    dimension: 'agni',
    categoryTagEn: 'Dashavidha · Agni Pariksha',
    categoryTagHi: 'दशविध · जठराग्नि परीक्षा',
    titleEn: '3. Digestive Power & Appetite (Agni)',
    titleHi: '3. आपकी भूख और पाचन (अग्नि / Jatharagni)',
    descriptionEn: 'How is your appetite and digestion after meals? (Choose one)',
    descriptionHi: 'खाना खाने के बाद आपकी पाचन शक्ति और भूख कैसी रहती है? (एक चुनें)',
    isMultiSelect: false,
    options: [
      { key: 'sama_agni', labelEn: 'Sama Agni (Normal) — Regular healthy appetite, digests comfortably on time', labelHi: 'समाग्नि (सामान्य) — समय पर अच्छी भूख लगती है और खाना आसानी से पच जाता है' },
      { key: 'vishama_agni', labelEn: 'Vishama Agni (Irregular) — Variable appetite, bloating, gas', labelHi: 'विषमाग्नि (अनियमित) — कभी बहुत भूख कभी बिल्कुल नहीं, पेट फूलना व गैस' },
      { key: 'tikshna_agni', labelEn: 'Tikshna Agni (Intense) — Intense hunger, burning acidity if meals delayed', labelHi: 'तीक्ष्णाग्नि (तेज) — बहुत तेज भूख, समय पर न खाने पर जलन व सिरदर्द' },
      { key: 'manda_agni', labelEn: 'Manda Agni (Sluggish) — Slow digestion, heaviness for hours after light meals', labelHi: 'मंदाग्नि (धीमा) — कमजोर पाचन, हल्का खाना खाने पर भी घंटों पेट भारी रहना' },
    ],
  },
  {
    id: 'koshtha',
    dimension: 'koshtha',
    categoryTagEn: 'Ashtavidha · Mala & Koshtha',
    categoryTagHi: 'अष्टविध · मल व कोष्ठ परीक्षा',
    titleEn: '4. Bowel Habit & Stool Nature (Koshtha)',
    titleHi: '4. पेट साफ होने की आदत (कोष्ठ / Koshtha)',
    descriptionEn: 'What is your typical bowel movement pattern? (Choose one)',
    descriptionHi: 'सुबह आपका पेट कैसे साफ होता है? (एक चुनें)',
    isMultiSelect: false,
    options: [
      { key: 'mridu', labelEn: 'Mridu (Soft/Loose) — Soft stools, very quick evacuation, easily triggered', labelHi: 'मृदु कोष्ठ (जल्दी साफ) — हल्का या ढीला मल, दूध या फल लेने पर भी तुरंत पेट साफ' },
      { key: 'madhyama', labelEn: 'Madhyama (Regular) — Normal regular bowel movement 1-2 times daily', labelHi: 'मध्यम कोष्ठ (सामान्य) — दिन में 1-2 बार बिना किसी परेशानी के पेट साफ' },
      { key: 'krura', labelEn: 'Krura (Constipated) — Hard/dry stools, chronic constipation, requires aid', labelHi: 'क्रूर कोष्ठ (कब्ज) — कठोर मल, कब्जियत, बिना गर्म पानी या दवा के पेट साफ न होना' },
    ],
  },
  {
    id: 'mutra',
    dimension: 'mutra',
    categoryTagEn: 'Ashtavidha · Mutra Pariksha',
    categoryTagHi: 'अष्टविध · मूत्र परीक्षा',
    titleEn: '5. Urinary Pattern & Sensation (Mutra)',
    titleHi: '5. पेशाब की स्थिति (मूत्र परीक्षा / Mutra)',
    descriptionEn: 'Any discomfort or changes in urination? (Select all that apply)',
    descriptionHi: 'पेशाब से जुड़ी कोई परेशानी महसूस होती है? (एक से अधिक चुन सकते हैं)',
    isMultiSelect: true,
    options: [
      { key: 'normal_urine', labelEn: 'Normal — No burning, pain, or difficulty', labelHi: 'सामान्य — कोई जलन, दर्द या रुकावट नहीं' },
      { key: 'burning_urine', labelEn: 'Burning sensation, dark yellow color, or heat (Pitta)', labelHi: 'पेशाब में जलन, पीलापन या गर्मी महसूस होना (पित्त)' },
      { key: 'frequent_night', labelEn: 'Frequent urination, especially waking up at night', labelHi: 'रात में बार-बार पेशाब जाना पड़ना' },
      { key: 'scanty_urine', labelEn: 'Scanty or hesitant urine flow', labelHi: 'पेशाब कम आना या रुक-रुक कर आना' },
    ],
  },
  {
    id: 'jihva',
    dimension: 'jihva',
    categoryTagEn: 'Ashtavidha · Jihva & Sparshana',
    categoryTagHi: 'अष्टविध · जिह्वा दर्शन परीक्षा',
    titleEn: '6. Tongue Appearance & Oral Taste (Jihva)',
    titleHi: '6. जीभ की स्थिति और स्वाद (जिह्वा / Jihva)',
    descriptionEn: 'How does your tongue look and mouth taste in the morning? (Choose one)',
    descriptionHi: 'सुबह उठने पर आपकी जीभ कैसी दिखती है और मुंह का स्वाद कैसा रहता है? (एक चुनें)',
    isMultiSelect: false,
    options: [
      { key: 'clean_pink', labelEn: 'Clean & pink — No coating, normal fresh taste', labelHi: 'साफ और गुलाबी — कोई मैल नहीं, मुंह का स्वाद सामान्य' },
      { key: 'coated_white', labelEn: 'Thick white coating (Ama/toxins) — Heavy, tasteless feeling', labelHi: 'सफेद परत / मैल जमी हुई (आम दोष) — मुंह में भारीपन व बेस्वाद' },
      { key: 'coated_yellow_bitter', labelEn: 'Yellowish coating — Bitter or sour taste in mouth', labelHi: 'पीली परत — मुंह में कड़वा या खट्टा स्वाद' },
      { key: 'dry_rough', labelEn: 'Dry, rough, or fissured tongue', labelHi: 'सूखी, खुरदरी या कटी-फटी सी जीभ' },
    ],
  },
  {
    id: 'satva_nidra',
    dimension: 'satva_nidra',
    categoryTagEn: 'Dashavidha · Satva & Nidra',
    categoryTagHi: 'दशविध · सत्व एवं निद्रा परीक्षा',
    titleEn: '7. Sleep Quality & Mental Well-being (Nidra & Manas)',
    titleHi: '7. नींद और मानसिक तनाव (निद्रा व मानस / Nidra & Manas)',
    descriptionEn: 'How is your sleep and stress level? (Select all that apply)',
    descriptionHi: 'आपकी नींद और मानसिक शांति की क्या स्थिति है? (एक से अधिक चुन सकते हैं)',
    isMultiSelect: true,
    options: [
      { key: 'sound_sleep', labelEn: 'Sound, restful, unbroken sleep (7-8 hours)', labelHi: 'गहरी और सुकून भरी नींद (7-8 घंटे)' },
      { key: 'disturbed_sleep', labelEn: 'Disturbed sleep, trouble falling asleep, or waking up early', labelHi: 'बार-बार नींद टूटना या देर रात तक नींद न आना' },
      { key: 'excessive_sleep', labelEn: 'Excessive sleepiness, waking up unrefreshed/groggy', labelHi: 'सुबह उठने पर भी भारीपन और दिनभर सुस्ती' },
      { key: 'high_stress', labelEn: 'High mental stress, overthinking, or irritability', labelHi: 'काम या चिंता के कारण अत्यधिक मानसिक तनाव व चिड़चिड़ापन' },
    ],
  },
  {
    id: 'bala',
    dimension: 'bala',
    categoryTagEn: 'Dashavidha · Bala & Vyayama',
    categoryTagHi: 'दशविध · बल एवं व्यायाम शक्ति',
    titleEn: '8. Physical Strength & Energy Level (Bala)',
    titleHi: '8. शारीरिक ताकत और थकान (बल / Bala & Energy)',
    descriptionEn: 'How is your daily stamina and physical energy? (Choose one)',
    descriptionHi: 'दिनभर आपकी ऊर्जा और कार्य करने की क्षमता कैसी रहती है? (एक चुनें)',
    isMultiSelect: false,
    options: [
      { key: 'pravara_bala', labelEn: 'High Stamina — Energetic all day, rarely feels fatigued', labelHi: 'उत्तम बल — दिनभर ताजगी व फुर्ती रहती है, जल्दी थकान नहीं होती' },
      { key: 'madhyama_bala', labelEn: 'Moderate Stamina — Manages daily chores well, mild evening fatigue', labelHi: 'मध्यम बल — सामान्य काम आसानी से कर लेते हैं, शाम को हल्की थकान' },
      { key: 'avara_bala', labelEn: 'Low Stamina / Fatigue — Gets tired quickly with minimal physical effort', labelHi: 'कम बल / जल्दी थकान — थोड़ा सा चलने या काम करने पर ही कमजोरी व सांस फूलना' },
    ],
  },
  {
    id: 'ahara',
    dimension: 'ahara',
    categoryTagEn: 'Dashavidha · Ahara & Satmya',
    categoryTagHi: 'दशविध · आहार शक्ति एवं सात्म्य',
    titleEn: '9. Dietary Habits & Food Intake (Ahara)',
    titleHi: '9. खान-पान की आदतें (आहार / Ahara Habits)',
    descriptionEn: 'What types of food do you regularly consume? (Select all that apply)',
    descriptionHi: 'आप आमतौर पर क्या और कैसा भोजन खाते हैं? (एक से अधिक चुन सकते हैं)',
    isMultiSelect: true,
    options: [
      { key: 'spicy_fried', labelEn: 'Spicy, deep-fried, oily, or fermented foods', labelHi: 'अधिक मिर्च-मसाला, तला-भुना या खट्टा भोजन' },
      { key: 'tea_coffee_junk', labelEn: 'Frequent tea/coffee, packaged snacks, or fast food', labelHi: 'दिन में कई बार चाय, कॉफी, पैकेटबंद या बाहर का जंक फूड' },
      { key: 'cold_dry_food', labelEn: 'Cold water/drinks, raw salads, dry packaged items', labelHi: 'ठंडा पानी/कोल्ड ड्रिंक्स, कच्चा सलाद या सूखा भोजन' },
      { key: 'sweets_dairy', labelEn: 'Heavy sweets, excess dairy, cheese, or bakery items', labelHi: 'ज्यादा मीठा, भारी डेयरी (दूध/पनीर) या बेकरी उत्पाद' },
      { key: 'irregular_timing', labelEn: 'Irregular meal timings or skipping meals frequently', labelHi: 'भोजन का कोई निश्चित समय न होना (कभी जल्दी, कभी बहुत देर से)' },
    ],
  },
  {
    id: 'vihara',
    dimension: 'vihara',
    categoryTagEn: 'Dashavidha · Vihara & Dinacharya',
    categoryTagHi: 'दशविध · विहार एवं दिनचर्या',
    titleEn: '10. Daily Routine & Lifestyle Factors (Vihara)',
    titleHi: '10. दिनचर्या और आदतें (विहार / Vihara & Lifestyle)',
    descriptionEn: 'Which lifestyle factors apply to your routine? (Select all that apply)',
    descriptionHi: 'आपकी जीवनशैली और रोज़मर्रा की आदतें कैसी हैं? (एक से अधिक चुन सकते हैं)',
    isMultiSelect: true,
    options: [
      { key: 'desk_sedentary', labelEn: 'Sedentary desk job with minimal physical activity', labelHi: 'दिनभर एक ही जगह बैठकर काम करना (शारीरिक मेहनत की कमी)' },
      { key: 'late_night_screen', labelEn: 'Staying awake late past midnight with screen exposure', labelHi: 'देर रात 12 बजे के बाद तक जागना और मोबाइल/स्क्रीन देखना' },
      { key: 'daytime_sleep', labelEn: 'Sleeping in the afternoon after lunch regularly', labelHi: 'दोपहर में खाना खाकर रोजाना सोना (दिवास्वप्न)' },
      { key: 'travel_dust_sun', labelEn: 'Frequent exposure to dust, sun, travel, or shifting weather', labelHi: 'धूप, धूल, प्रदूषण या बहुत ज्यादा यात्रा करना' },
      { key: 'tobacco_smoking', labelEn: 'Tobacco, smoking, or alcohol consumption', labelHi: 'तंबाकू, गुटखा, सिगरेट या शराब का सेवन' },
    ],
  },
  {
    id: 'dhatu',
    dimension: 'dhatu',
    categoryTagEn: 'Dashavidha · Dhatu & Srotas Dushti',
    categoryTagHi: 'दशविध · दूषित धातु एवं स्रोतस',
    titleEn: '11. Body Systems & Tissues Affected (Dhatu & Srotas)',
    titleHi: '11. शरीर के प्रभावित अंग व संस्थान (दूषित धातु व स्रोतस)',
    descriptionEn: 'Which body areas feel most affected by this condition? (Select all that apply)',
    descriptionHi: 'इस तकलीफ से शरीर का कौन सा हिस्सा सबसे ज्यादा परेशान कर रहा है? (एक से अधिक चुन सकते हैं)',
    isMultiSelect: true,
    options: [
      { key: 'asthi_sandhi', labelEn: 'Bones & Joints (Asthi/Majja) — Joint pain, stiffness, nerve aches', labelHi: 'हड्डियां और जोड़ (Asthi/Majja) — जोड़ों में दर्द, जकड़न, नसों में खिंचाव' },
      { key: 'twak_rakta', labelEn: 'Skin & Blood (Rasa/Rakta) — Rashes, itching, pale skin, blood issues', labelHi: 'त्वचा और खून (Rasa/Rakta) — खुजली, दाने, एलर्जी, रूखापन या पीलापन' },
      { key: 'mamsa_meda', labelEn: 'Muscles & Fat (Mamsa/Meda) — Muscle cramps, weakness, weight gain', labelHi: 'मांसपेशियां और वजन (Mamsa/Meda) — पिंडलियों में दर्द, ऐंठन या मोटापा' },
      { key: 'pranavaha_shwasa', labelEn: 'Respiratory (Pranavaha) — Breathlessness, chronic cough, chest tightness', labelHi: 'सांस और फेफड़े (Pranavaha) — सांस फूलना, पुरानी खांसी, सीने में भारीपन' },
      { key: 'annavaha_udara', labelEn: 'Digestive Tract (Annavaha) — Gas, stomach pain, sour belching, fullness', labelHi: 'पेट और पाचन तंत्र (Annavaha) — गैस, पेट दर्द, खट्टी डकार, अफारा' },
    ],
  },
  {
    id: 'nidana',
    dimension: 'nidana',
    categoryTagEn: 'Dashavidha · Nidana & Samprapti',
    categoryTagHi: 'दशविध · निदान एवं संप्राप्ति (ट्रिगर)',
    titleEn: '12. Triggers & Aggravating Factors (Nidana)',
    titleHi: '12. तकलीफ कब और किस कारण बढ़ती है? (निदान व ट्रिगर / Triggers)',
    descriptionEn: 'Under what conditions do your symptoms worsen? (Select all that apply)',
    descriptionHi: 'आपकी तकलीफ किन परिस्थितियों में ज्यादा बढ़ जाती है? (एक से अधिक चुन सकते हैं)',
    isMultiSelect: true,
    options: [
      { key: 'cold_weather', labelEn: 'Cold weather, cold air, or consuming cold food/water', labelHi: 'ठंड के मौसम, ठंडी हवा या ठंडा पानी लेने से' },
      { key: 'hot_weather', labelEn: 'Hot weather, sunlight, or eating very spicy food', labelHi: 'गर्मी, धूप या बहुत तेज मसालेदार खाना खाने से' },
      { key: 'after_meals', labelEn: 'Immediately after having meals', labelHi: 'खाना खाने के तुरंत बाद' },
      { key: 'stress_worry', labelEn: 'During mental stress, worry, or anxiety', labelHi: 'मानसिक चिंता, तनाव या गुस्से के समय' },
      { key: 'physical_strain', labelEn: 'After walking, lifting weights, or physical exertion', labelHi: 'ज्यादा चलने, वजन उठाने या मेहनत करने पर' },
    ],
  },
];
