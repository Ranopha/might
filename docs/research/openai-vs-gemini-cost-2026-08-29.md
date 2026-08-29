# Might 的 OpenAI／Gemini 成本與參賽取捨

日期：2026-08-29
範圍：只做官方資料研究與現況判讀；未修改程式、模型設定、API key 或部署環境。

## 結論

**在 Convex All Gas Hackathon 提交完成前，不建議把 Might 現有任何 production 路徑由 OpenAI 換成 Gemini。**

理由不是 Gemini 不夠好，而是這筆遷移目前同時有三個不利條件：

1. **參賽證據會變弱。** 官方評審明列 OpenAI 為 sponsor stack，要求 OpenAI、Firecrawl、AgentMail 在產品裡做真實工作。Might 現在的 Talk、living memory、公開訊號解讀、match／clarification 與 Webtoon companion，正好構成一條可被評審看懂的 OpenAI 證據鏈。把其中多數改走 Gemini，會用很小的成本節省換掉最清楚的 sponsor 故事。[Convex All Gas Hackathon 官方頁](https://www.convex.dev/hackathons/all-gas)
2. **免費 Gemini 不適合 Might 的私人內容。** Google 官方條款說，未付費服務的輸入與輸出可用於提供、改進及開發產品與機器學習技術，且可能由人工審查；官方並明確要求不要把敏感、機密或個人資訊送進未付費服務。Talk、living memory、clarification、pitch 與 inbound email 都可能包含這類內容。[Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
3. **絕對節省很小。** 依本文的 demo-scale 假設，一次全新完整 E2E 約為 OpenAI **US$0.06–0.07**，全部換成付費 Gemini 約 **US$0.038–0.040**；每次約省 **US$0.03**。只換 Talk 文字路徑，每次完整 demo 約省 **US$0.002**。這不足以抵銷新增 provider、第二套測試、資料政策、失敗回復與評審證據的風險。

**窄版決策：現在沒有一條 production 路徑應遷移。** 若提交後仍要長期降成本，第一個可做的實驗只應是「付費 Gemini 2.5 Flash-Lite、只處理非敏感的公開 WorldSignal 前處理」，並保持 OpenAI 負責最終 match／clarification；不得把私人內容送進 Gemini 免費層。

## 已確認現況

目前程式的文字模型為 `gpt-5.6-luna`，圖片模型為 `gpt-image-2`：

| Might 路徑 | 現在的 provider 工作 | 成熟度／備註 |
|---|---|---|
| Talk reply | OpenAI Agent 產生自然回覆 | 已有真實 production 證據 |
| Memory extraction | OpenAI Responses 產生結構化 memory candidates | 已有真實 production 證據；每次 Talk 另一次模型呼叫 |
| Firecrawl interpretation | Firecrawl 擷取後由 OpenAI 轉為結構化 WorldSignal | 已有真實開發環境證據 |
| Match／clarification | OpenAI 判斷 contextual overlap，必要時只問一次釐清 | 已有真實開發環境證據 |
| Pitch／inbound email interpretation | 規格指定走 OpenAI | 尚未完成完整 E2E，不應在此時再加入 provider 變因 |
| Companion text＋image | OpenAI 產生 art brief；`gpt-image-2` 產生 1024×1024 medium 圖 | 已有真實 production 證據 |

這代表目前不是「要不要為一個尚未開始的功能選便宜模型」，而是「要不要拆掉已經取得真實 sponsor 回執的路徑」。兩者風險不同。

## 官方能力與價格比較

以下價格皆為 2026-08-29 官方頁面所列的標準 API 價格；單位為每百萬 token，除非另有註明。

| 項目 | OpenAI GPT-5.6 Luna | Gemini 2.5 Flash-Lite | 對 Might 的意義 |
|---|---:|---:|---|
| 文字輸入 | US$0.20 | 免費層 US$0；付費 US$0.10 | Gemini 付費輸入便宜一半 |
| 文字輸出 | US$1.20 | 免費層 US$0；付費 US$0.40 | Gemini 付費輸出便宜約 67% |
| Context window | 1.05M | 1,048,576 | 都遠超 Might 單次需求 |
| Structured outputs | 支援 | 支援 | 不是遷移阻礙；Gemini 只支援 JSON Schema 子集，仍須做 client-side semantic validation |
| 免費 API tier | 不支援 | 支援，但模型／配額受限 | 免費不等於適合送入私人資料 |
| 免費層資料使用 | API 預設不拿來訓練，除非客戶主動 opt in | 可用於產品與 ML 改進，並可能人工審查 | Might 私人路徑不可用免費 Gemini |

來源：[GPT-5.6 Luna model／pricing／capabilities](https://developers.openai.com/api/docs/models/gpt-5.6-luna)、[OpenAI API pricing](https://developers.openai.com/api/docs/pricing)、[OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)、[Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)、[Gemini 2.5 Flash-Lite model](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite)、[Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)。

### 圖片不是免費替代

| 1024×1024 圖片 | 官方輸出價格／張 | 免費層 |
|---|---:|---|
| OpenAI `gpt-image-2`, medium | US$0.053 | 不支援 |
| Gemini 3.1 Flash Lite Image | 約 US$0.0336 | 不支援 |
| Gemini 2.5 Flash Image | 約 US$0.039 | 不支援；已列為 legacy |

因此「用 Gemini 免費層生成 companion 圖」目前不可行。付費 Gemini 3.1 Flash Lite Image 每張約省 **US$0.0194**，但需要第二個付費 provider，且 Google 付費層須先連結 billing；官方 billing 說明目前採預付額度，最低初始儲值為 **US$10**。Gemini 生成圖片另會包含 SynthID 浮水印。[OpenAI image generation pricing](https://developers.openai.com/api/docs/guides/image-generation)、[Gemini image pricing](https://ai.google.dev/gemini-api/docs/pricing)、[Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation)、[Gemini billing](https://ai.google.dev/gemini-api/docs/billing)。

## 資料使用與隱私

### OpenAI API

- 官方政策：API 輸入與輸出預設不會被拿去訓練或改進模型，除非客戶主動 opt in。
- 一般 abuse monitoring logs 最多保留 30 天；Responses API 的 application state 也可能依 endpoint／設定保留。Might 仍需避免把不必要的 private fields 放入 prompt，並依實際 endpoint 設定確認 retention。
- 這不是「零資料風險」，但和 Might 目前 private memory 的界線相容性較高。[OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)

### Gemini API

- **未付費服務：**輸入與輸出可用於改進 Google 產品與 ML 技術，也可能由人工審查。官方條款要求不要提交敏感、機密或個人資料。因此不適用於 Talk、living memory、clarification、pitch 或 inbound email。[Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- **付費服務：**官方定價與條款表示，prompt／response 不會用於改進產品；但 abuse monitoring 仍可能保留內容，官方 usage policy 說明最長可達 55 天，疑似濫用內容可能由人工檢視。[Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)、[Gemini abuse monitoring](https://ai.google.dev/gemini-api/docs/usage-policies)
- 結論：若未來採用 Gemini，Might 的私人路徑至少要用付費服務，並重新完成資料流、retention、logging 與供應商故障回復驗證。不能因為 model token 顯示 US$0，就把隱私成本視為零。

## Rate limits 與 demo 可靠性

- OpenAI 官方目前對 GPT-5.6 Luna 列出 Tier 1 為 500 RPM／500k TPM；`gpt-image-2` Tier 1 為 5 images/min。這遠高於 Might 三分鐘 demo 的序列呼叫量，但實際組織 tier 仍應在 dashboard 確認。[GPT-5.6 Luna rate limits](https://developers.openai.com/api/docs/models/gpt-5.6-luna)、[GPT Image 2 rate limits](https://developers.openai.com/api/docs/models/gpt-image-2)
- Gemini 官方把限制拆成 RPM、TPM、RPD，圖片另有 IPM；限制按 project 而非 API key 計算，免費與 preview 模型限制較嚴。官方頁也說實際限制會因模型、tier、帳戶而異，應以 AI Studio 顯示為準，不能把網路上的舊免費額度表當成 2026 保證。[Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- 對比賽現場而言，免費 Gemini 最大問題不是平均單價，而是**目前沒有可寫進驗收標準的固定免費配額保證**。Might 已有自己的 Convex quota／idempotency 護欄；更換 provider 仍需重跑負載、timeout、fallback 與錯誤文案。

## 各產品路徑的窄版建議

| 路徑 | 現在是否換 Gemini | 判斷 |
|---|---|---|
| Talk reply | **不換** | 是最直觀的 OpenAI 可見證據；只換此路徑每次 demo 約省不到 US$0.002。免費 Gemini 又不適合使用者可能輸入的私人資訊。 |
| Memory extraction | **必須保留 OpenAI** | living memory 是產品核心與私人資料；免費 Gemini 的資料使用條款不合適。雖然兩者都支援 structured outputs，遷移仍需重驗候選品質、來源綁定、confidence 與 fail-closed。 |
| Firecrawl interpretation | **賽前保留 OpenAI** | 原始資料多半公開，技術上是未來最容易 A/B 的路徑；但現在它正是「Firecrawl evidence 經 OpenAI 理解」的 sponsor 接力點，單次節省約 US$0.0016。 |
| Match／clarification | **必須保留 OpenAI** | 這裡把 private memory 與 public signal 結合，是最強的 OpenAI sponsor 證據；free tier 隱私不合適。 |
| Pitch | **必須保留 OpenAI** | 尚待完成；先做出同一條 OpenAI E2E，比在最後階段加入第二套 provider 更重要。Pitch 也會引用 private fields。 |
| Inbound email interpretation | **必須保留 OpenAI** | 郵件可能含個資、機密內容與第三方資料；不可進免費 Gemini。還必須先完成簽章、thread binding 與 idempotency。 |
| Webtoon art brief | **保留 OpenAI** | 成本幾乎可忽略，且和圖片 receipt 一起形成清楚的 OpenAI Manifestation 證據。 |
| Webtoon image | **保留 `gpt-image-2`** | Gemini 沒有免費圖片生成；付費價差每張只有約 US$0.0194。沿用已驗證的持久化 asset、quota 與 idempotency 比遷移更划算。 |

## Demo-scale 粗估

### 假設

一次全新三分鐘 E2E 包含：

- 1 次 art brief：1,200 input／300 output tokens。
- 3 輪 Talk reply＋3 次 memory extraction，合計 9,000 input／1,290 output。
- 1 次 WorldSignal interpretation：12,000 input／450 output。
- 1 次初次 match：2,500 input／350 output。
- 1 次 clarification rejudge：2,000 input／300 output。
- 1 次 pitch：2,000 input／350 output。
- 1 次 inbound interpretation：1,500 input／250 output。
- 1 張 1024×1024 圖，另估 500 text input tokens 給圖片模型。

文字合計為 **30,200 input／3,290 output tokens**。這是規劃估值，不是 provider receipt；實際 tokenization、reasoning／thinking tokens、重試與 prompt cache 都會改變結果。

### 計算

| 方案 | 文字 | 圖片＋圖片 prompt | 一次完整 demo | 100 次全新 demo |
|---|---:|---:|---:|---:|
| 現況：GPT-5.6 Luna＋GPT Image 2 medium | 約 US$0.0100 | 約 US$0.0555 | **約 US$0.0655** | 約 US$6.55 |
| 全付費 Gemini：2.5 Flash-Lite＋3.1 Flash Lite Image | 約 US$0.0043 | 約 US$0.0337 | **約 US$0.0380** | 約 US$3.80 |
| Gemini 免費文字＋付費 Gemini 圖片 | US$0 | 約 US$0.0337 | 約 US$0.0337 | 約 US$3.37，但私人內容與參賽證據不可接受 |

公式示例：OpenAI 文字約為 `30,200 × 0.20/M + 3,290 × 1.20/M = US$0.00999`；Gemini 付費文字約為 `30,200 × 0.10/M + 3,290 × 0.40/M = US$0.00434`。

更重要的是，companion asset 一旦成功生成並持久化，彩排可以重用而不重畫。**不重新生成圖片時，一次完整文字 E2E 的估值只有約 US$0.01。** 目前最有效的成本控制是保留 manifestation asset、限制重生、session quota、全域 quota、idempotency 與真實用量監控，不是更換模型供應商。

上述估算未含 Firecrawl、AgentMail、Convex、儲存、網路與失敗重試費用，也未宣稱為帳單保證。完成完整 E2E 後，應以 OpenAI usage metadata 與實際帳單回執替換估值。

## 最終決策與重評條件

### 提交前

- 保持 `gpt-5.6-luna` 與 `gpt-image-2`。
- 完成並錄下同一條 OpenAI 真實 E2E：Talk → Memory → Firecrawl signal → Match／Clarify → Consent → Pitch／Send → Inbound interpretation → Realtime Connected。
- 保留 provider request／response metadata、model 名稱、token usage、相關 Convex IDs 與錯誤回復證據。
- 以 quota、idempotency、持久化圖片及 demo fixture session 控成本；不要用免費 Gemini 接私人資料。

### 提交後才考慮

只有同時滿足下列條件才啟動 Gemini A/B：

1. OpenAI sponsor E2E 已公開部署、錄影並保存證據。
2. 使用**付費** Gemini project，完成資料政策與 retention 檢查。
3. 第一個實驗限定為公開 WorldSignal 的非敏感前處理，feature flag 預設關閉。
4. 用同一組真實但已去識別化的 evaluation set，比較 schema validity、語意品質、延遲、重試率與每成功任務成本。
5. Gemini 故障不會讓 consent、send、inbound 或 Connected fail open。

### 已確認、推論、未知

- **已確認：**Gemini 2.5 Flash-Lite 文字付費單價較低；免費層有不同資料使用條款；Gemini 圖片生成沒有免費層；Convex 官方評審要求 OpenAI 做真實工作。
- **合理推論：**Might 每次全新 demo 的 provider 成本低於 US$0.10，賽前遷移的工程與評審風險高於節省。
- **未知：**實際 production token usage、reasoning／thinking token 數、重試率、帳戶 tier 與 Gemini AI Studio 顯示的即時 quota。這些必須用 provider receipt／dashboard 驗證，不能由價目表推定。
