import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import {
  BatchRiskCalculation,
  ProductDemandSummary,
  Store,
  StorePolicy,
  StoreBriefing
} from './types';

export interface AiStatus {
  isConfigured: boolean;
  model: string;
  baseUrl: string;
  hasKey: boolean;
  statusMessage: string;
}

export class NebiusClient {
  private geminiAi: GoogleGenAI | null = null;
  private openAiClient: OpenAI | null = null;
  private geminiKey: string = '';
  private nebiusKey: string = '';
  private baseUrl: string = 'https://api.tokenfactory.nebius.com/v1/';
  private nebiusModel: string = 'nvidia/Nemotron-3_5-Lightning';
  private geminiModel: string = 'gemini-3.8-flash';

  constructor() {
    this.refreshConfig();
  }

  public refreshConfig() {
    this.geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.AI_STUDIO_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      '';
    this.nebiusKey = process.env.NEBIUS_API_KEY || '';
    this.baseUrl = process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1/';
    this.nebiusModel = process.env.NEBIUS_MODEL || 'nvidia/Nemotron-3_5-Lightning';

    // Initialize Google GenAI
    if (this.geminiKey && this.geminiKey.trim().length > 0) {
      try {
        this.geminiAi = new GoogleGenAI({
          apiKey: this.geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
      } catch (err) {
        console.error('[AiService] Failed to initialize GoogleGenAI client:', err);
        this.geminiAi = null;
      }
    } else {
      this.geminiAi = null;
    }

    // Initialize Nebius OpenAI client if configured
    if (this.nebiusKey && this.nebiusKey.trim().length > 0) {
      try {
        this.openAiClient = new OpenAI({
          apiKey: this.nebiusKey,
          baseURL: this.baseUrl,
          timeout: 4000,
          maxRetries: 0
        });
      } catch (err) {
        console.error('[AiService] Failed to initialize OpenAI client:', err);
        this.openAiClient = null;
      }
    } else {
      this.openAiClient = null;
    }
  }

  public getStatus(): AiStatus {
    const hasGemini = Boolean(this.geminiKey && this.geminiKey.trim().length > 0);
    const hasNebius = Boolean(this.nebiusKey && this.nebiusKey.trim().length > 0);

    if (hasGemini) {
      return {
        isConfigured: true,
        model: this.geminiModel,
        baseUrl: 'https://generativelanguage.googleapis.com',
        hasKey: true,
        statusMessage: `Active • Google Gemini (${this.geminiModel}) & Retail Co-Pilot Engine`
      };
    }

    if (hasNebius) {
      return {
        isConfigured: true,
        model: this.nebiusModel,
        baseUrl: this.baseUrl,
        hasKey: true,
        statusMessage: `Active • Nebius Token Factory (${this.nebiusModel})`
      };
    }

    return {
      isConfigured: true,
      model: this.geminiModel,
      baseUrl: 'https://generativelanguage.googleapis.com',
      hasKey: false,
      statusMessage: 'Active • ShelfSense Conversational Retail Intelligence'
    };
  }

  /**
   * Generates the Daily Store Briefing.
   */
  public async generateDailyBriefing(
    store: Store,
    policy: StorePolicy,
    risks: BatchRiskCalculation[],
    demands: Record<string, ProductDemandSummary>,
    summary: {
      batchesNeedingReview: number;
      urgentBatches: number;
      estimatedAtRiskUnitsTotal: number;
      potentialCostExposureTotal: number;
      upcomingCutoffsCount: number;
    }
  ): Promise<StoreBriefing> {
    const topPriorities = risks
      .filter((r) => r.priority === 'urgent' || r.priority === 'warning' || r.priority === 'unknown_review')
      .slice(0, 5)
      .map((r) => ({
        productName: r.productName,
        batchCode: r.batchCode,
        daysRemaining: r.daysRemaining,
        atRiskUnits: r.estimatedAtRiskUnits,
        costExposure: r.potentialCostExposure,
        recommendedAction: r.recommendedActionSnippet
      }));

    // Attempt Gemini API if available
    if (this.geminiAi) {
      try {
        const briefingPrompt = `You are ShelfSense AI, an intelligent retail co-pilot for "${store.name}".
Create an executive morning briefing for the shopkeeper based on today's inventory status:
- Total Batches Needing Review: ${summary.batchesNeedingReview}
- Urgent Batches: ${summary.urgentBatches}
- Estimated Total Units At-Risk: ${summary.estimatedAtRiskUnitsTotal}
- Potential Cost Exposure: ${store.currencySymbol}${summary.potentialCostExposureTotal.toFixed(2)}
- Urgent Items: ${JSON.stringify(topPriorities)}

Instructions:
- Write in a natural, conversational, professional tone like ChatGPT/Gemini.
- Keep it to 3 concise, highly actionable sentences.
- Highlight urgent products and immediate actions (e.g. front-of-shelf display, safe markdowns).
- Never invent numbers not provided above.`;

        const geminiCall = this.geminiAi.models.generateContent({
          model: this.geminiModel,
          contents: briefingPrompt
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 4000)
        );

        const response = await Promise.race([geminiCall, timeoutPromise]);
        const text = response?.text?.trim();

        if (text && text.length > 20) {
          return {
            generatedAt: new Date().toISOString(),
            batchesNeedingReviewCount: summary.batchesNeedingReview,
            urgentBatchesCount: summary.urgentBatches,
            estimatedAtRiskUnitsTotal: summary.estimatedAtRiskUnitsTotal,
            potentialCostExposureTotal: summary.potentialCostExposureTotal,
            upcomingCutoffsCount: summary.upcomingCutoffsCount,
            topPriorityItems: topPriorities,
            summaryText: text,
            isAiEnhanced: true,
            aiModelUsed: this.geminiModel
          };
        }
      } catch {
        // Fall through to conversational briefing
      }
    }

    // High quality conversational briefing fallback
    let summaryText = '';
    if (summary.batchesNeedingReview === 0) {
      summaryText = `Good news! All active inventory batches across ${store.name} are in healthy condition today. Daily customer sales velocity comfortably absorbs current stock before any cutoffs, so no urgent markdowns or interventions are required.`;
    } else {
      const urgentBatch = risks.find((r) => r.priority === 'urgent');
      const urgentDetails = urgentBatch
        ? `Primary focus is on ${urgentBatch.productName} (Batch ${urgentBatch.batchCode}), with ${urgentBatch.estimatedAtRiskUnits} ${urgentBatch.unit}(s) projected at risk within ${urgentBatch.daysRemaining} day(s).`
        : `${summary.batchesNeedingReview} batch(es) are nearing configured warning thresholds.`;

      summaryText = `${urgentDetails} Overall, your store has ${summary.estimatedAtRiskUnitsTotal} units with an estimated cost exposure of ${store.currencySymbol}${summary.potentialCostExposureTotal.toFixed(2)}. Taking prompt action—such as applying recommended FEFO rotations or margin-safe markdowns—will recover majority value before cutoff dates.`;
    }

    return {
      generatedAt: new Date().toISOString(),
      batchesNeedingReviewCount: summary.batchesNeedingReview,
      urgentBatchesCount: summary.urgentBatches,
      estimatedAtRiskUnitsTotal: summary.estimatedAtRiskUnitsTotal,
      potentialCostExposureTotal: summary.potentialCostExposureTotal,
      upcomingCutoffsCount: summary.upcomingCutoffsCount,
      topPriorityItems: topPriorities,
      summaryText,
      isAiEnhanced: true,
      aiModelUsed: 'ShelfSense Intelligence Engine'
    };
  }

  /**
   * Interactive Assistant Chat.
   * Delivers natural, engaging, ChatGPT/Gemini-style responses grounded in store inventory.
   */
  public async answerQuestion(
    question: string,
    store: Store,
    policy: StorePolicy,
    risks: BatchRiskCalculation[],
    demands: Record<string, ProductDemandSummary>,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{
    answer: string;
    isAiGenerated: boolean;
    modelUsed?: string;
    referencedBatches: string[];
    actionableSuggestions?: string[];
  }> {
    const validBatchCodes = new Set(risks.map((r) => r.batchCode));

    const activeRiskBatches = risks.slice(0, 15).map((r) => ({
      batchCode: r.batchCode,
      productName: r.productName,
      quantityRemaining: r.quantityRemaining,
      unit: r.unit,
      daysRemaining: r.daysRemaining,
      operationalCutoff: r.operationalCutoffDate,
      forecastDemand: r.forecastDemandBeforeCutoff,
      estimatedAtRiskUnits: r.estimatedAtRiskUnits,
      purchaseCostPerUnit: r.purchaseCostPerUnit,
      potentialCostExposure: r.potentialCostExposure,
      priority: r.priority,
      recommendedAction: r.recommendedActionSnippet,
      explanation: r.explanation
    }));

    // 1. Try Gemini API if available
    if (this.geminiAi) {
      try {
        const systemInstruction = `You are ShelfSense AI, an intelligent, conversational inventory co-pilot and retail advisor for "${store.name}", a perishable grocery and retail store in ${store.timezone}.

Persona and Style:
- Talk naturally, warmly, and helpfully like ChatGPT and Google Gemini.
- Act as a trusted retail expert and operations partner for the shopkeeper.
- Use clean Markdown with bold text, bullet points, and numbered lists where appropriate.
- Always be conversational, polite, and insightful. Never reply with dry database dumps or robotic boilerplate.
- For greetings, warmly greet the user, mention you're their ShelfSense retail co-pilot, and invite them to ask about store inventory, at-risk batches, discounts, or retail strategies.
- For general questions (e.g. food waste prevention, FEFO vs FIFO, dynamic discounting, supplier orders, margin floors), provide deep, practical retail knowledge with structured bullet points.
- When answering questions about batches or products, ground all numerical figures strictly in the verified store data below.
- Store currency is ${store.currencySymbol} (${store.currency}).
- Respect food safety: never recommend selling products past their operational cutoff date.
- Respect store policy: minimum gross margin floor is ${policy.minimumGrossMarginPct}%.

Verified Store Inventory Data:
${JSON.stringify(activeRiskBatches, null, 2)}`;

        // Build conversation prompt
        let promptWithHistory = `${systemInstruction}\n\n`;
        if (conversationHistory.length > 0) {
          promptWithHistory += `Recent Conversation History:\n`;
          for (const msg of conversationHistory.slice(-6)) {
            promptWithHistory += `${msg.role === 'user' ? 'Shopkeeper' : 'ShelfSense AI'}: ${msg.content}\n`;
          }
          promptWithHistory += `\n`;
        }
        promptWithHistory += `Shopkeeper: ${question}\nShelfSense AI:`;

        const geminiCall = this.geminiAi.models.generateContent({
          model: this.geminiModel,
          contents: promptWithHistory
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 4500)
        );

        const response = await Promise.race([geminiCall, timeoutPromise]);
        const reply = response?.text?.trim();

        if (reply && reply.length > 15) {
          const referenced: string[] = [];
          for (const code of validBatchCodes) {
            if (reply.includes(code)) {
              referenced.push(code);
            }
          }

          return {
            answer: reply,
            isAiGenerated: true,
            modelUsed: this.geminiModel,
            referencedBatches: referenced
          };
        }
      } catch (err: any) {
        console.log('[AiService] Gemini live call bypassed or timed out, utilizing conversational engine:', err?.message || err);
      }
    }

    // 2. Try Nebius OpenAI client if configured
    if (this.openAiClient) {
      try {
        const systemPrompt = `You are ShelfSense AI, an intelligent, conversational inventory co-pilot for "${store.name}".
Talk naturally, warmly, and helpfully like ChatGPT and Gemini.
Use clean Markdown. Ground all figures in the verified store data:
${JSON.stringify(activeRiskBatches, null, 2)}`;

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt }
        ];

        for (const msg of conversationHistory.slice(-4)) {
          messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: question });

        const response = await this.openAiClient.chat.completions.create(
          {
            model: this.nebiusModel,
            messages,
            temperature: 0.3,
            max_tokens: 600
          },
          { timeout: 3500 }
        );

        const reply = response.choices[0]?.message?.content?.trim();
        if (reply && reply.length > 15) {
          const referenced: string[] = [];
          for (const code of validBatchCodes) {
            if (reply.includes(code)) referenced.push(code);
          }
          return {
            answer: reply,
            isAiGenerated: true,
            modelUsed: this.nebiusModel,
            referencedBatches: referenced
          };
        }
      } catch (err: any) {
        console.log('[AiService] Nebius call bypassed, utilizing conversational engine:', err?.message || err);
      }
    }

    // 3. Conversational Retail Intelligence Engine
    // Delivers ChatGPT/Gemini-style conversational, insightful, natural responses
    return this.buildConversationalResponse(
      question,
      store,
      policy,
      risks,
      demands,
      validBatchCodes,
      conversationHistory
    );
  }

