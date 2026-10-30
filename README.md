# ShelfSense AI 🥛🌾
### AI-Powered Inventory Intelligence, Demand Forecasting, and Perishable Food-Waste Prevention

ShelfSense AI is a full-stack inventory decision-support platform designed for small and medium-sized grocery stores, supermarkets, bakeries, and dairy shops selling perishable goods. It prevents avoidable food waste, protects profit margins, manages batch rotation under First-Expired First-Out (FEFO), and provides demand-aware purchasing suggestions.

---

## 1. The Core Problem & Philosophy

Small retailers often manage inventory through notebooks, manual checks, or basic POS billing software. They typically suffer from:
- Lack of visibility into which perishable batch needs attention first.
- Double-counting demand across batches of the same product.
- Premature replenishment that overstocks shelves while existing inventory nears expiry.
- Misguided discount markdowns that destroy gross profit margins.
- Inability to verify whether stock rotation actually occurred.

### Core Operating Principles (Non-Negotiable)
1. **Deterministic Calculations First**: Arithmetic, days remaining, FEFO allocation, demand moving averages, and margin floors are executed strictly by verified application code—never delegated to an LLM.
2. **First-Expired, First-Out (FEFO)**: Inventory with the earliest sell-through cutoff is prioritized for shelf placement and demand simulation, preventing older stock from being hidden behind new deliveries.
3. **Customer Choice Protected**: Customers who prefer fresher stock are never misled or forced into purchasing older batches. Shelf rotation enhances visibility without customer manipulation.
4. **Zero Sales Past Cutoff**: Products past their operational sell-through cutoff are strictly disallowed from being sold or discounted.
5. **Margin Floor Defense**: Suggested pre-cutoff markdowns are mathematically checked against the retailer's minimum gross margin floor:
   $$\text{Price Floor} = \frac{\text{Purchase Cost}}{1 - (\text{Min Gross Margin \%} / 100)}$$
   Discounts breaching this floor are automatically flagged as policy non-compliant.
6. **Honest Metrics**: Estimated risk exposure is explicitly distinguished from confirmed expired stock and audited waste write-offs. No fabricated savings statistics.

---

## 2. System Architecture & Tech Stack

```
ShelfSense AI Architecture:
├── Frontend (React 19, Tailwind CSS v4, Lucide Icons)
│   ├── Overview Dashboard (Summary KPIs, Daily Briefing, Priority Queue)
│   ├── Batch-Level Inventory (Master Catalog, Batches, CSV Import & Export)
│   ├── Risk & Actions (Actionable Recommendations, FEFO Simulation Deep Dive)
│   ├── Forecasts & Insights (Sales Velocity Bar Chart, Waste Breakdown, Risk Tiers)
│   ├── AI Assistant (Contextual Q&A powered by NVIDIA Nemotron)
│   └── Settings & Audit Trail (Policies, Margins, Timezone, Demo Reset)
├── Backend (Express, TypeScript, Node.js)
│   ├── server/riskEngine.ts (Timezone-aware date math, FEFO demand simulation)
│   ├── server/purchasingEngine.ts (Lead-time & safety-stock aware replenishment)
│   ├── server/pricingEngine.ts (Margin floor verification & markdown simulation)
│   ├── server/recommendations.ts (Category A–E action generators)
│   ├── server/nebiusClient.ts (Nebius Token Factory + NVIDIA Nemotron integration)
│   ├── server/db.ts (Persistent JSON store with atomic writes & audit logging)
│   └── server/seedData.ts (Realistic Indian perishable grocery store dataset)
```

---

## 3. Nebius Token Factory & NVIDIA Model Integration

ShelfSense AI integrates the **NVIDIA Nemotron** model (`nvidia/Nemotron-3_5-Lightning`) via the OpenAI-compatible API provided by **Nebius Token Factory**:
- **Endpoint**: `https://api.tokenfactory.nebius.com/v1/`
- **Model**: `nvidia/Nemotron-3_5-Lightning` (configurable)
- **Role of the AI**:
  - Contextual explanation of verified deterministic risk calculations.
  - Conversational Q&A with shopkeepers about inventory patterns and upcoming orders.
  - Generating "Today's ShelfSense Briefing" from verified stored batch facts.
- **Fail-Safe & Transparency**:
  - All inventory numbers, costs, and batch codes passed to the model are grounded in stored database records.
  - The server validates all AI responses against registered batch identifiers to eliminate hallucinations.
  - If `NEBIUS_API_KEY` is not provided, the application automatically defaults to deterministic decision rules—never fabricating AI responses.

