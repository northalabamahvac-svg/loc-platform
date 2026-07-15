// ============================================================
// HVAC System Replacement Survey definition
// Single source of truth for every piece of information an
// estimator must gather before the office can build the quote.
// Used by the field form (client), the submit API (server-side
// validation), the office email, and the Housecall Pro exports.
// ============================================================

export type SurveyData = Record<string, string | string[]>;

export type FieldType =
  | "text" | "number" | "tel" | "email" | "date"
  | "select" | "multi" | "yesno" | "textarea";

export interface SurveyField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
  unit?: string;
  /** Only show (and require) this field when another answer matches */
  showIf?: { key: string; in: string[] };
}

export interface SurveySection {
  key: string;
  title: string;
  icon: string;
  description?: string;
  showIf?: { key: string; in: string[] };
  fields: SurveyField[];
}

const SYSTEM_CONFIGS = [
  "Gas Furnace + AC (Split)",
  "Heat Pump (Split)",
  "AC + Electric Air Handler (Split)",
  "Package Unit — Gas/Electric",
  "Package Heat Pump",
  "Package AC — Electric",
  "Ductless Mini-Split",
  "Other",
];

/** Configs that involve gas heat — trigger the Gas & Venting section */
export const GAS_CONFIGS = ["Gas Furnace + AC (Split)", "Package Unit — Gas/Electric"];
/** Configs with electric heat strips */
const STRIP_HEAT_CONFIGS = ["Heat Pump (Split)", "AC + Electric Air Handler (Split)", "Package Heat Pump"];

