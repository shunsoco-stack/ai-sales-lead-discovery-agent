# Production QA

この文書は、同一のVercel Production deploymentに対して行った検証を記録します。

## Release Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`（28/28 passed）
- [x] `npm run build`
- [x] Production HTTP / security headers
- [x] Desktop 1440 × 1000 input viewport（PNG実寸 1425 × 990）
- [x] Mobile 390 × 844
- [x] Console error 0件
- [x] Goal → Plan → Human Approval → Discovery → Research → Draft → Review → Copy
- [x] 外部送信Actionが存在しない
- [x] 5 screenshots from the same Production deployment
- [x] Gitleaks directory / staged / history scan

## Production Evidence

| 項目 | 値 |
| --- | --- |
| Production URL | https://ai-sales-lead-discovery-agent.vercel.app |
| Deployment URL | https://ai-sales-lead-discovery-agent-aowpf2bgi.vercel.app |
| Deployment ID | `dpl_FFAjW4T85pv1783jXNa43Dv1i2Wn` |
| 検証・撮影日時 | 2026-08-25 01:11〜01:13 JST |
| Git commit | `fb110cefa0f464e81ab11cfd121064d9a3a22e29` |

## Browser Checks

| Flow | Expected | Result |
| --- | --- | --- |
| ICP / Goal | 3 Demo、ICP 8条件、Guardrail 4上限が編集できる | Pass |
| Agent Plan | Discovery前にPlanを表示し、人の承認を要求する | Pass（Lead Board disabled） |
| Lead Board | PriorityとLead Stageを分けて表示する | Pass（High 2 / Medium 1） |
| Company Research | 企業情報、公開Observation、Evidence、課題仮説を表示する | Pass |
| Approach Draft | Human Review確認後だけCopyできる | Pass（Review前 disabled / 後 enabled） |
| Activity Log | 検索、調査、評価、除外、優先理由を時系列表示する | Pass（固定DatasetのためTRACE表示） |
| Console | error / warningがない | Pass（0件） |

## Security Checks

| Check | Expected | Result |
| --- | --- | --- |
| Prompt Injection | Web文章をUntrusted Dataとして隔離 | Pass（自動テスト） |
| SSRF | localhost/private/metadata/IPv4-mapped IPv6/unsafe URLを拒否 | Pass（自動テスト） |
| CSP | frame-ancestors none、base-uri self、form-action self、Productionでunsafe-evalなし | Pass（Production response） |
| Secrets | Gitleaks finding 0 | Pass（directory / staged / history） |

## Screenshot Artifacts

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `01-icp-goal.png` | 99,319 | `A2D982F47554E3051D0554F1E78DFA4B1D190CCED816ED609DA576A281DF4C9D` |
| `02-agent-plan.png` | 96,714 | `7F8A2B1CECBFB81E505485C3972B35C23D890F52D47C5CE8D2FB0AC80DCDAB17` |
| `03-lead-candidates.png` | 130,018 | `738E2A45D958FE7E945EE9A7E7CDAC09830EAF601F0EC9864577542A9CC9AD89` |
| `04-company-research-evidence.png` | 144,818 | `F93147974761BC4A29A84ACD38513804BF9F9E564D383D23905A9F8C57DA0595` |
| `05-approach-draft.png` | 153,972 | `B450A703271ED93B2577E6E1393B080D138E6E9A37F0D91E0CE71A0DAB6F1E3E` |