---

## 4. Key Calculation Formulas

### A. Days Remaining (Timezone-Aware)
Calculated using integer calendar day differences in `Asia/Kolkata` (or configured store timezone) at midnight to avoid 23-hour timezone drift bugs:
$$\text{Days Remaining} = \text{Date}_{\text{cutoff}} - \text{Date}_{\text{today}}$$

### B. Product-Level FEFO Demand Simulation
1. Batches are sorted in FEFO order: earliest operational cutoff first.
2. Daily demand $D_t$ is projected using the 14-day moving average and weekday multiplier:
   $$D_t = \bar{D} \times M_{\text{dow}}$$
3. Demand consumes units from the earliest unexpired active batch.
4. Unsold units when a batch reaches its cutoff date are marked as **Estimated At-Risk Units**:
   $$\text{At-Risk Units} = \max(0, \text{Stock Remaining at Cutoff})$$
5. **Stock-Cost Exposure**:
   $$\text{Exposure} = \text{At-Risk Units} \times \text{Batch Unit Purchase Cost}$$

### C. Demand-Aware Replenishment
$$\text{Recommended Order} = \max(0, \text{Horizon Demand} + \text{Safety Stock} - \text{Available Stock} - \text{Incoming Stock})$$
Adjusted up to meet the supplier's Minimum Order Quantity (MOQ).

---

## 5. Getting Started & Development

### Environment Variables
Configure your environment in `.env` (refer to `.env.example`):
```bash
# Server Port (default 3000)
PORT=3000

# Nebius Token Factory (NVIDIA Nemotron Model)
NEBIUS_API_KEY="your-nebius-token-factory-key"
NEBIUS_BASE_URL="https://api.tokenfactory.nebius.com/v1/"
NEBIUS_MODEL="nvidia/Nemotron-3_5-Lightning"
```

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (verifies 16 business logic scenarios)
npm test

# 3. Start development server (Full-stack Express + Vite on port 3000)
npm run dev

# 4. Build for production
npm run build
npm start
```

---

## 6. Automated Test Suite

ShelfSense AI includes a complete automated test suite (`src/test/runTests.ts`) verifying all 16 business logic requirements:
1. Batch with sufficient demand does not receive false urgent warning.
2. Batch with forecast demand lower than stock receives correct estimated at-risk quantity.
3. Multiple batches of the same product do not double-count forecast demand.
4. FEFO allocation prioritizes eligible batches with earlier cutoffs.
5. Past-cutoff batches are never allocated demand or recommended for sale.
6. Unknown or damaged dates are flagged for manual review instead of guessed.
7. Zero sales history produces an honest unconfirmed forecast.
8. Missing demand with manual owner estimates is flagged as low confidence.
9. Dashboard cost calculations reconcile with stored quantities.
10. Database rejects negative or invalid quantities.
11. CSV imports identify invalid records and detect duplicate batch IDs.
12. Markdown recommendations enforce the minimum gross margin floor.
13. Output validator rejects nonexistent batch codes.
14. Unconfigured Nebius API returns transparent deterministic status.
15. Recommendations write audit logs upon approval, completion, and dismissal.
16. Timezone-aware date calculations behave correctly across local timezones.

Run tests anytime with:
```bash
npm test
```

---

## 7. Sample Demonstration Dataset

The seed dataset features a realistic Bangalore perishable grocery store (*Krishna Provision & Perishables*):
- **Amul Taaza Milk 1L**: Two batches demonstrating FEFO (Batch M101 nearing cutoff with 12 units at risk, Batch M102 fresh).
- **Mother Dairy Dahi**: Urgent cutoff in 1 day with supplier credit exchange agreement.
- **Britannia Whole Wheat Bread**: Fast-moving daily staple requiring shelf rotation.
- **Heritage Malai Paneer**: Low velocity item facing excess stock risk.
- **Local Organic Paneer**: Smudged label with unknown date, flagged for human inspection.
- **Alphonso Mangoes**: Seasonal produce using manual owner demand estimate.
- **Epigamia Greek Yogurt**: Pre-cutoff markdown candidate retaining a 15% margin floor.
- **Country Eggs**: Markdown candidate where discount is disallowed because price is already at margin floor.
- **Nandini Pure Ghee**: Long shelf-life pantry staple (0 risk).
- **Historical Sales Records**: 14 days of realistic POS transactions powering moving averages.
- **Recorded Waste Log**: Audited past waste write-offs for honest reporting.

Click **Reset Sample Demo Data** in the Settings tab to re-seed fresh relative dates anytime!
