export type QuestionCategory =
  | 'chief_complaint'
  | 'hpi_onset'
  | 'hpi_duration'
  | 'hpi_character'
  | 'hpi_severity'
  | 'hpi_radiation'
  | 'hpi_triggers'
  | 'hpi_relieving'
  | 'associated_symptoms'
  | 'past_medical_history'
  | 'past_surgical_history'
  | 'medications'
  | 'allergies'
  | 'family_history'
  | 'personal_history'
  | 'review_of_systems'
  | 'ayush_specific';

export interface TouchOption {
  labelEn: string;
  labelHi: string;
  value: string;
  isRedFlag?: boolean;
  iconName?: string;
  subOptions?: TouchOption[];
}

export interface ClinicalQuestion {
  id: string;
  key: string;
  category: QuestionCategory;
  textEn: string;
  textHi: string;
  audioPromptEn?: string;
  audioPromptHi?: string;
  inputType: 'single_choice' | 'multi_choice' | 'severity_slider' | 'duration_picker' | 'body_map' | 'text_voice';
  options?: TouchOption[];
  dependsOn?: {
    questionKey: string;
    operator: 'equals' | 'contains' | 'not_empty' | 'gte';
    value: any;
  };
  redFlagConditions?: {
    valueMatches?: string[];
    severityGte?: number;
    alertText: string;
    priority: 'RED' | 'AMBER' | 'YELLOW';
  };
  snomedCode?: string;
  loincCode?: string;
}

export interface SymptomOntologyBranch {
  symptomKey: string;
  labelEn: string;
  labelHi: string;
  bodyRegion: 'head_neck' | 'chest' | 'abdomen' | 'limbs' | 'general' | 'skin';
  subQuestions: ClinicalQuestion[];
}