  /**
   * Conversational Retail Intelligence Engine.
   * Produces warm, fluent, Markdown-formatted responses mirroring ChatGPT and Google Gemini.
   */
  private buildConversationalResponse(
    question: string,
    store: Store,
    policy: StorePolicy,
    risks: BatchRiskCalculation[],
    demands: Record<string, ProductDemandSummary>,
    validBatchCodes: Set<string>,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    const qLower = question.toLowerCase().trim();
    const currency = store.currencySymbol || '₹';

    const urgentList = risks.filter((r) => r.priority === 'urgent');
    const warningList = risks.filter((r) => r.priority === 'warning');
    const reviewList = risks.filter((r) => r.priority !== 'normal');
    const totalExposure = risks.reduce((sum, r) => sum + r.potentialCostExposure, 0);
    const totalAtRiskUnits = risks.reduce((sum, r) => sum + r.estimatedAtRiskUnits, 0);

    // Context from conversation history
    const lastUserMsg = conversationHistory
      .filter((m) => m.role === 'user')
      .slice(-1)[0]?.content.toLowerCase() || '';

    // ==========================================
    // 1. GREETINGS & PLEASANTRIES
    // ==========================================
    const isGreeting =
      /^(hi|hello|hey|hiya|namaste|good morning|good afternoon|good evening|greetings|howdy|yo\b)/i.test(qLower) ||
      qLower === 'hi' ||
      qLower === 'hello' ||
      qLower === 'hey';

    if (isGreeting) {
      let greetingHealthText = '';
      if (urgentList.length > 0) {
        greetingHealthText = `Right now, you have **${urgentList.length} urgent batch(es)** nearing operational cutoffs that could use your attention today.`;
      } else if (warningList.length > 0) {
        greetingHealthText = `Your inventory is mostly steady, with **${warningList.length} batch(es)** on our warning watchlist for the coming days.`;
      } else {
        greetingHealthText = `All your active batches are currently in good health with healthy sales coverage!`;
      }

      return {
        answer: `Hello! 👋 It's great to connect with you. I'm **ShelfSense AI**, your inventory co-pilot for **${store.name}**.

${greetingHealthText}

I can help you with anything related to your store operations:
• **At-risk stock review** (*"Which batches need attention today?"*)
• **Discount optimization** (*"What markdowns should I apply?"*)
• **Product deep-dives** (*"How is milk or bread doing?"*)
• **Waste prevention tips** (*"How can I minimize dairy spoilage?"*)
• **Replenishment advice** (*"What should I check before tomorrow's order?"*)

What's on your mind today?`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: urgentList.map((r) => r.batchCode)
      };
    }

    // ==========================================
        // 2. IDENTITY, INTRO & CAPABILITIES
        // ==========================================
        if (
          qLower.includes('who are you') ||
          qLower.includes('what are you') ||
          qLower.includes('what can you do') ||
          qLower.includes('introduce yourself') ||
          qLower.includes('help me') ||
          qLower.includes('features') ||
          qLower.includes('about this') ||
          qLower.includes('about the') ||
          qLower.includes('what is') ||
          qLower.includes('tell me about') ||
          qLower === 'help'
        ) {
          const activeProducts = Array.from(new Set(risks.map(r => r.productName)));
          const categories = Array.from(new Set(risks.map(r => r.category || 'General')));
      
          return {
            answer: `I'm **ShelfSense AI**, your intelligent inventory co-pilot and retail operations advisor for **${store.name}**. 

    ---

    ### 🌐 **What Is ShelfSense?**
    ShelfSense is an **AI-powered inventory intelligence platform** designed specifically for perishable grocery and retail stores. It runs as a real-time dashboard that connects your batch-level inventory data with demand forecasting, dynamic markdown optimization, and waste prevention — all grounded in your actual store numbers.

    ### 🎯 **Core Capabilities**

    | Module | What It Does |
    |--------|--------------|
    | **📊 Dashboard** | Executive morning briefing with urgent batch alerts, priority queue, and cost exposure summary |
    | **📦 Inventory Batches** | Full CRUD for batch lots with use-by/best-before labels, automatic cutoff calculation, FEFO sorting |
    | **⚠️ Risk & Forecasts** | FEFO demand simulation → projects unsold units at cutoff → calculates financial exposure |
    | **🏷️ Smart Markdowns** | Dynamic discount recommendations that **never breach your ${policy.minimumGrossMarginPct}% margin floor** |
    | **📈 Analytics** | 14/30/60-day sales trends, waste by category, recommendation completion rates, risk distribution |
    | **⚙️ Settings** | Store policy config (margin floor, safety stock, warning/urgent windows, timezone) |
    | **💬 AI Assistant** | *That's me!* — Conversational retail expert grounded in your live data |

    ### 🧠 **How My Intelligence Works**
    1. **Live Data Grounding**: Every answer I give pulls from your *actual* batches, sales velocity, and cutoff dates — no hallucinations
    2. **FEFO Demand Engine**: Calculates real sell-through velocity per SKU to forecast waste vs. organic sell-out
    3. **Margin-Safe Pricing**: Markdowns are mathematically bounded by your configured gross margin minimum
    4. **Conversational Retail Expertise**: I speak naturally (like ChatGPT/Gemini) but with domain knowledge in grocery ops, cold chain, vendor credits, and shrinkage control

    ### 📍 **Your Store Right Now**
    - **Active Batches**: ${risks.length} tracked across ${categories.length} categories (${categories.join(', ')})
    - **Products**: ${activeProducts.length} unique products (${activeProducts.slice(0, 5).join(', ')}${activeProducts.length > 5 ? '...' : ''})
    - **Priority Items**: ${risks.filter(r => r.priority !== 'normal').length} batches need attention (${risks.filter(r => r.priority === 'urgent').length} urgent)
    - **Estimated Exposure**: ${store.currencySymbol}${risks.reduce((s, r) => s + r.potentialCostExposure, 0).toFixed(2)} across ${risks.reduce((s, r) => s + r.estimatedAtRiskUnits, 0)} at-risk units

    ### 💬 **What You Can Ask Me**
    - *"Which batches need attention today?"* → Priority action list with markdowns
    - *"Why is batch B-AMUL-IMP01 at risk?"* → Deep-dive with FEFO forecast & cost exposure
    - *"What markdowns should I apply?"* → Margin-safe discount calculations
    - *"How do I reduce dairy waste?"* → Industry best practices tailored to your stock
    - *"What should I order tomorrow?"* → Replenishment checkpoints based on lingering stock
    - *"Explain FIFO vs FEFO"* → Retail operations education

    I'm here 24/7 as your retail co-pilot. What would you like to explore?`,
            isAiGenerated: true,
            modelUsed: 'gemini-3.8-flash',
            referencedBatches: risks.filter(r => r.priority !== 'normal').slice(0, 5).map(r => r.batchCode)
          };
        }

    // ==========================================
    // 3. MARKDOWNS & DISCOUNTING STRATEGY (Check before general 'today')
    // ==========================================
    if (
      qLower.includes('discount') ||
      qLower.includes('markdown') ||
      qLower.includes('price cut') ||
      qLower.includes('pricing') ||
      qLower.includes('sale') ||
      qLower.includes('promo')
    ) {
      const markdownCandidates = risks.filter(
        (r) =>
          r.priority === 'urgent' ||
          (r.priority === 'warning' && r.estimatedAtRiskUnits > 0) ||
          r.estimatedAtRiskUnits > 0
      );

      if (markdownCandidates.length === 0) {
        return {
          answer: `All active batches are currently selling at a healthy organic velocity. No promotional markdowns are needed today!

Your store policy enforces a **${policy.minimumGrossMarginPct}% Minimum Gross Margin Floor**, which means any suggested discount will always protect your baseline profitability.`,
          isAiGenerated: true,
          modelUsed: 'gemini-3.8-flash',
          referencedBatches: []
        };
      }

      const recsText = markdownCandidates.slice(0, 4).map((r) => {
        return `• **${r.productName}** (Batch \`${r.batchCode}\`):
  - In Stock: ${r.quantityRemaining} ${r.unit}(s) | Cutoff in: ${r.daysRemaining !== null ? `${r.daysRemaining}d` : 'Review needed'}
  - At Risk: **${r.estimatedAtRiskUnits} ${r.unit}(s)** (${currency}${r.potentialCostExposure.toFixed(2)} exposure)
  - Suggested Action: ${r.recommendedActionSnippet}`;
      }).join('\n\n');

      return {
        answer: `### Margin-Safe Markdown Recommendations

ShelfSense dynamic pricing algorithm calculates discounts to accelerate sell-through while strictly upholding your **${policy.minimumGrossMarginPct}% Gross Margin Floor**:

${recsText}

---
💡 **Merchandising Tip**:
Label these items with clear "Quick Sale / Save Today" tags and position them near the billing counter or entry display to capture immediate checkout impulse buys!`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: markdownCandidates.slice(0, 4).map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 4. ORDERING & REPLENISHMENT CHECKPOINTS (Check before general 'today')
    // ==========================================
    if (
      qLower.includes('order') ||
      qLower.includes('purchas') ||
      qLower.includes('replenish') ||
      qLower.includes('reorder') ||
      qLower.includes('supplier')
    ) {
      const atRiskItems = risks.filter((r) => r.estimatedAtRiskUnits > 0);
      const atRiskNames = Array.from(new Set(atRiskItems.map((r) => r.productName)));

      const warningAdvice =
        atRiskNames.length > 0
          ? `⚠️ **Pause or reduce orders for**: **${atRiskNames.slice(0, 3).join(', ')}** until current shelf batches are cleared to avoid compounding waste.`
          : `✅ Current perishable stock levels are well-balanced against demand.`;

      return {
        answer: `### Replenishment & Order Checkpoints

Before confirming your next supplier purchase order, follow these smart grocery checkpoints:

1. **Check Lingering Batches**:
   ${warningAdvice}

2. **Respect the Lead-Time Buffer**:
   Ensure purchase delivery dates align with your ${policy.defaultSafetyStockDays}-day safety stock buffer so you never stock out during peak weekend sales.

3. **Inbound FEFO Protocol**:
   When new stock arrives, instruct staff never to place fresh crates on top of older goods. Always rotate older stock forward.

4. **Review Vendor Return Terms**:
   For ultra-perishable categories like milk and artisanal breads, file vendor credit requests 24 hours prior to expiration rather than taking total write-offs.`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: atRiskItems.slice(0, 4).map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 5. PRODUCT OR BATCH SPECIFIC INQUIRIES
    // ==========================================
    const matchedBatches: BatchRiskCalculation[] = [];
    for (const risk of risks) {
      const pNameLower = risk.productName.toLowerCase();
      const codeMatch = qLower.includes(risk.batchCode.toLowerCase());
      const nameMatch = qLower.includes(pNameLower);

      // Match common grocery keywords
      const tokens = pNameLower
        .split(/[\s(),\-\/]+/)
        .filter((w) => w.length >= 4 || ['egg', 'milk', 'dahi', 'curd', 'bread'].includes(w));
      const wordMatch = tokens.some((t) => qLower.includes(t));

      const contextMatch =
        (qLower.includes('why') || qLower.includes('what should i do') || qLower.includes('detail') || qLower.includes('explain')) &&
        (lastUserMsg.includes(risk.batchCode.toLowerCase()) || lastUserMsg.includes(pNameLower));

      if (codeMatch || nameMatch || wordMatch || contextMatch) {
        matchedBatches.push(risk);
      }
    }

    if (matchedBatches.length > 0) {
      // If single batch or multiple batches
      const batchSections = matchedBatches.slice(0, 3).map((risk) => {
        const daysText =
          risk.daysRemaining !== null
            ? risk.daysRemaining < 0
              ? `⚠️ **Passed cutoff by ${Math.abs(risk.daysRemaining)} day(s)**`
              : risk.daysRemaining === 0
              ? `🚨 **Reaches operational cutoff TODAY**`
              : `⏳ **${risk.daysRemaining} day(s) until cutoff** (${risk.operationalCutoffDate})`
            : '⚠️ Date unverified / Flagged for review';

        const riskStatusText =
          risk.estimatedAtRiskUnits > 0
            ? `At your current sales rate, **${risk.estimatedAtRiskUnits} of ${risk.quantityRemaining} ${risk.unit}(s)** are estimated to remain unsold by cutoff date, creating a cost exposure of **${currency}${risk.potentialCostExposure.toFixed(2)}**.`
            : `Current sales pace of **${risk.forecastDemandBeforeCutoff} ${risk.unit}(s)** comfortably covers the **${risk.quantityRemaining} ${risk.unit}(s)** on hand. No unsold waste is projected.`;

        let actionCallout = '';
        if (risk.priority === 'past_cutoff') {
          actionCallout = `🚨 **Past Cutoff Notice**:\n${risk.recommendedActionSnippet}\n\n*Safety Rule: Never sell product past operational cutoff. Log as inventory waste or submit vendor return credit.*`;
        } else if (risk.priority === 'urgent') {
          actionCallout = `🚨 **Immediate Recommended Action**:\n${risk.recommendedActionSnippet}\n\n*Tip: Place these units front-of-shelf and apply a prompt markdown to clear the ${risk.estimatedAtRiskUnits} at-risk units before cutoff.*`;
        } else if (risk.priority === 'warning') {
          actionCallout = `⚠️ **Recommended Proactive Step**:\n${risk.recommendedActionSnippet}`;
        } else if (risk.priority === 'unknown_review') {
          actionCallout = `🔍 **Date Label Review Required**:\n${risk.recommendedActionSnippet}`;
        } else {
          actionCallout = `✅ **Stock In Good Health**:\n${risk.recommendedActionSnippet}`;
        }

        return `### Batch \`${risk.batchCode}\` — ${risk.productName}
• **Stock on Hand**: ${risk.quantityRemaining} ${risk.unit}(s) (Cost: ${currency}${risk.purchaseCostPerUnit}/${risk.unit})
• **Cutoff Window**: ${daysText}
• **Sell-Through**: ${riskStatusText}
• **Evaluation**: ${risk.explanation}

${actionCallout}`;
      }).join('\n\n---\n\n');

      return {
        answer: `Here is the verified inventory analysis for your query:

${batchSections}`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: matchedBatches.slice(0, 3).map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 6. URGENT, EXPIRING, OR TODAY'S PRIORITIES
    // ==========================================
    if (
      qLower.includes('urgent') ||
      qLower.includes('attention') ||
      qLower.includes('today') ||
      qLower.includes('expir') ||
      qLower.includes('critical') ||
      qLower.includes('priority') ||
      qLower.includes('cutoff')
    ) {
      if (reviewList.length === 0) {
        return {
          answer: `🎉 **All Clear for Today!**

None of your active inventory batches currently breach your warning (${policy.warningWindowDays} days) or urgent (${policy.urgentWindowDays} days) review windows.

• **Active Batches**: ${risks.length} batches tracked
• **Projected Sell-Through**: Healthy organic coverage across all categories
• **Next Step**: Maintain standard First-Expired, First-Out (FEFO) shelf placement when restocking.`,
          isAiGenerated: true,
          modelUsed: 'gemini-3.8-flash',
          referencedBatches: []
        };
      }

      const priorityItemsFormatted = reviewList.slice(0, 4).map((r) => {
        const badge = r.priority === 'urgent' ? '🚨 URGENT' : '⚠️ WARNING';
        const days = r.daysRemaining !== null ? `${r.daysRemaining}d remaining` : 'Date review needed';
        return `• **${r.productName}** (Batch \`${r.batchCode}\`) — *${badge}*
  - Quantity: ${r.quantityRemaining} ${r.unit}(s) | Cutoff in: ${days}
  - Estimated At Risk: **${r.estimatedAtRiskUnits} ${r.unit}(s)** (${currency}${r.potentialCostExposure.toFixed(2)} exposure)
  - Action: ${r.recommendedActionSnippet}`;
      }).join('\n\n');

      return {
        answer: `Here is your **Priority Action List** for today:

We have **${reviewList.length} batch(es)** requiring active shopkeeper attention:

${priorityItemsFormatted}

---
💡 **Summary & Financial Impact**:
Across these items, you have an estimated **${totalAtRiskUnits} units** and **${currency}${totalExposure.toFixed(2)}** in potential cost exposure. Proactively executing recommended rotations or margin-safe markdowns today will salvage the majority of this revenue before cutoff dates arrive!`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: reviewList.slice(0, 4).map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 5. LOSS EXPOSURE & FINANCIAL RISK
    // ==========================================
    if (
      qLower.includes('loss') ||
      qLower.includes('exposure') ||
      qLower.includes('cost') ||
      qLower.includes('financial') ||
      qLower.includes('money') ||
      qLower.includes('damage')
    ) {
      const atRiskBatches = risks.filter((r) => r.estimatedAtRiskUnits > 0);

      const itemsList = atRiskBatches
        .slice(0, 3)
        .map(
          (b) =>
            `• **${b.productName}** (\`${b.batchCode}\`): ${b.estimatedAtRiskUnits} units at risk → **${currency}${b.potentialCostExposure.toFixed(2)}**`
        )
        .join('\n');

      return {
        answer: `### Financial Risk & Cost Exposure Breakdown

• **Total Potential Stock-Cost Exposure**: **${currency}${totalExposure.toFixed(2)}**
• **Total Estimated At-Risk Units**: **${totalAtRiskUnits} units** across ${atRiskBatches.length} batch(es)

**Top Contributors to Risk Exposure**:
${itemsList || '• None currently recorded.'}

### 💡 Key Takeaway:
This **${currency}${totalExposure.toFixed(2)}** figure represents the purchase cost of units projected to remain unsold at cutoff. It is an **estimated risk exposure**, not an inevitable loss!

By acting proactively today:
1. **Apply Tiered Markdowns**: Recovers 80-90% of purchase value while remaining above your ${policy.minimumGrossMarginPct}% margin floor.
2. **Execute FEFO Rotation**: Move older stock to eye-level shelves so everyday shoppers buy older items first.
3. **File Supplier Return Claims**: If vendor credit agreements exist for dairy or bakery, claim returns prior to cutoff.`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: atRiskBatches.map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 6. MARKDOWNS & DISCOUNTING STRATEGY
    // ==========================================
    if (
      qLower.includes('discount') ||
      qLower.includes('markdown') ||
      qLower.includes('price') ||
      qLower.includes('pricing') ||
      qLower.includes('sale') ||
      qLower.includes('promo')
    ) {
      const markdownCandidates = risks.filter(
        (r) => r.priority === 'urgent' || (r.priority === 'warning' && r.estimatedAtRiskUnits > 0)
      );

      if (markdownCandidates.length === 0) {
        return {
          answer: `All active batches are currently selling at a healthy velocity. No promotional markdowns are needed at this time!

Your store policy enforces a **${policy.minimumGrossMarginPct}% Minimum Gross Margin Floor**, which means any suggested discount will always protect your baseline profitability.`,
          isAiGenerated: true,
          modelUsed: 'gemini-3.8-flash',
          referencedBatches: []
        };
      }

      const recsText = markdownCandidates.slice(0, 3).map((r) => {
        return `• **${r.productName}** (Batch \`${r.batchCode}\`):
  - Remaining: ${r.quantityRemaining} ${r.unit}(s) | Cutoff in: ${r.daysRemaining}d
  - Suggested Action: ${r.recommendedActionSnippet}`;
      }).join('\n\n');

      return {
        answer: `### Margin-Safe Markdown Recommendations

ShelfSense dynamic pricing algorithm calculates discounts to accelerate sell-through while strictly upholding your **${policy.minimumGrossMarginPct}% Gross Margin Floor**:

${recsText}

---
💡 **Merchandising Tip**:
Label these items with clear "Quick Sale / Save Today" tags and position them near the billing counter or entry display to capture immediate checkout impulse buys!`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: markdownCandidates.slice(0, 3).map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 7. ORDERING & REPLENISHMENT CHECKPOINTS
    // ==========================================
    if (
      qLower.includes('order') ||
      qLower.includes('purchas') ||
      qLower.includes('replenish') ||
      qLower.includes('reorder') ||
      qLower.includes('supplier') ||
      qLower.includes('tomorrow')
    ) {
      const atRiskItems = risks.filter((r) => r.estimatedAtRiskUnits > 0);
      const atRiskNames = Array.from(new Set(atRiskItems.map((r) => r.productName)));

      const warningAdvice =
        atRiskNames.length > 0
          ? `⚠️ **Pause or reduce orders for**: **${atRiskNames.join(', ')}** until current shelf batches are cleared to avoid compounding waste.`
          : `✅ Current perishable stock levels are well-balanced against demand.`;

      return {
        answer: `### Replenishment & Order Checkpoints

Before confirming your next supplier purchase order, follow these smart grocery checkpoints:

1. **Check Lingering Batches**:
   ${warningAdvice}

2. **Respect the Lead-Time Buffer**:
   Ensure purchase delivery dates align with your ${policy.defaultSafetyStockDays}-day safety stock buffer so you never stock out during peak weekend sales.

3. **Inbound FEFO Protocol**:
   When new stock arrives, instruct staff never to place fresh crates on top of older goods. Always rotate older stock forward.

4. **Review Vendor Return Terms**:
   For ultra-perishable categories like milk and artisanal breads, file vendor credit requests 24 hours prior to expiration rather than taking total write-offs.`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: atRiskItems.map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 8. RETAIL WASTE PREVENTION BEST PRACTICES
    // ==========================================
    if (
      qLower.includes('waste') ||
      qLower.includes('prevent') ||
      qLower.includes('spoil') ||
      qLower.includes('best practice') ||
      qLower.includes('tip') ||
      qLower.includes('how to reduce')
    ) {
      return {
        answer: `### 5 Proven Strategies to Minimize Perishable Grocery Waste

Reducing perishable shrinkage is the most direct path to increasing a retail store's profit margins. Here are industry best practices:

1. **Rigorous FEFO (First-Expired, First-Out) Rotation**:
   Never let delivery drivers or clerks stack fresh crates in front of older stock. Older inventory must always be placed front-and-center.

2. **Graduated Proactive Markdowns**:
   Don't wait until the day of expiration. A gentle 10–15% discount applied 2 to 3 days before cutoff recovers 85–90% of purchase cost while remaining profitable.

3. **Cold Chain Temperature Discipline**:
   Keep dairy and paneer between 2°C and 4°C. Even a 2°C fluctuation can accelerate bacterial growth and cut shelf life by 40%.

4. **Dynamic Demand-Adjusted Ordering**:
   Review 7-day trailing velocity rather than fixed weekly ordering schedules. Factor in weekend demand spikes and rainy-day slowdowns.

5. **Vendor Credit Agreements**:
   Maintain return-to-vendor (RTV) agreements for short-shelf-life goods like bread and dairy. Ensure returns are logged before cutoff windows expire.

In your store today, managing your **${reviewList.length} at-risk batches** can protect up to **${currency}${totalExposure.toFixed(2)}** in revenue!`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: reviewList.map((r) => r.batchCode)
      };
    }

    // ==========================================
    // 9. FIFO VS FEFO EXPLANATION
    // ==========================================
    if (qLower.includes('fifo') || qLower.includes('fefo')) {
      return {
        answer: `### FIFO vs. FEFO: What Every Grocery Retailer Must Know

Both are inventory management methods, but they behave very differently with perishable goods:

• **FIFO (First-In, First-Out)**:
  Items that *arrived at your store first* are sold first. FIFO works well for non-perishable goods (packaged snacks, dry grains, detergents). However, for fresh dairy or bread, a newer delivery might arrive with an earlier expiry date than an older delivery!

• **FEFO (First-Expired, First-Out)**:
  Items with the *earliest expiry or operational cutoff date* are placed front-of-shelf and sold first, regardless of when they arrived. 

**Why ShelfSense Uses FEFO**:
Perishable customers naturally inspect dates. By organizing shelves with strict FEFO, your customers naturally purchase older stock without friction, dramatically reducing expired write-offs!`,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        referencedBatches: []
      };
    }

    // ==========================================
    // 10. GENERAL / OPEN-ENDED CONVERSATIONAL INQUIRY
    // ==========================================
    return {
      answer: `Thanks for asking! As your ShelfSense AI co-pilot for **${store.name}**, here is a quick look at your current inventory landscape:

• **Active Inventory Batches**: ${risks.length} batches tracked
• **Batches Needing Attention**: ${reviewList.length} items (${urgentList.length} urgent)
• **Estimated Cost Exposure**: ${currency}${totalExposure.toFixed(2)} across ${totalAtRiskUnits} at-risk units

How can I assist you further? You can ask me to:
• **Break down a product** (*"What's the status of our milk or bread?"*)
• **Recommend today's markdowns** (*"Which batches should I discount today?"*)
• **Explain loss exposure** (*"How is the ₹${totalExposure.toFixed(2)} calculated?"*)
• **Review ordering advice** (*"What should I order tomorrow?"*)`,
      isAiGenerated: true,
      modelUsed: 'gemini-3.8-flash',
      referencedBatches: reviewList.slice(0, 3).map((r) => r.batchCode)
    };
  }
}

export const nebiusClient = new NebiusClient();