const TONNAGES = ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "3.5 Ton", "4 Ton", "5 Ton", "Other/Unknown"];

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    key: "customer",
    title: "Customer & Job",
    icon: "👤",
    description: "Who the estimate is for and what kind of job this is.",
    fields: [
      { key: "customer_first_name", label: "First Name", type: "text", required: true },
      { key: "customer_last_name",  label: "Last Name",  type: "text", required: true },
      { key: "customer_phone",  label: "Mobile Phone", type: "tel", required: true, placeholder: "(256) 555-0123" },
      { key: "customer_email",  label: "Email", type: "email", placeholder: "customer@email.com" },
      { key: "street_address",  label: "Street Address", type: "text", required: true },
      { key: "city",            label: "City", type: "text", required: true },
      { key: "state",           label: "State", type: "text", required: true, placeholder: "AL" },
      { key: "zip",             label: "ZIP", type: "text", required: true },
      { key: "job_type", label: "Job Type", type: "select", required: true, options: [
        "Full System Replacement", "Condenser + Coil Only", "Furnace Only",
        "Air Handler Only", "New Install / Addition", "Other",
      ]},
      { key: "timeframe", label: "Install Timeframe", type: "select", required: true, options: [
        "ASAP — no heat/cool", "Within 1–2 weeks", "Within a month", "Flexible / shopping around",
      ]},
      { key: "lead_source", label: "Lead Source", type: "select", options: [
        "Repair Call Upgrade", "Website / Booking Form", "Google", "Referral", "Repeat Customer", "Other",
      ]},
      { key: "membership_customer", label: "Maintenance plan member?", type: "yesno" },
    ],
  },
  {
    key: "existing",
    title: "Existing System",
    icon: "🏚️",
    description: "Document exactly what is being replaced. Get model & serial off the data plates.",
    fields: [
      { key: "existing_config", label: "Current System Type", type: "select", required: true, options: SYSTEM_CONFIGS },
      { key: "existing_brand",  label: "Brand", type: "text", required: true, placeholder: "Trane, Carrier, Goodman…" },
      { key: "existing_outdoor_model",  label: "Outdoor Unit — Model #", type: "text" },
      { key: "existing_outdoor_serial", label: "Outdoor Unit — Serial #", type: "text" },
      { key: "existing_indoor_model",   label: "Indoor Unit — Model #", type: "text" },
      { key: "existing_indoor_serial",  label: "Indoor Unit — Serial #", type: "text" },
      { key: "existing_tonnage", label: "Tonnage", type: "select", required: true, options: TONNAGES },
      { key: "existing_age", label: "System Age", type: "select", required: true, options: [
        "0–5 years", "6–10 years", "11–15 years", "16–20 years", "20+ years", "Unknown",
      ]},
      { key: "refrigerant", label: "Refrigerant Type", type: "select", required: true, options: [
        "R-22", "R-410A", "R-454B / R-32", "Unknown",
      ]},
      { key: "indoor_location", label: "Indoor Unit Location", type: "select", required: true, options: [
        "Attic", "Crawlspace", "Closet", "Garage", "Basement", "Rooftop", "Other",
      ]},
      { key: "outdoor_location", label: "Outdoor Unit Location", type: "select", options: [
        "Ground — side yard", "Ground — back yard", "Rooftop", "Other",
      ]},
      { key: "filter_size", label: "Filter Size(s)", type: "text", required: true, placeholder: "e.g. 20x25x1" },
      { key: "system_running", label: "Is the system currently running?", type: "yesno", required: true },
      { key: "existing_issues", label: "Current Problems / Diagnosis", type: "textarea", placeholder: "Compressor grounded, cracked heat exchanger, etc." },
    ],
  },
  {
    key: "home",
    title: "Home & Sizing",
    icon: "📐",
    description: "Load information so the office can verify the recommended size.",
    fields: [
      { key: "square_footage", label: "Conditioned Square Footage", type: "number", required: true, unit: "sq ft" },
      { key: "stories", label: "Stories", type: "select", required: true, options: ["1", "1.5", "2", "3+"] },
      { key: "insulation", label: "Insulation Condition", type: "select", options: ["Good", "Average", "Poor", "Unknown"] },
      { key: "windows", label: "Windows", type: "select", options: ["Single pane", "Double pane", "Mixed", "Unknown"] },
      { key: "manual_j", label: "Manual J load calc needed?", type: "yesno" },
      { key: "comfort_issues", label: "Hot/Cold Spots or Comfort Complaints", type: "textarea" },
    ],
  },
  {
    key: "newsystem",
    title: "New Equipment",
    icon: "❄️",
    description: "What we're proposing to install.",
    fields: [
      { key: "new_config", label: "Proposed System Type", type: "select", required: true, options: SYSTEM_CONFIGS },
      { key: "new_tonnage", label: "Proposed Tonnage", type: "select", required: true, options: TONNAGES },
      { key: "efficiency", label: "Efficiency Tier", type: "select", required: true, options: [
        "Base — 14.3 SEER2", "Mid — 15.2 SEER2", "High — 16+ SEER2", "Premium — 17+ SEER2 Variable",
      ]},
      { key: "stages", label: "Compressor Stages", type: "select", required: true, options: [
        "Single-Stage", "Two-Stage", "Variable Speed",
      ]},
      { key: "afue", label: "Furnace Efficiency (AFUE)", type: "select", showIf: { key: "new_config", in: GAS_CONFIGS }, options: [
        "80%", "96%+ (condensing)",
      ]},
      { key: "heat_strips", label: "Electric Heat Strips", type: "select", showIf: { key: "new_config", in: STRIP_HEAT_CONFIGS }, options: [
        "None", "5 kW", "8 kW", "10 kW", "15 kW", "20 kW",
      ]},
      { key: "quoted_brand", label: "Brand Quoted", type: "text" },
      { key: "new_outdoor_model", label: "Outdoor Unit — Model #", type: "text" },
      { key: "new_indoor_model",  label: "Indoor Coil / Air Handler — Model #", type: "text" },
      { key: "new_furnace_model", label: "Furnace — Model #", type: "text", showIf: { key: "new_config", in: GAS_CONFIGS } },
      { key: "thermostat", label: "Thermostat", type: "select", required: true, options: [
        "Reuse existing", "Standard programmable (included)", "Smart t-stat (Ecobee/Nest)", "OEM communicating control",
      ]},
    ],
  },
  {
    key: "electrical",
    title: "Electrical",
    icon: "⚡",
    description: "Verify power, breaker, and wiring for the new equipment.",
    fields: [
      { key: "breaker_size", label: "Existing Outdoor Breaker Size", type: "select", required: true, options: [
        "20A", "25A", "30A", "35A", "40A", "50A", "60A", "Other/Unknown",
      ]},
      { key: "wire_condition", label: "High-Voltage Wire Condition", type: "select", required: true, options: [
        "Good — reuse", "Undersized / needs replacement", "Unknown",
      ]},
      { key: "disconnect", label: "Outdoor Disconnect", type: "select", required: true, options: [
        "Good — reuse", "Replace",
      ]},
      { key: "whip_needed", label: "New whip needed?", type: "yesno", required: true },
      { key: "panel_capacity", label: "Panel has capacity for any new/larger breakers?", type: "yesno", required: true },
      { key: "surge_protection", label: "Surge Protector", type: "select", options: [
        "Add — quoted", "Already has one", "Offered — declined",
      ]},
      { key: "electrical_notes", label: "Electrical Notes", type: "textarea" },
    ],
  },
  {
    key: "gas",
    title: "Gas & Venting",
    icon: "🔥",
    description: "Required for gas heat systems only.",
    showIf: { key: "new_config", in: GAS_CONFIGS },
    fields: [
      { key: "gas_line_ok", label: "Gas line size adequate?", type: "yesno", required: true },
      { key: "gas_shutoff_ok", label: "Shutoff valve & drip leg present?", type: "yesno", required: true },
      { key: "flue_type", label: "Flue / Vent Type", type: "select", required: true, options: [
        "B-Vent", "PVC (condensing)", "Masonry w/ liner", "Other",
      ]},
      { key: "flue_condition", label: "Flue Condition", type: "select", required: true, options: [
        "Good — reuse", "Replace", "Reline / new liner needed",
      ]},
      { key: "combustion_air_ok", label: "Adequate combustion air?", type: "yesno" },
      { key: "gas_notes", label: "Gas / Venting Notes", type: "textarea" },
    ],
  },
  {
    key: "ductwork",
    title: "Ductwork & Airflow",
    icon: "🌀",
    description: "Plenums, returns, and duct condition.",
    fields: [
      { key: "plenums", label: "Supply & Return Plenums", type: "select", required: true, options: [
        "Reuse both", "New supply plenum", "New return plenum", "New both",
      ]},
      { key: "return_adequate", label: "Return air adequate for new tonnage?", type: "yesno", required: true },
      { key: "duct_condition", label: "Duct Condition", type: "select", required: true, options: [
        "Good", "Minor repairs needed", "Major repairs needed", "Full replacement recommended",
      ]},
      { key: "duct_material", label: "Duct Material", type: "multi", options: ["Flex", "Metal", "Ductboard"] },
      { key: "supply_count", label: "Supply Vents", type: "number", unit: "count" },
      { key: "return_count", label: "Return Vents", type: "number", unit: "count" },
      { key: "filter_rack", label: "Filter Rack / Cabinet", type: "select", options: [
        "Existing OK", "Add new filter rack", "Add media filter cabinet",
      ]},
      { key: "duct_notes", label: "Duct Notes / Modifications Needed", type: "textarea" },
    ],
  },
  {
    key: "lines",
    title: "Line Set & Drain",
    icon: "🧊",
    description: "Refrigerant lines, condensate drain, and safety switches.",
    fields: [
      { key: "lineset_action", label: "Line Set Plan", type: "select", required: true, options: [
        "Reuse — flush & pressure test", "Replace full line set", "Replace accessible portion only",
      ]},
      { key: "lineset_size", label: "Line Set Size", type: "text", placeholder: "e.g. 3/8 x 7/8" },
      { key: "lineset_length", label: "Line Set Length", type: "number", unit: "ft" },
      { key: "lineset_accessible", label: "Line set accessible?", type: "yesno" },
      { key: "drain_route", label: "Condensate Drain", type: "select", required: true, options: [
        "Gravity to exterior", "Condensate pump", "Ties into plumbing", "Other",
      ]},
      { key: "float_switch", label: "Float Switch / Safety", type: "select", required: true, options: [
        "Existing OK", "Add primary float switch", "Add secondary pan + switch", "Add both",
      ]},
      { key: "secondary_pan", label: "Secondary drain pan needed?", type: "yesno",
        showIf: { key: "indoor_location", in: ["Attic"] } },
      { key: "drain_notes", label: "Line Set / Drain Notes", type: "textarea" },
    ],
  },
  {
    key: "logistics",
    title: "Install Logistics",
    icon: "🚚",
    description: "Access, permits, crew, and anything that affects labor.",
    fields: [
      { key: "pad", label: "Outdoor Pad / Stand", type: "select", required: true, options: [
        "Reuse existing", "New pad", "New stand / brackets",
      ]},
      { key: "attic_access", label: "Attic Access", type: "select", required: true,
        showIf: { key: "indoor_location", in: ["Attic"] }, options: [
        "Pull-down stairs", "Scuttle hole", "Walk-up", "Very tight / decking needed",
      ]},
      { key: "clear_path", label: "Clear path to move equipment in/out?", type: "yesno", required: true },
      { key: "crane_needed", label: "Crane / lift needed?", type: "yesno", required: true },
      { key: "permit_required", label: "Permit required?", type: "yesno", required: true },
      { key: "jurisdiction", label: "City / Jurisdiction", type: "text", placeholder: "Huntsville, Madison County…" },
      { key: "haul_away", label: "Haul away old equipment?", type: "yesno", required: true },
      { key: "crew_size", label: "Crew Size", type: "select", options: ["1", "2", "3", "4+"] },
      { key: "est_labor_hours", label: "Estimated Labor", type: "number", required: true, unit: "hours" },
      { key: "install_notes", label: "Logistics Notes", type: "textarea" },
    ],
  },
  {
    key: "accessories",
    title: "Accessories & Add-Ons",
    icon: "✨",
    description: "Everything offered or requested beyond the base system.",
    fields: [
      { key: "addons", label: "Add-Ons Quoted", type: "multi", options: [
        "Media filter cabinet", "UV light / air purifier", "Whole-home dehumidifier",
        "Humidifier", "Surge protection", "Smart thermostat", "Duct cleaning",
        "Zoning system", "Compressor start assist", "Extended labor warranty", "Maintenance plan",
      ]},
      { key: "addon_notes", label: "Add-On Notes", type: "textarea" },
    ],
  },
  {
    key: "pricing",
    title: "Pricing & Wrap-Up",
    icon: "💵",
    description: "Ballpark numbers and final notes for the office.",
    fields: [
      { key: "price_good",   label: "Quoted Price — Good", type: "number", unit: "$" },
      { key: "price_better", label: "Quoted Price — Better", type: "number", unit: "$" },
      { key: "price_best",   label: "Quoted Price — Best", type: "number", unit: "$" },
      { key: "financing", label: "Financing discussed?", type: "yesno" },
      { key: "promo", label: "Promo / Discount Applied", type: "text" },
      { key: "photos_taken", label: "Photos taken (data plates, equipment, ductwork)?", type: "yesno", required: true },
      { key: "office_notes", label: "Notes for the Office", type: "textarea", placeholder: "Anything the office needs to know to build this estimate…" },
    ],
  },
];

