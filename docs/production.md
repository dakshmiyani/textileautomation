# Textile ERP — Production Module & Excel Export

## 1. Yarn Production Telemetry

The Production Module (`server/src/modules/production/`) manages the entire lifecycle of manufactured textile beams and meters.

### Core Metrics Captured
- **Yarn Specification**: Count, ply, and material (e.g. `40s Combed Hosiery`, `30/1 PC Blend`).
- **Ends**: The number of warp threads wound onto the beam.
- **Meter**: The physical length of warp or woven cloth produced.
- **Panna (Beam Width)**: The width of the loom beam in inches.
- **Total Beam**: The total number of beams produced in the batch.

---

## 2. Ingestion Channels

1. **Automated WhatsApp Channel**: Real-time message reception, validation, and instantaneous PostgreSQL ingestion.
2. **ERP Web Portal (Manual Entry)**: Accessible via the "New Entry" modal on the dashboard for supervisors.
3. **External REST API**: Allows automated ingestion from modern computerized loom microcontrollers.

---

## 3. Excel Export Architecture (ExcelJS)

Excel is **strictly treated as an export artifact** and never as the primary database.

```text
PostgreSQL (Source of Truth)
     ↓
ProductionRepository.findAllForExport()
     ↓
integrations/excel/excelExport.js
     ↓
ExcelJS Workbook Generation:
  - Deep Navy Corporate Headers (#1F4E79)
  - Dynamic Column Auto-width
  - Clean Numeric Formatting
  - Automated Formula Totals:
      * Total Ends: =SUM(...)
      * Total Meters: =SUM(...)
      * Average Panna: =AVERAGE(...)
      * Total Beams: =SUM(...)
     ↓
Streamed Binary (.xlsx) to Browser
```

### Export Features
- **Filter-Aware**: Exports respect active dashboard filters (date ranges, yarn counts, and source types).
- **Audit Logged**: Every export operation records the requesting user, IP address, and exported batch count.
- **Asynchronous Worker Ready**: Long-running quarterly exports can be dispatched to background job queues (`server/src/jobs/queue.js`).
