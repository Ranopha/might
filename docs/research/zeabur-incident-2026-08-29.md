# Zeabur 專案環境變數未授權存取事件

**調查截止：** 2026-08-29 13:30 UTC（台北時間 2026-08-29 21:30）  
**調查範圍：** 過去兩天的 Zeabur 官方狀態、官方文件，以及與官方目前所提 LiteLLM 線索直接相關的 GitHub Advisory。未以新聞、社群轉述或未經 Zeabur 確認的推測作結論。

## 結論先行

這是一宗仍在調查中的**環境變數機密外洩事件**，不是單純服務中斷。Zeabur 已確認有人未經授權取得一組內部服務憑證，並用它讀取專案環境變數紀錄。Zeabur 表示已在同一天撤銷該憑證、封鎖存取路徑並控制事件；但截至本報告截止時間，官方狀態仍為 `Degraded`，調查尚未結案。[Zeabur 事件頁](https://status.zeabur.com/incident/1037896)

受影響者的處置不是只改 Zeabur 密碼，而是要**撤銷並輪替暴露的 API key、資料庫密碼、JWT secret、私鑰等實際機密**，再檢查各供應商與資料庫的異常使用或費用。Zeabur 表示會直接通知受影響使用者，列出相關 project、service、environment 與建議輪替項目。[Zeabur 事件頁](https://status.zeabur.com/incident/1037896)

## 已確認時間線

| 台北時間（UTC+8） | UTC | 官方已確認事件 |
| --- | --- | --- |
| 2026-08-28 15:11 | 2026-08-28 07:11 | Zeabur 建立事件，確認未授權者取得內部服務憑證並讀取專案環境變數紀錄；同日撤銷受影響憑證、封鎖存取路徑並控制事件。 |
| 2026-08-29 01:42 | 2026-08-28 17:42 | Zeabur 更新：調查發現涉及其 AI Hub 所使用 LiteLLM 的可疑活動；官方仍在確認兩者是否相關，並預防性暫停 AI Hub。 |
| 2026-08-29 21:09 | 2026-08-29 13:09 | 官方總狀態頁仍顯示部分服務 `Degraded`；事件頁狀態亦未標為 resolved。 |

來源：[Zeabur 事件頁](https://status.zeabur.com/incident/1037896)、[Zeabur 官方狀態頁](https://status.zeabur.com/)。

官方狀態歷史在這個兩日視窗內只列出這一宗事件；不能從這點推論事件只影響某一地區或只有一個專案。[Zeabur incidents archive](https://status.zeabur.com/incidents)

## 已確認的影響範圍

Zeabur 已確認以下名稱的環境變數曾暴露：

- 通用機密：`ACCESS_TOKEN`、`API_SECRET`、`CLIENT_SECRET`、`PRIVATE_KEY`、`SECRET_KEY`
- 雲端與基礎設施：`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`CF_API_TOKEN`、`CLOUDFLARE_API_TOKEN`、`DIGITALOCEAN_TOKEN`、`LINODE_TOKEN`
- AI 供應商：`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`、`GOOGLE_API_KEY`、`OPENAI_API_KEY`、`OPENROUTER_API_KEY`
- 原始碼與支付：`GITHUB_PAT`、`GITHUB_TOKEN`、`STRIPE_PUBLISHABLE_KEY`、`STRIPE_SECRET_KEY`
- 資料庫與驗證：`DATABASE_URL`、`JWT_SECRET`、`MONGODB_URI`、`MYSQL_PASSWORD`、`POSTGRES_PASSWORD`、`REDIS_PASSWORD`

即使使用自訂變數名稱，只要值符合可辨識的 AWS、GitHub、Anthropic、OpenRouter、OpenAI 或 Stripe 憑證格式，Zeabur 也確認在暴露範圍內。因此，把 `OPENAI_API_KEY` 改名成別的名稱並不能視為保護措施。[Zeabur 事件頁](https://status.zeabur.com/incident/1037896)

官方事件頁的 affected service 欄位標為 Dashboard，但官方同時明確說被讀取的是 project environment variable records。不能把這解讀成「只有 dashboard 畫面受影響」，也不能據此判定只有某個運算區域受影響。[Zeabur 事件頁](https://status.zeabur.com/incident/1037896)

Zeabur 目前表示**尚未發現證據**顯示 Zeabur 帳號憑證、個人資訊、伺服器資料、付款資訊或信用卡資料被存取。這是截至目前的調查結果，不等於已證明這些資料絕對未受影響，因為官方同一段也明示調查仍在進行。[Zeabur 事件頁](https://status.zeabur.com/incident/1037896)

## 技術根因：已確認與仍未知

### 已確認

- 直接存取媒介是一組被未授權取得的 Zeabur 內部服務憑證。
- 該憑證被用來讀取 project environment variable records。
- Zeabur 已撤銷憑證並封鎖該存取路徑。
- 調查另發現 AI Hub 所使用 LiteLLM 有可疑活動；AI Hub 已預防性暫停。

以上均來自 [Zeabur 事件頁](https://status.zeabur.com/incident/1037896)。

### 仍未知，不能先下結論

Zeabur 尚未公開：

- 內部憑證最初如何被取得；
- 未授權存取的起訖時間與完整日誌回溯範圍；
- 受影響帳號、專案、服務或 environment 的總數與區域分布；
- 被讀取的紀錄是否全部被帶走、保存或後續使用；
- 攻擊者身分；
- LiteLLM 可疑活動的版本、部署形式、指標，以及它是否就是此事件的入口或僅是旁支線索；
- 完整根因分析、永久修復與後續稽核結果。

GitHub 官方 Advisory 另確認，LiteLLM 的 PyPI `1.82.7` 與 `1.82.8` 曾包含會外傳機密的惡意程式碼。[GitHub Advisory GHSA-92x9-889m-jgmw](https://github.com/advisories/GHSA-92x9-889m-jgmw) 這可解釋為何 LiteLLM 線索值得嚴肅調查，**但 Zeabur 尚未說明其使用版本，也尚未確認該供應鏈事件與本次外洩有因果關係**。因此目前不能把「LiteLLM 供應鏈攻擊」寫成 Zeabur 事件的既定根因。

## 使用者現在應做什麼

### Zeabur 已明確要求

如果收到 Zeabur 受影響通知：

1. 依通知列出的 project、service、environment 盤點所有機密。
2. 立即撤銷並替換官方列出的憑證，不只是修改變數名稱。
3. 檢查相關資料庫與第三方供應商是否有異常存取、用量或費用。

來源：[Zeabur 事件頁](https://status.zeabur.com/incident/1037896)。

### 保守而可回復的執行順序

以下是依官方輪替要求整理的安全執行順序，屬於防禦性建議，不是 Zeabur 已公布的新調查事實：

1. **先列清單，不輸出 secret 值。** 記錄每個 Zeabur environment 曾持有的 key 名稱、供應商、權限與所屬服務。
2. **先建立替代憑證，再切換服務。** 更新服務、確認健康後，立即撤銷舊憑證；避免只新增 key 卻讓舊 key 持續有效。
3. **資料庫密碼／URL 要連同資料庫端輪替。** 只改 Zeabur 變數而不改資料庫端憑證，舊連線字串仍可被使用。
4. **輪替 JWT／session secret 時預期現有登入失效。** 先規劃使用者重新登入與回退方式。
5. **檢查供應商稽核紀錄。** 包含 OpenAI/Anthropic/Google 用量、GitHub token activity、雲端 audit log、Stripe activity、資料庫登入／查詢紀錄與異常費用。
6. **不要自行猜測檢查起點。** Zeabur 尚未公布未授權存取的完整時間窗，應先依可取得的最長合理 retention 檢查，並在官方更新後補做精確回溯。
7. **保留輪替證據。** 記錄舊憑證撤銷時間、新憑證生效時間、服務驗證結果與觀察到的異常，但不要把 secret 寫入 ticket、Git 或公開文件。

若曾在 Zeabur 儲存機密但尚未收到明確通知，不應只靠「沒有收到信」推定未受影響。可透過官方 Support 提供 projectID、serviceID、environment／deployment context，要求確認是否在受影響清單；官方建議優先使用 Support ticket。[Zeabur Support 文件](https://zeabur.com/docs/en-US/get-started/faq-support/help)

## 對任何專案的快速判定矩陣

| 狀況 | 直接風險判定 | 建議 |
| --- | --- | --- |
| 專案從未部署到 Zeabur，secret 也從未放入 Zeabur | 沒有從本事件直接讀取該專案 secret 的已知路徑 | 仍檢查是否與其他 Zeabur 專案共用同一組 key；如有共用，按受影響 key 處理。 |
| 曾部署 Zeabur，但只放非機密設定 | 需要核對實際變數；不能只看變數名稱 | 檢查是否存在可辨識 credential 值或由其他 service 暴露的資料庫連線。 |
| 曾在 Zeabur 放 OpenAI、GitHub、雲端、Stripe 或資料庫憑證 | 與官方確認範圍直接重疊 | 收到通知時立即輪替；未收到但範圍不明時向 Support 確認，並評估先行輪替高權限 key。 |
| 同一 secret 也用於 Convex、CI、其他雲端或本機 | 即使另一平台未被入侵，重用的 secret 仍可能讓攻擊者進入該平台 | 在 secret 的發行端撤銷舊值，更新所有使用端，逐一驗證。 |

## 後續應持續追蹤

- [Zeabur 事件頁](https://status.zeabur.com/incident/1037896)：是否轉為 resolved、是否新增時間窗、受影響規模、RCA 與輪替範圍。
- [Zeabur 官方狀態頁](https://status.zeabur.com/)：AI Hub 是否恢復以及 degraded 狀態是否解除。
- Zeabur 直接寄送的 account/project-specific notification：它比公開頁面更能判定個別 project 是否受影響。
- 如通知與實際環境不一致，透過 [Zeabur Support](https://zeabur.com/docs/en-US/get-started/faq-support/help) 以 project/service identifiers 查證；不要在 ticket 中貼上 secret 值。

## 證據界線

- **已確認：** 內部服務憑證遭未授權使用、環境變數紀錄被讀取、列出的 key 名稱與可辨識格式暴露、同日控制措施、AI Hub 預防性暫停。
- **合理防禦推論：** 被讀取的可用憑證應視為已暴露並在發行端撤銷；共用同一 secret 的其他平台也須同步更新。
- **未知：** 完整根因、LiteLLM 是否為因果路徑、受影響專案總量、讀取起訖時間、資料是否被後續濫用，以及個別未收到通知的帳號是否確實不受影響。