// ── Visibility & progress helpers ───────────────────────────

function matches(cond: { key: string; in: string[] } | undefined, data: SurveyData): boolean {
  if (!cond) return true;
  const v = data[cond.key];
  return typeof v === "string" && cond.in.includes(v);
}

export function isSectionVisible(section: SurveySection, data: SurveyData): boolean {
  return matches(section.showIf, data);
}

export function isFieldVisible(field: SurveyField, data: SurveyData): boolean {
  return matches(field.showIf, data);
}

export function isAnswered(field: SurveyField, data: SurveyData): boolean {
  const v = data[field.key];
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === "string" && v.trim() !== "";
}

/** Progress over required, currently-visible fields in a section */
export function sectionProgress(section: SurveySection, data: SurveyData): { done: number; total: number } {
  const req = section.fields.filter(f => f.required && isFieldVisible(f, data));
  return { done: req.filter(f => isAnswered(f, data)).length, total: req.length };
}

/** All required fields still missing across the whole survey */
export function missingRequired(data: SurveyData): { section: SurveySection; field: SurveyField }[] {
  const missing: { section: SurveySection; field: SurveyField }[] = [];
  for (const section of SURVEY_SECTIONS) {
    if (!isSectionVisible(section, data)) continue;
    for (const field of section.fields) {
      if (field.required && isFieldVisible(field, data) && !isAnswered(field, data)) {
        missing.push({ section, field });
      }
    }
  }
  return missing;
}

