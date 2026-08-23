export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    use: 'official';
    text: string;
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
}

export interface FHIREncounter extends FHIRResource {
  resourceType: 'Encounter';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'finished';
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode';
    code: 'AMB' | 'EMER';
    display: string;
  };
  subject: {
    reference: string;
    display: string;
  };
  period: {
    start: string;
    end?: string;
  };
}

export interface FHIRCondition extends FHIRResource {
  resourceType: 'Condition';
  clinicalStatus: {
    coding: Array<{
      system: 'http://terminology.hl7.org/CodeSystem/condition-clinical';
      code: 'active' | 'recurrence' | 'resolved';
    }>;
  };
  code: {
    coding: Array<{
      system: 'http://snomed.info/sct';
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  recordedDate: string;
}

export interface FHIRMedicationStatement extends FHIRResource {
  resourceType: 'MedicationStatement';
  status: 'active' | 'completed' | 'stopped';
  medicationCodeableConcept: {
    text: string;
  };
  subject: {
    reference: string;
  };
  dosage?: Array<{
    text: string;
  }>;
}

export interface FHIRAllergyIntolerance extends FHIRResource {
  resourceType: 'AllergyIntolerance';
  clinicalStatus: {
    coding: Array<{
      system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical';
      code: 'active' | 'inactive' | 'resolved';
    }>;
  };
  category?: Array<'food' | 'medication' | 'environment' | 'biologic'>;
  code: {
    text: string;
  };
  patient: {
    reference: string;
  };
}
