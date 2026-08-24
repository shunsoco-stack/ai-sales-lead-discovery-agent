import { createIcp } from "./icp";
import type {
  ChallengeHypothesis,
  DemoScenario,
  DemoScenarioId,
  EvidenceSourceType,
  EvidenceTopic,
  ObservedCount,
  PublicEvidence,
} from "./types";

const CHECKED_AT = "2026-08-25";

function source(
  id: string,
  title: string,
  url: string,
  sourceType: EvidenceSourceType,
  summary: string,
  supports: readonly EvidenceTopic[],
): PublicEvidence {
  return { id, title, url, sourceType, summary, supports, checkedAt: CHECKED_AT };
}

function hypothesis(
  id: string,
  statement: string,
  rationale: string,
  tags: readonly string[],
  evidenceIds: readonly string[],
): ChallengeHypothesis {
  return {
    id,
    label: "課題仮説",
    statement,
    rationale,
    tags,
    evidenceIds,
  };
}

function exactCount(
  value: number,
  label: string,
  evidenceIds: readonly string[],
): ObservedCount {
  return { value, confidence: "exact", label, evidenceIds };
}

const beautySalonScenario: DemoScenario = {
  id: "beauty-salon-saas",
  title: "美容室向けSaaS",
  prompt: "東京都内の美容室向けに、予約・顧客カルテ・店舗分析を一体化するSaaSを販売したい",
  goal: {
    statement:
      "東京都内の美容室向けに、予約・顧客カルテ・店舗分析を一体化するSaaSを販売する",
    offerName: "美容室向け予約・顧客カルテ・店舗分析SaaS",
    valueProposition: "予約・顧客カルテ・店舗分析を一体化し、店舗ごとの運用と顧客対応を一か所で把握できる",
    desiredOutcome: "予約・顧客管理と店舗分析の効率化",
  },
  icp: createIcp({
    industries: ["美容室"],
    regions: ["東京都"],
    employeeCount: null,
    storeCount: { min: 10 },
    websiteRequirement: "required",
    serviceUsage: { required: [], excluded: [] },
    challenges: [
      "予約運用の効率化",
      "顧客カルテの一元化",
      "店舗分析の可視化",
    ],
    exclusionConditions: ["単店舗のみ"],
  }),
  candidates: [
    {
      id: "salon-unix",
      companyName: "株式会社ユニックス",
      industry: "美容室運営",
      url: "https://www.unix.co.jp/company/",
      location: "東京都・埼玉県・神奈川県・千葉県",
      businessSummary: "首都圏で美容室を運営する企業。",
      hasWebsite: true,
      employeeCount: exactCount(250, "公式会社情報のスタッフ数", [
        "unix-company",
      ]),
      storeCount: exactCount(20, "公式会社情報の店舗数", ["unix-company"]),
      observedServices: ["公式サロン一覧"],
      exclusionTags: ["複数店舗"],
      evidence: [
        source(
          "unix-company",
          "UNIX 会社概要",
          "https://www.unix.co.jp/company/",
          "official-company",
          "美容室運営、東京・埼玉・神奈川・千葉の20店舗、スタッフ250名を会社情報に掲載しています。",
          [
            "industry",
            "location",
            "scale",
            "business",
            "challenge-hypothesis",
          ],
        ),
        source(
          "unix-salons",
          "UNIX サロン一覧",
          "https://www.unix.co.jp/salon/",
          "official-store-list",
          "地域別の公式サロン一覧を公開しています。",
          ["location", "service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "unix-hypothesis-multi-store",
          "20店舗の予約情報と顧客対応履歴を横断して把握する際、一元化の余地がある可能性があります。",
          "公式会社情報の店舗数と地域別サロン一覧から、複数拠点で予約・顧客対応の運用が発生すると推論しました。現行システムを断定するものではありません。",
          ["予約運用の効率化", "顧客カルテの一元化"],
          ["unix-company", "unix-salons"],
        ),
        hypothesis(
          "unix-hypothesis-performance",
          "店舗ごとの集客施策を比較し、改善箇所を把握する余地がある可能性があります。",
          "20店舗を複数県で展開している公開事実を、店舗別可視化との関連性として評価しました。",
          ["店舗分析の可視化"],
          ["unix-company", "unix-salons"],
        ),
      ],
    },
    {
      id: "salon-earth",
      companyName: "株式会社アースホールディングス",
      industry: "美容室運営",
      url: "https://hairmake-earth.com/about-us/",
      location: "東京都を含む全国",
      businessSummary: "HAIR & MAKE EARTHを全国展開する美容室運営企業。",
      hasWebsite: true,
      storeCount: exactCount(258, "公式店舗検索の掲載総数（確認時点）", [
        "earth-tokyo-map",
      ]),
      observedServices: ["公式店舗検索", "メニュー情報"],
      exclusionTags: ["複数店舗", "全国展開"],
      evidence: [
        source(
          "earth-about",
          "EARTH 私たちについて",
          "https://hairmake-earth.com/about-us/",
          "official-company",
          "220店舗以上の美容室展開を公式ページで説明しています。",
          ["industry", "scale", "business", "challenge-hypothesis"],
        ),
        source(
          "earth-tokyo-map",
          "EARTH 東京都のサロン検索",
          "https://map.hairmake-earth.com/salon/area/tokyo",
          "official-store-list",
          "確認時点の公式店舗検索で東京都45店舗、全体258店舗が表示されています。",
          ["location", "scale", "service", "challenge-hypothesis"],
        ),
        source(
          "earth-menu",
          "EARTH メニュー情報",
          "https://hairmake-earth.com/menu-info/",
          "official-service",
          "公式サイトで複数の美容メニューとサービス情報を案内しています。",
          ["business", "service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "earth-hypothesis-information",
          "全国の多数店舗で予約情報と顧客対応を扱う際、一元化と運用効率を両立する余地がある可能性があります。",
          "公式サイトの店舗規模と店舗検索を根拠にした推論です。",
          ["予約運用の効率化", "顧客カルテの一元化"],
          ["earth-about", "earth-tokyo-map"],
        ),
        hypothesis(
          "earth-hypothesis-menu",
          "多様なメニューを店舗・顧客層に合わせて訴求し、反応を比較する余地がある可能性があります。",
          "公式メニュー情報と多店舗展開の組み合わせから推論しました。",
          ["店舗分析の可視化"],
          ["earth-menu", "earth-tokyo-map"],
        ),
      ],
    },
    {
      id: "salon-kenje",
      companyName: "株式会社ケンジ",
      industry: "美容室運営",
      url: "https://kenje-group.co.jp/company/",
      location: "神奈川県・東京都ほか",
      businessSummary: "複数ブランド・複数拠点の美容室事業を展開する企業。",
      hasWebsite: true,
      employeeCount: exactCount(1262, "公式会社概要のスタッフ数", [
        "kenje-company",
      ]),
      observedServices: ["公式サロン一覧"],
      exclusionTags: ["複数拠点"],
      evidence: [
        source(
          "kenje-company",
          "KENJE GROUP 会社概要",
          "https://kenje-group.co.jp/company/",
          "official-company",
          "181オフィス、スタッフ1,262名を公式会社概要に掲載しています。オフィス数を店舗数とはみなしません。",
          ["industry", "scale", "business", "challenge-hypothesis"],
        ),
        source(
          "kenje-salons",
          "KENJE GROUP サロン一覧",
          "https://kenje-group.co.jp/salon/",
          "official-store-list",
          "神奈川県・東京都などの公式サロン情報を公開しています。",
          ["location", "service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "kenje-hypothesis-information",
          "多数の拠点・ブランドで予約情報と顧客対応履歴を扱う際、一元化の余地がある可能性があります。",
          "公式会社概要の拠点規模とサロン一覧から推論しました。",
          ["予約運用の効率化", "顧客カルテの一元化"],
          ["kenje-company", "kenje-salons"],
        ),
        hypothesis(
          "kenje-hypothesis-performance",
          "ブランドやサロン単位の集客状況を横断比較する余地がある可能性があります。",
          "複数ブランド・複数地域の公開サロン構成から推論しました。",
          ["店舗分析の可視化"],
          ["kenje-company", "kenje-salons"],
        ),
      ],
    },
  ],
};

const restaurantScenario: DemoScenario = {
  id: "restaurant-operations",
  title: "飲食店向け業務システム",
  prompt: "複数業態・多店舗を運営する飲食企業へ、店舗業務システムを提案したい",
  goal: {
    statement: "複数業態・多店舗を運営する飲食企業へ、店舗業務システムを提案する",
    offerName: "飲食店向け業務システム",
    valueProposition: "店舗・ブランドをまたぐ業務情報と進捗を一か所で共有できる",
    desiredOutcome: "多店舗オペレーションの標準化",
  },
  icp: createIcp({
    industries: ["飲食店運営"],
    regions: ["全国"],
    employeeCount: null,
    storeCount: { min: 20 },
    websiteRequirement: "required",
    serviceUsage: { required: [], excluded: [] },
    challenges: [
      "多店舗オペレーション標準化",
      "施設別情報管理",
      "事業横断データ連携",
    ],
    exclusionConditions: ["単店舗のみ"],
  }),
  candidates: [
    {
      id: "restaurant-dynac",
      companyName: "株式会社ダイナック",
      industry: "飲食店運営",
      url: "https://www.dynac.co.jp/about/company.html",
      location: "全国の商業施設・ゴルフ場ほか",
      businessSummary: "多業態の飲食店舗を施設横断で運営する企業。",
      hasWebsite: true,
      employeeCount: exactCount(891, "公式会社概要の従業員数", [
        "dynac-company",
      ]),
      storeCount: exactCount(214, "公式会社概要の店舗数", [
        "dynac-company",
      ]),
      observedServices: ["施設別ブランド一覧", "複数飲食業態"],
      exclusionTags: ["多店舗", "複数業態"],
      evidence: [
        source(
          "dynac-company",
          "ダイナック 会社概要",
          "https://www.dynac.co.jp/about/company.html",
          "official-company",
          "214店舗、従業員891名、複数形態の飲食事業を公式会社概要に掲載しています。",
          ["industry", "location", "scale", "business", "challenge-hypothesis"],
        ),
        source(
          "dynac-facilities",
          "ダイナック 施設別ブランド",
          "https://www.dynac.co.jp/brands/facility.html",
          "official-service",
          "商業施設・ゴルフ場など施設別にブランド情報を公開しています。",
          ["location", "service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "dynac-hypothesis-standardization",
          "214店舗・複数業態の業務手順を揃えながら、業態ごとの差分を管理する余地がある可能性があります。",
          "公式会社概要に掲載された店舗規模と複数形態の事業から推論しました。",
          ["多店舗オペレーション標準化"],
          ["dynac-company"],
        ),
        hypothesis(
          "dynac-hypothesis-facilities",
          "施設種別ごとの連絡・運用情報をまとめる余地がある可能性があります。",
          "公式の施設別ブランド構成から推論しました。",
          ["施設別情報管理"],
          ["dynac-facilities"],
        ),
      ],
    },
    {
      id: "restaurant-ap",
      companyName: "株式会社エー・ピーホールディングス",
      industry: "飲食店運営",
      url: "https://ap-holdings.jp/about/company/",
      location: "全国",
      businessSummary: "飲食店運営と食品小売などを展開する企業。",
      hasWebsite: true,
      storeCount: exactCount(161, "公式会社情報の店舗数", ["ap-company"]),
      observedServices: ["公式店舗検索", "食品小売", "飲食店運営"],
      exclusionTags: ["多店舗", "複数事業"],
      evidence: [
        source(
          "ap-company",
          "AP HOLDINGS 会社概要",
          "https://ap-holdings.jp/about/company/",
          "official-company",
          "161店舗と、飲食店運営・食品小売などの事業を公式会社情報に掲載しています。",
          ["industry", "location", "scale", "business", "challenge-hypothesis"],
        ),
        source(
          "ap-shops",
          "AP HOLDINGS 店舗検索",
          "https://shop.ap-holdings.jp/",
          "official-store-list",
          "ブランド・エリアなどから探せる公式店舗検索を公開しています。",
          ["location", "service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "ap-hypothesis-standardization",
          "161店舗の運用ルールや連絡を標準化し、ブランド差分を管理する余地がある可能性があります。",
          "公式会社情報の店舗数と公式店舗検索から推論しました。",
          ["多店舗オペレーション標準化"],
          ["ap-company", "ap-shops"],
        ),
        hypothesis(
          "ap-hypothesis-cross-business",
          "飲食店運営と食品小売をまたぐ情報連携を整理する余地がある可能性があります。",
          "公式会社情報に掲載された複数事業から推論しました。",
          ["事業横断データ連携"],
          ["ap-company"],
        ),
      ],
    },
    {
      id: "restaurant-zetton",
      companyName: "株式会社ゼットン",
      industry: "飲食店運営",
      url: "https://www.zetton.co.jp/about/company",
      location: "国内外",
      businessSummary: "複数ブランドの飲食事業と空間・地域プロジェクトを展開する企業。",
      hasWebsite: true,
      observedServices: ["複数飲食ブランド", "プロジェクト事業"],
      exclusionTags: ["複数ブランド"],
      evidence: [
        source(
          "zetton-company",
          "zetton 会社概要",
          "https://www.zetton.co.jp/about/company",
          "official-company",
          "飲食店運営を行う企業の基本情報を公式ページで公開しています。",
          ["industry", "location", "business", "challenge-hypothesis"],
        ),
        source(
          "zetton-business",
          "zetton 事業内容",
          "https://www.zetton.co.jp/business",
          "official-service",
          "複数ブランドの飲食事業とプロジェクトを公式ページで紹介しています。現在の店舗数は当該ページから確認できません。",
          ["business", "service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "zetton-hypothesis-standardization",
          "複数ブランド間で共通業務を揃えつつ、ブランド固有運用を残す余地がある可能性があります。",
          "公式事業ページの複数ブランド構成から推論しました。",
          ["多店舗オペレーション標準化"],
          ["zetton-business"],
        ),
        hypothesis(
          "zetton-hypothesis-cross-business",
          "飲食事業とプロジェクトの情報を横断して共有する余地がある可能性があります。",
          "公式事業ページの事業構成から推論しました。",
          ["事業横断データ連携"],
          ["zetton-business"],
        ),
      ],
    },
  ],
};

const dartsScenario: DemoScenario = {
  id: "darts-store-web",
  title: "ダーツ店舗向けWebサービス",
  prompt: "ダーツ店舗へ大会運営・イベント集客Webサービスを提案したい",
  goal: {
    statement: "複数店舗を運営するダーツ店舗へ、大会運営・イベント集客Webサービスを提案する",
    offerName: "ダーツ大会運営Webサービス",
    valueProposition: "大会告知・参加受付・進行情報をWebでまとめ、店舗と参加者の確認負荷を減らせる",
    desiredOutcome: "大会運営とイベント集客の効率化",
  },
  icp: createIcp({
    industries: ["ダーツ店舗"],
    regions: ["全国"],
    employeeCount: null,
    storeCount: { min: 10 },
    websiteRequirement: "required",
    serviceUsage: { required: [], excluded: [] },
    challenges: [
      "大会運営の省力化",
      "イベント集客",
      "複数店舗の大会情報管理",
    ],
    exclusionConditions: ["ダーツ設備なし"],
  }),
  candidates: [
    {
      id: "darts-up",
      companyName: "株式会社FLECHA",
      industry: "ダーツ店舗運営",
      url: "https://dartsup.co.jp/about",
      location: "全国",
      businessSummary: "Darts UPブランドの店舗運営と大会・イベント企画を行う企業。",
      hasWebsite: true,
      storeCount: exactCount(68, "直営64店とFC4店の合計", ["darts-up-about"]),
      observedServices: ["大会・イベント企画", "公式店舗一覧", "公式イベント情報"],
      exclusionTags: ["複数店舗", "ダーツ設備あり"],
      evidence: [
        source(
          "darts-up-about",
          "Darts UP 会社情報",
          "https://dartsup.co.jp/about",
          "official-company",
          "直営64店舗・FC4店舗と、大会・イベント企画を公式会社情報に掲載しています。",
          ["industry", "location", "scale", "business", "challenge-hypothesis"],
        ),
        source(
          "darts-up-store",
          "Darts UP 店舗一覧",
          "https://dartsup.co.jp/store",
          "official-store-list",
          "地域別の公式店舗一覧を公開しています。",
          ["location", "service", "challenge-hypothesis"],
        ),
        source(
          "darts-up-event",
          "Darts UP イベント情報",
          "https://dartsup.co.jp/event",
          "official-event",
          "大会・イベント情報を公式ページで公開しています。",
          ["service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "darts-up-hypothesis-operations",
          "複数店舗の大会受付・参加者連絡・進行情報を揃える作業を省力化できる可能性があります。",
          "公式会社情報の店舗規模・大会企画と公式イベントページから推論しました。",
          ["大会運営の省力化", "複数店舗の大会情報管理"],
          ["darts-up-about", "darts-up-event"],
        ),
        hypothesis(
          "darts-up-hypothesis-acquisition",
          "店舗別イベント情報の見つけやすさと参加導線を改善する余地がある可能性があります。",
          "公式店舗一覧とイベントページがそれぞれ公開されている事実から推論しました。",
          ["イベント集客"],
          ["darts-up-store", "darts-up-event"],
        ),
      ],
    },
    {
      id: "darts-bagus",
      companyName: "株式会社バグース",
      industry: "ダーツ店舗運営",
      url: "https://www.bagus-99.com/darts/",
      location: "全国",
      businessSummary: "多数のダーツ台を備えるダーツ・アミューズメント店舗を展開。",
      hasWebsite: true,
      observedServices: ["ダーツ店舗", "ダーツイベント", "イベント検索"],
      exclusionTags: ["複数店舗", "ダーツ設備あり"],
      evidence: [
        source(
          "bagus-darts",
          "BAGUS DARTS",
          "https://www.bagus-99.com/darts/",
          "official-service",
          "ダーツ店舗全体で約500台のマシンを設置していると公式ページで案内しています。店舗数への換算はしません。",
          ["industry", "location", "business", "service", "challenge-hypothesis"],
        ),
        source(
          "bagus-darts-event",
          "BAGUS DARTS イベント",
          "https://www.bagus-99.com/darts/event/",
          "official-event",
          "ダーツイベント情報を公式ページで公開しています。",
          ["service", "challenge-hypothesis"],
        ),
        source(
          "bagus-event-search",
          "BAGUS イベント検索",
          "https://www.bagus-99.com/event/?act=search&cat=5",
          "official-event",
          "カテゴリを指定した公式イベント検索を提供しています。",
          ["service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "bagus-hypothesis-operations",
          "多数のダーツ設備を活用するイベントで、受付・案内・結果共有を一つの導線にまとめる余地がある可能性があります。",
          "公式ダーツページとイベント情報から推論しました。",
          ["大会運営の省力化"],
          ["bagus-darts", "bagus-darts-event"],
        ),
        hypothesis(
          "bagus-hypothesis-acquisition",
          "イベント検索から申込・再訪までの導線を改善し、店舗横断で情報を管理する余地がある可能性があります。",
          "公式イベントページと検索機能から推論しました。",
          ["イベント集客", "複数店舗の大会情報管理"],
          ["bagus-darts-event", "bagus-event-search"],
        ),
      ],
    },
    {
      id: "darts-bee",
      companyName: "株式会社ビーリンク",
      industry: "ダーツ店舗運営",
      url: "https://www.bee-style.jp/",
      location: "全国",
      businessSummary: "ダーツを軸とするエンターテインメント店舗Beeを展開。",
      hasWebsite: true,
      storeCount: exactCount(30, "公式サイトの掲載店舗数", ["bee-home"]),
      observedServices: ["ダーツ店舗", "公式店舗一覧"],
      exclusionTags: ["複数店舗", "ダーツ設備あり"],
      evidence: [
        source(
          "bee-home",
          "ダイニングダーツバーBee 公式サイト",
          "https://www.bee-style.jp/",
          "official-company",
          "全国30店舗のダーツ店舗展開を公式サイトで案内しています。",
          ["industry", "location", "scale", "business", "challenge-hypothesis"],
        ),
        source(
          "bee-shops",
          "Bee 店舗情報",
          "https://www.bee-style.jp/shop/",
          "official-store-list",
          "エリア別の公式店舗情報を公開しています。",
          ["location", "service", "challenge-hypothesis"],
        ),
      ],
      challengeHypotheses: [
        hypothesis(
          "bee-hypothesis-multi-store",
          "30店舗の大会・イベント情報を店舗別に更新しつつ、横断して見つけやすくする余地がある可能性があります。",
          "公式サイトの店舗規模とエリア別店舗一覧から推論しました。大会開催の事実を断定するものではありません。",
          ["イベント集客", "複数店舗の大会情報管理"],
          ["bee-home", "bee-shops"],
        ),
      ],
    },
  ],
};

export const DEMO_SCENARIOS: readonly DemoScenario[] = Object.freeze([
  beautySalonScenario,
  restaurantScenario,
  dartsScenario,
]);

export function getDemoScenario(id: DemoScenarioId): DemoScenario {
  const scenario = DEMO_SCENARIOS.find((item) => item.id === id);
  if (scenario === undefined) throw new Error(`Unknown demo scenario: ${id}`);
  return scenario;
}