export function customerFullName(data: SurveyData): string {
  return [data.customer_first_name, data.customer_last_name].filter(Boolean).join(" ").trim();
}

export function fullAddress(data: SurveyData): string {
  const line = [data.street_address, data.city, data.state].filter(Boolean).join(", ");
  return [line, data.zip].filter(Boolean).join(" ").trim();
}

function displayValue(field: SurveyField, data: SurveyData): string {
  const v = data[field.key];
  if (Array.isArray(v)) return v.join("; ");
  if (v === undefined || v === "") return "";
  if (field.type === "yesno") return v === "yes" ? "Yes" : v === "no" ? "No" : String(v);
  if (field.unit === "$") return `$${v}`;
  return field.unit ? `${v} ${field.unit}` : String(v);
}

// ── Housecall Pro exports ───────────────────────────────────

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(rows: string[][]): string {
  return rows.map(r => r.map(csvEscape).join(",")).join("\r\n") + "\r\n";
}

/**
 * Customer CSV using Housecall Pro's customer import field names, so the
 * office can drag-and-drop it into HCP's import tool (Customers → Import).
 */
export function buildHcpCustomerCsv(data: SurveyData): string {
  const notes = [
    `System replacement survey — ${data.job_type ?? ""}`,
    `Proposed: ${data.new_tonnage ?? ""} ${data.new_config ?? ""} (${data.efficiency ?? ""})`,
    data.office_notes ? `Office notes: ${data.office_notes}` : "",
  ].filter(Boolean).join(" | ");

  return toCsv([
    ["First name", "Last name", "Mobile number", "Emails", "Service address", "Billing address", "Lead source", "Customer notes", "Tags"],
    [
      String(data.customer_first_name ?? ""),
      String(data.customer_last_name ?? ""),
      String(data.customer_phone ?? ""),
      String(data.customer_email ?? ""),
      fullAddress(data),
      fullAddress(data),
      String(data.lead_source ?? "Field Survey"),
      notes,
      "System Replacement",
    ],
  ]);
}

