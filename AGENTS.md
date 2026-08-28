# Might Codex 工作憲法

本文件適用於 `/Users/liuenyan/Might` 全部工作。它保存長期有效的產品、比賽與工程規則；當期進度與證據寫入根目錄 [`hackathon.md`](hackathon.md) 及 `docs/worklogs/`。

## 專案狀態與授權

- Might 是 2026-08-28 啟動的全新 Convex All Gas Hackathon 專案，狀態為 `ACTIVE`。
- 使用者已授權在本 repository 內實作、安裝必要依賴、建立 Convex 開發／部署資源、commit、push、建立公開 GitHub repository，並部署公開 `convex.site`。
- 對外寄信仍受產品內逐次同意約束；施工授權不等於替使用者按下寄信同意。
- 付費升級、不可逆 Git 歷史改寫、刪除遠端資產、改變 owner／license、正式社群貼文與最終參賽提交，仍需該動作的明確授權。

## 每輪開工必讀

1. 完整閱讀 [`Might_Hackathon_Spec_v0.1.md`](Might_Hackathon_Spec_v0.1.md)。
2. 閱讀本 `AGENTS.md`。
3. 閱讀 `hackathon.md` 與最近一份 `docs/worklogs/`，以目前 code、runtime、Convex data、外部服務回執及瀏覽器實測判定現況。
4. 進行比賽合規、Sponsor 整合、公開部署、影片、社群或提交工作前，完整閱讀 [`docs/research/all-gas-hackathon-rules.md`](docs/research/all-gas-hackathon-rules.md)。

## 唯一產品主線

只建構並打磨：

`Talk → Remember → Notice → Match → Consent → Contact → Reply → Connected`

實際 demo 必須由預設動畫光球開始，經 OpenAI 生成原創 Webtoon-style companion，再完成自然對話、Convex living memory、Firecrawl 公開訊號、OpenAI 情境推理與釐清、同意後 AgentMail 寄信、真實回信，以及 Convex 即時狀態更新。

每次新增工作先問：它是否直接提升三分鐘 demo、Sponsor 評分、主線可靠性或視覺品質？答案為否就不做。主線可重複可靠運作後停止加功能，只做 polish、驗證與提交。

## 官方參賽硬門檻

- 保留證據證明 app 與 repository 在官方 2026-08-25 12:00 PM PT 起算點之後建立。
- Convex 是真實 backend；必須展示 queries、mutations、actions、live updates 與適用的官方 components。
- OpenAI、Firecrawl、AgentMail 必須在產品主線做真實工作。安裝套件、fixture、logo、README 敘述或假資料都不是整合證據。
- GitHub repository 必須維持 public，且不得包含 secret 或私人資料。
- 公開 app 必須部署於無需邀請即可開啟的 `https://*.convex.site` 或 `chatgpt.site`；本專案選擇 `convex.site`。
- 根目錄持續維護 `hackathon.md`；每個 meaningful work session 後執行 `/hackathon`，只記錄有 code、Git、runtime 或外部回執支持的事實。
- 最終影片嚴格小於三分鐘，以產品操作為主；目標上限 2:50。
- 提交前完成 X 或 LinkedIn 公開分享並標註 `@convex`、`@OpenAI`、`@firecrawl`、`@agentmail`。
- 在官方 Sep 22 12:00 PM PT 截止前，透過指定 Vibe Apps 表單提交 public repo、live URL、build log 與 video；最後再以登出瀏覽器人工驗證全部連結。

## 真實性與成熟度

所有狀態使用以下成熟度，不得跳級：

`規格 → 已實作 → 本機已驗證 → 真實整合已驗證 → 公開部署已驗證 → 完整 E2E 已驗收`

- UI 出現、build 通過、Convex table 存在或套件已安裝，都不等於 Sponsor E2E。
- 最終證據鏈必須連結：conversation/message IDs、memory IDs、Firecrawl source URL/result、OpenAI result metadata、match/consent record、AgentMail message/thread IDs、inbound event ID、Convex connection transitions 與瀏覽器 live update。
- Cache 只能重播先前真實成功且可追溯的輸出；畫面必須如實區分 live、cached 與 seeded。
- 已確認、合理推論、未知與阻擋事項分開記錄；沒有證據就標示未驗證。

## 隱私、同意與對外動作

