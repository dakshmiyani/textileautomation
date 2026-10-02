# Textile ERP — WhatsApp Integration Engine

The WhatsApp integration runs as a modular background daemon using **Baileys (`@whiskeysockets/baileys`)** inside `server/src/modules/whatsapp/`.

---

## 1. End-to-End Ingestion Flow

```text
User sends WhatsApp message from mobile
                 ↓
Baileys Socket receives 'messages.upsert'
                 ↓
whatsapp.messageHandler.js extracts text
                 ↓
whatsapp/parser.js extracts key-values
                 ↓
Format Match check:
  - Is it YARN_PRODUCTION?
  - NO  ──► Silently ignore (no reply sent, preserves personal chat privacy)
  - YES ──► Continue
                 ↓
whatsapp/duplicateDetector.js
  - Is duplicate msg ID or content fingerprint within 3 minutes?
  - YES ──► Log warning & skip processing
  - NO  ──► Continue
                 ↓
whatsapp/validator.js validates numeric fields:
  - Yarn: string
  - Ends: positive integer
  - Meter: positive number
  - Panna: positive number
  - Total Beam: positive integer
                 ↓
Production Service creates record
                 ↓
Production Repository stores in PostgreSQL
                 ↓
Record emitted via EventBus ──► React Dashboard updates
                 ↓
Baileys sends confirmation reply:
"ok"
```

---

## 2. Inbound Format Specification

The parser accepts flexible casing, spacing, and aliases:

```text
Yarn: 40s
Ends: 1200
Meter: 5000
Panna(beam width): 63
Total beam: 10
```

### Supported Key Aliases
- `yarn`: `yarn`
- `ends`: `ends`, `end`
- `meter`: `meter`, `meters`
- `panna`: `panna`, `panna(beam width)`, `panna (beam width)`, `beam width`, `beamwidth`
- `totalBeam`: `total beam`, `total beams`, `totalbeam`

---

## 3. Privacy LID & Real Number Resolution

WhatsApp Multi-Device often sends messages from anonymous linked identity IDs (`@lid`, e.g. `213477306163295@lid`) rather than the actual phone number. The ERP resolves the real phone number via:

1. `msg.key.remoteJidAlt`: Checked first if Baileys provides the real phone JID.
2. `sock.signalRepository.lidMapping.getPNForLID(senderJid)`: Queries Baileys internal LID mapping database.
3. Clean international format normalization: Strips device suffixes (`:1@s.whatsapp.net`) and prepends `+` (e.g., `+917021483568`).

---

## 4. Contact Name Tracking

Worker names are discovered through:
1. `sock.ev.on('contacts.upsert')`: Synchronizes the device's phone contacts into an in-memory and persistent `ContactStore`.
2. Fallback to `msg.pushName`: If the contact is not in the phone's address book, uses their WhatsApp profile display name.

---

## 5. Security & Session Storage

- Authentication credentials are saved in `server/storage/whatsapp-auth/` using `useMultiFileAuthState`.
- Credentials and `.env` files are **strictly excluded** from Express static file serving.
- Only QR code data URLs are securely exposed to authenticated ERP administrators for initial pairing.