export interface EstimateLineItem {
  name: string;
  description: string;
  unitPrice: string; // dollars, blank if office prices from price book
  quantity: string;
}

/** Line items the office can paste into an HCP estimate (or import into the price book) */
export function buildEstimateLineItems(data: SurveyData): EstimateLineItem[] {
  const items: EstimateLineItem[] = [];

  const sysDesc = [
    data.new_tonnage, data.new_config, data.efficiency, data.stages,
    data.afue ? `${data.afue} AFUE` : "",
    data.heat_strips && data.heat_strips !== "None" ? `${data.heat_strips} heat` : "",
    data.quoted_brand ? `Brand: ${data.quoted_brand}` : "",
    data.new_outdoor_model ? `OD: ${data.new_outdoor_model}` : "",
    data.new_indoor_model ? `ID: ${data.new_indoor_model}` : "",
    data.new_furnace_model ? `Furnace: ${data.new_furnace_model}` : "",
  ].filter(Boolean).join(" · ");

  items.push({
    name: `System Replacement — ${data.new_tonnage ?? ""} ${data.new_config ?? ""}`.trim(),
    description: sysDesc,
    unitPrice: String(data.price_good ?? ""),
    quantity: "1",
  });

  if (data.thermostat && data.thermostat !== "Reuse existing") {
    items.push({ name: `Thermostat — ${data.thermostat}`, description: "", unitPrice: "", quantity: "1" });
  }
  if (data.lineset_action && data.lineset_action !== "Reuse — flush & pressure test") {
    items.push({
      name: `Line Set — ${data.lineset_action}`,
      description: [data.lineset_size, data.lineset_length ? `${data.lineset_length} ft` : ""].filter(Boolean).join(", "),
      unitPrice: "", quantity: "1",
    });
  }
  if (data.plenums && data.plenums !== "Reuse both") {
    items.push({ name: `Plenum Work — ${data.plenums}`, description: "", unitPrice: "", quantity: "1" });
  }
  if (data.duct_condition && data.duct_condition !== "Good") {
    items.push({ name: `Duct Repairs — ${data.duct_condition}`, description: String(data.duct_notes ?? ""), unitPrice: "", quantity: "1" });
  }
  if (data.float_switch && data.float_switch !== "Existing OK") {
    items.push({ name: `Condensate Safety — ${data.float_switch}`, description: "", unitPrice: "", quantity: "1" });
  }
  if (data.wire_condition === "Undersized / needs replacement") {
    items.push({ name: "Electrical — replace high-voltage wiring", description: "", unitPrice: "", quantity: "1" });
  }
  if (data.disconnect === "Replace") {
    items.push({ name: "Electrical — new outdoor disconnect", description: "", unitPrice: "", quantity: "1" });
  }
  if (data.whip_needed === "yes") {
    items.push({ name: "Electrical — new whip", description: "", unitPrice: "", quantity: "1" });
  }
  if (data.surge_protection === "Add — quoted") {
    items.push({ name: "Surge protector", description: "", unitPrice: "", quantity: "1" });
  }
  if (data.pad && data.pad !== "Reuse existing") {
    items.push({ name: `Outdoor unit — ${data.pad}`, description: "", unitPrice: "", quantity: "1" });
  }
  if (data.crane_needed === "yes") {
    items.push({ name: "Crane / lift service", description: "", unitPrice: "", quantity: "1" });
  }
  if (data.permit_required === "yes") {
    items.push({ name: `Mechanical permit${data.jurisdiction ? ` — ${data.jurisdiction}` : ""}`, description: "", unitPrice: "", quantity: "1" });
  }
  if (data.haul_away === "yes") {
    items.push({ name: "Haul away old equipment", description: "", unitPrice: "", quantity: "1" });
  }
  for (const addon of Array.isArray(data.addons) ? data.addons : []) {
    items.push({ name: `Add-on — ${addon}`, description: "", unitPrice: "", quantity: "1" });
  }
  return items;
}

export function buildLineItemsCsv(data: SurveyData): string {
  const items = buildEstimateLineItems(data);
  return toCsv([
    ["Name", "Description", "Unit price", "Quantity"],
    ...items.map(i => [i.name, i.description, i.unitPrice, i.quantity]),
  ]);
}

/** Full survey flattened to label/value pairs, grouped by section (for email + review UI) */
export function surveySummary(data: SurveyData): { title: string; icon: string; rows: { label: string; value: string }[] }[] {
  return SURVEY_SECTIONS
    .filter(s => isSectionVisible(s, data))
    .map(s => ({
      title: s.title,
      icon: s.icon,
      rows: s.fields
        .filter(f => isFieldVisible(f, data) && isAnswered(f, data))
        .map(f => ({ label: f.label, value: displayValue(f, data) })),
    }))
    .filter(s => s.rows.length > 0);
}
