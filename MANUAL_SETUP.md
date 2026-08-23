# MediKiosk — External Integrations & Manual Setup Guide

This guide explains how to connect live cloud services (Supabase Cloud, Anthropic Claude API, Google Cloud Vision OCR, ABDM Sandbox) to replace the built-in local mock providers.

> [!WARNING]
> **SECURITY WARNING:**  
> Never commit `.env`, `.env.local`, API keys, or private service credentials to GitHub or any public version control. Ensure all secrets are kept strictly within your private `.env.local` file.

---

## 1. Supabase Cloud Database & Auth

### Why Setup Is Needed
MediKiosk runs with a robust local state fallback for demonstration purposes. Connecting a real Supabase project provides live PostgreSQL persistence, Row Level Security (RLS), multi-tab Realtime subscriptions, and persistent document storage.

### Environment Variables
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Numbered Setup Steps
1. Create a free account at [supabase.com](https://supabase.com) and create a new project named `medikiosk`.
2. Go to **Project Settings → API** and copy the **Project URL**, **anon (public) key**, and **service_role (secret) key**.
3. Open the **SQL Editor** in the Supabase Dashboard.
4. Open the SQL migration file in this repository: [supabase/migrations/20260823000001_initial_schema.sql](file:///d:/Desktop/MediKiOsk/supabase/migrations/20260823000001_initial_schema.sql).
5. Paste and execute the SQL script to create all 24 tables, indexes, triggers, and RLS policies.
6. In **Storage**, create a new bucket named `medical-documents` with access restricted to authenticated users.
7. Add the keys to your `.env.local` file.

### How to Verify
- Run `npm run dev` and navigate to `/doctor`. Verify that patient records load directly from your remote Supabase PostgreSQL instance without any mock indicators.

---

## 2. Anthropic Claude AI (LLM Provider)

### Why Setup Is Needed
Used for live natural language dialogue parsing, unconstrained OCR post-processing, clinical summary synthesis, and AI decision-support suggestions. When unset, MediKiosk uses its deterministic clinical rule and structured heuristic engine.

### Environment Variables
```ini
ANTHROPIC_API_KEY=sk-ant-api03-...
AI_PROVIDER=anthropic # or "mock"
```

### Numbered Setup Steps
1. Sign up at [console.anthropic.com](https://console.anthropic.com).
2. Generate an API Key under **API Keys**.
3. Add `ANTHROPIC_API_KEY=your_key` to `.env.local` and set `AI_PROVIDER=anthropic`.

### How to Verify
- In the Patient Kiosk interview, type a complex natural language response (e.g. *"I've had severe squeezing chest pain radiating to my jaw for 2 hours with cold sweats"*). Verify that the extracted entity output is processed by Claude with high confidence.

---

## 3. Google Cloud Vision / AWS Textract (Document OCR)

### Why Setup Is Needed
Enables high-accuracy OCR extraction of handwritten Indian prescriptions, regional language doctor notes, and multi-column lab reports.

### Environment Variables
```ini
OCR_PROVIDER=google_vision # or "aws_textract" or "mock"
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Numbered Setup Steps
1. Enable Cloud Vision API in Google Cloud Console.
2. Download service account JSON key file.
3. Set environment variables in `.env.local`.

### How to Verify
- Upload a sample prescription image in `/kiosk/documents` and verify that the raw extracted text matches the image content.

---

## 4. ABDM Sandbox Integration (Future / Phase 2)

### Why Setup Is Needed
For verifying real ABHA IDs and generating FHIR Care Context links through the Ayushman Bharat Digital Mission (ABDM) Gateway.

### Environment Variables
```ini
ABDM_CLIENT_ID=your-sandbox-client-id
ABDM_CLIENT_SECRET=your-sandbox-secret
ABDM_GATEWAY_URL=https://dev.abdm.gov.in/gateway
```

### Numbered Setup Steps
1. Register for an ABDM sandbox account on the official NHA portal.
2. Complete developer onboarding and obtain sandbox Client ID and Secret.
3. Configure webhook URL pointing to your MediKiosk instance.