- Memory 預設 private，只能在目前匿名 session／使用者範圍內讀取；禁止跨瀏覽器共用同一個 demo user dataset。
- AI 只能提出 memory candidate。使用者可確認、修正或忘記；推論需保留來源訊息與 confidence。
- 對外分享前顯示收件人、完整正文、引用的 memory 與 private fields；只有本次 payload 的明確 `Send` approval 才能寄出。
- Approval 必須綁定 payload hash、connection、recipient、timestamp 與 idempotency key。修改正文或收件人後，舊 approval 失效。
- AgentMail inbound webhook 必須驗證簽章、保留 event ID、冪等處理並綁定既有 thread；未知或不一致事件 fail closed。
- `Connected` 只代表雙向聯絡已建立，不代表成交、付款、價格、法律協議或確定排程。

## 產品與視覺品質

- 四個 primary surfaces 固定為 Talk、Me、Might Found、Connections；不得新增 Dashboard、Marketplace、Feed、Résumé 或技能分類介面。
- UI 應像精緻消費產品與 Webtoon 故事介面：低密度、強排版、留白、克制的玻璃／光暈、情緒性 motion；禁止企業後台感與 generic AI dashboard。
- 初始形態是柔和動畫光球。生成夥伴必須為原創、非寫實、Webtoon-style；著名 IP 輸入只保留情緒與氛圍，不保留可辨識角色、logo 或服裝設計。
- Motion、audio、loading、error、empty、reduced-motion、mute 與 mobile behavior 都是驗收範圍。

## 架構與測試 seams

使用 deep modules：複雜行為藏在小 interface 後，UI 與 tests 穿過相同 seam。外部 provider 只有在需要真實 adapter 與 deterministic test adapter 時才建立 seam。

固定驗證以下五個公開行為 seams：

1. **Manifestation**：description 產生 IP-original art brief 與持久化 asset；失敗時仍可使用 orb。
2. **Talk → Memory**：訊息持久化後，只有有意義且有來源的 candidate 進入 living memory，Me 以 live query 更新。
3. **WorldSignal → Match**：真實 Firecrawl evidence 經 OpenAI 解讀後形成 WorldSignal、contextual overlap 與最多一個 clarification。
4. **Consent → Outbound**：沒有目前 payload 的有效 approval 時寄送數必須為零；有效 approval 只產生一次 AgentMail send。
5. **Inbound → Realtime State**：已驗證且屬於既有 thread 的新 event 只處理一次，將 `CONTACTED → REPLIED`，UI 無刷新更新。

每次採單一 tracer bullet 執行 red → green；測 behavior，不測 private implementation。Core state machine、consent policy、payload hash 與 webhook idempotency 優先 deterministic；Sponsor runtime 另外做真實 integration verification，不以 mock 冒充。

## Convex 與路由硬規則

- Schema 保留 source、timestamps、confidence、privacy、status history、external IDs、idempotency 與 trace fields。
- Sponsor secrets 只設於 Convex environment 或本機 ignored env；client bundle、Git、log、screenshot 與 `hackathon.md` 不得出現 secret。
- Convex Static Hosting 預設擁有 `/` 並把 app HTTP routes 放到 `/api`。在設定 AgentMail callback 前先拍板 route topology；callback URL 一經外部登錄不得未驗證就改動。
- Actions 處理 OpenAI、Firecrawl、AgentMail；queries/mutations 保持 deterministic。外部 side effect 需先建立 intent／approval record，再執行，最後保存 provider receipt 或 failure。

## 每個工作 session 的完成流程

1. 檢查 `git status --short --branch` 與本輪 diff。
2. 執行與風險相稱的 lint、typecheck、tests、build、Convex codegen／deploy 與必要 browser E2E。
3. 檢查 secrets、私人資料、未授權資產及不應提交的生成物。
4. 更新 `docs/worklogs/YYYY-MM-DD.md`，記錄授權、變更、命令、驗證、外部影響、回退、未知與下一步。
5. 執行 `/hackathon` 更新根目錄 build log；若命令不可用，明確記錄阻擋，不得假稱已執行。
6. 一個 meaningful、deployable slice 對應一個可理解 commit；驗證通過後 push `main`，保持 public remote 可接手。

## 完成定義

只有同一條真實 E2E 可重複完成 Manifestation、Memory、Firecrawl signal、OpenAI match、clarification、consent、AgentMail outbound/inbound、Convex realtime reply 與 Connected，且 public URL、public repo、`hackathon.md`、影片與提交檢查全部通過，才能稱為 hackathon build 完成。

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
