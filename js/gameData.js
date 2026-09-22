/**
 * Card Database, Ranks, SP Points and Gacha Probabilities
 * Pre-loaded with official Tokusatsu Heroes metadata from toku_attendancecheck.xlsx
 */
const DEFAULT_TOKU_CARDS = [
  {
    "card_id": "card_0000",
    "name": "고지라(1954)",
    "rank": "HR",
    "sp_point": 100,
    "name_jp": "ゴジラ(1954)",
    "name_en": "Godzilla(1954)",
    "is_complete": true
  },
  {
    "card_id": "card_0001",
    "name": "킹콩(1962)",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "キングコング(1962)",
    "name_en": "King Kong(1962)",
    "is_complete": true
  },
  {
    "card_id": "card_0002",
    "name": "오오타코(1962)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "大おおダコ(1962)",
    "name_en": "Giant Octopus(1962)",
    "is_complete": true
  },
  {
    "card_id": "card_0003",
    "name": "모스라(1964)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "モスラ(1964)",
    "name_en": "Mothra(1964)",
    "is_complete": true
  },
  {
    "card_id": "card_0004",
    "name": "킹 기도라(1964)",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "キングギドラ(1964)",
    "name_en": "King Ghidorah(1964)",
    "is_complete": true
  },
  {
    "card_id": "card_0005",
    "name": "라돈(1964)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ラドン(1964)",
    "name_en": "Rodan(1964)",
    "is_complete": true
  },
  {
    "card_id": "card_0006",
    "name": "에비라(1966)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "エビラ(1966)",
    "name_en": "Ebirah(1966)",
    "is_complete": true
  },
  {
    "card_id": "card_0007",
    "name": "오오콘돌(1966)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "大コンドル(1966)",
    "name_en": "Giant Condor(1966)",
    "is_complete": true
  },
  {
    "card_id": "card_0008",
    "name": "미니라(1967)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ミニラ(1967)",
    "name_en": "Minilla(1967)",
    "is_complete": true
  },
  {
    "card_id": "card_0009",
    "name": "카마키라스(1967)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "カマキラス(1967)",
    "name_en": "Kamacuras(1967)",
    "is_complete": true
  },
  {
    "card_id": "card_0010",
    "name": "쿠몽가(1967)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "クモンガ(1967)",
    "name_en": "Kumonga(1967)",
    "is_complete": true
  },
  {
    "card_id": "card_0011",
    "name": "안기라스(1968)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "アンギラス(1968)",
    "name_en": "Anguirus(1968)",
    "is_complete": true
  },
  {
    "card_id": "card_0012",
    "name": "고로자우루스(1968)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ゴロザウルス(1968)",
    "name_en": "Gorosaurus(1968)",
    "is_complete": true
  },
  {
    "card_id": "card_0013",
    "name": "바라곤(1968)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "バラゴン(1968)",
    "name_en": "Baragon(1968)",
    "is_complete": true
  },
  {
    "card_id": "card_0014",
    "name": "만다(1968)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "マンダ(1968)",
    "name_en": "Manda(1968)",
    "is_complete": true
  },
  {
    "card_id": "card_0015",
    "name": "헤도라(1971)",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ヘドラ(1971)",
    "name_en": "Hedorah(1971)",
    "is_complete": true
  },
  {
    "card_id": "card_0016",
    "name": "가이강(1972)",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ガイガン(1972)",
    "name_en": "Gigan(1972)",
    "is_complete": true
  },
  {
    "card_id": "card_0017",
    "name": "메가로(1973)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "メガロ(1973)",
    "name_en": "Megalon(1973)",
    "is_complete": true
  },
  {
    "card_id": "card_0018",
    "name": "제트 쟈가(1973)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ジェット・ジャガー(1973)",
    "name_en": "Jet Jaguar(1973)",
    "is_complete": true
  },
  {
    "card_id": "card_0019",
    "name": "메카고지라(1974)",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "メカゴジラ(1974)",
    "name_en": "MechaGodzilla(1974)",
    "is_complete": true
  },
  {
    "card_id": "card_0020",
    "name": "킹 시사(1974)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "キングシーサー(1974)",
    "name_en": "King Caesar(1974)",
    "is_complete": true
  },
  {
    "card_id": "card_0021",
    "name": "치타노자우루스(1975)",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "チタノザウルス(1975)",
    "name_en": "Titanosaurus(1975)",
    "is_complete": true
  },
  {
    "card_id": "card_0022",
    "name": "울트라맨",
    "rank": "HR",
    "sp_point": 100,
    "name_jp": "ウルトラマン",
    "name_en": "Ultraman",
    "is_complete": true
  },
  {
    "card_id": "card_0023",
    "name": "하야타 신",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "早田 進",
    "name_en": "Shin Hayata",
    "is_complete": true
  },
  {
    "card_id": "card_0024",
    "name": "우주괴수 배무라",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "宇宙怪獣 ベムラー",
    "name_en": "Space Monster Bemular",
    "is_complete": true
  },
  {
    "card_id": "card_0025",
    "name": "발탄 성인",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "バルタン 星人",
    "name_en": "Alien Baltan",
    "is_complete": true
  },
  {
    "card_id": "card_0026",
    "name": "가짜 울트라맨",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "にせウルトラマン",
    "name_en": "Imitation Ultraman",
    "is_complete": true
  },
  {
    "card_id": "card_0027",
    "name": "모래지옥괴수 사이고",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "サイゴ",
    "name_en": "Saigo",
    "is_complete": true
  },
  {
    "card_id": "card_0028",
    "name": "광열괴수 키라",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "キーラ",
    "name_en": "Keylla",
    "is_complete": true
  },
  {
    "card_id": "card_0029",
    "name": "우주공룡 젯톤",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "宇宙恐竜 ゼットン",
    "name_en": "Space Dinosaur Zetton",
    "is_complete": true
  },
  {
    "card_id": "card_0030",
    "name": "울트라맨 세븐",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ウルトラセブン",
    "name_en": "Ultra Seven",
    "is_complete": true
  },
  {
    "card_id": "card_0031",
    "name": "모로보시 단",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "モロボシ・ダン",
    "name_en": "Dan Moroboshi",
    "is_complete": true
  },
  {
    "card_id": "card_0032",
    "name": "유리 안느",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "友里アンヌ",
    "name_en": "Anne Yuri",
    "is_complete": true
  },
  {
    "card_id": "card_0033",
    "name": "후지 아키코",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "フジ・アキコ",
    "name_en": "Akiko Fuji",
    "is_complete": true
  },
  {
    "card_id": "card_0034",
    "name": "울트라맨 잭",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ウルトラマンジャック",
    "name_en": "Ultraman Jack",
    "is_complete": true
  },
  {
    "card_id": "card_0035",
    "name": "고 히데키",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "郷 秀樹",
    "name_en": "Hideki Go",
    "is_complete": true
  },
  {
    "card_id": "card_0036",
    "name": "사카타 아키",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "坂田 アキ",
    "name_en": "Aki Sakata",
    "is_complete": true
  },
  {
    "card_id": "card_0037",
    "name": "2대 우주공룡 젯톤",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "宇宙恐竜 ゼットン2",
    "name_en": "Space Dinosaur Zetton 2",
    "is_complete": true
  },
  {
    "card_id": "card_0038",
    "name": "촉각우주인 배트 성인",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "触覚宇宙人 バット星人",
    "name_en": "Antenna Alien Alien Bat",
    "is_complete": true
  },
  {
    "card_id": "card_0039",
    "name": "촉각우주인 배트 성인 2",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "触覚宇宙人 バット星人 2",
    "name_en": "Antenna Alien Alien Bat 2",
    "is_complete": true
  },
  {
    "card_id": "card_0040",
    "name": "울트라맨 에이스",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ウルトラマン エース",
    "name_en": "Ultraman Ace",
    "is_complete": true
  },
  {
    "card_id": "card_0041",
    "name": "호쿠토 세이지",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "北斗 星司",
    "name_en": "Seiji Hokuto",
    "is_complete": true
  },
  {
    "card_id": "card_0042",
    "name": "미나미 유우코",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "南 夕子",
    "name_en": "Yuko Minami",
    "is_complete": true
  },
  {
    "card_id": "card_0043",
    "name": "울트라맨 타로(초인 제트맨)",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ウルトラマンタロウ",
    "name_en": "Ultraman Taro",
    "is_complete": true
  },
  {
    "card_id": "card_0044",
    "name": "히가시 코타로",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ひがし 光太郎",
    "name_en": "Kotaro Higashi",
    "is_complete": true
  },
  {
    "card_id": "card_0045",
    "name": "모리야마 이즈미",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "森山 いずみ",
    "name_en": "Izumi Moriyama",
    "is_complete": true
  },
  {
    "card_id": "card_0046",
    "name": "신호초수 시그날리온",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "シグナリオン",
    "name_en": "Signalion",
    "is_complete": true
  },
  {
    "card_id": "card_0047",
    "name": "물병초수 아쿠에리우스",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "アクエリウス",
    "name_en": "Aquarius",
    "is_complete": true
  },
  {
    "card_id": "card_0048",
    "name": "우주전기해파리 유니버라게스",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ユニバーラゲス",
    "name_en": "Univerlages",
    "is_complete": true
  },
  {
    "card_id": "card_0049",
    "name": "우주대괴수 아스트로몬스",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "宇宙大怪獣 アストロモンス",
    "name_en": "Giant Space Monster Astromons",
    "is_complete": true
  },
  {
    "card_id": "card_0050",
    "name": "경호원괴수 블랙킹",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "用心棒怪獣 ブラックキング",
    "name_en": "Bodyguard Monster Black King",
    "is_complete": true
  },
  {
    "card_id": "card_0051",
    "name": "폭군괴수 타일런트",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "暴君怪獣 タイラント",
    "name_en": "Despot Monster Tyrant",
    "is_complete": true
  },
  {
    "card_id": "card_0052",
    "name": "우주어부 벌키 성인",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "バルキー星人",
    "name_en": "Alien Valky",
    "is_complete": true
  },
  {
    "card_id": "card_0053",
    "name": "울트라맨 레오",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ウルトラマンレオ",
    "name_en": "Ultraman Leo",
    "is_complete": true
  },
  {
    "card_id": "card_0054",
    "name": "오오토리 겐",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "おおとりゲン",
    "name_en": "Gen Otori",
    "is_complete": true
  },
  {
    "card_id": "card_0055",
    "name": "야마구치 모모코",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "山口百子",
    "name_en": "Momoko Yamaguchi",
    "is_complete": true
  },
  {
    "card_id": "card_0056",
    "name": "사벨폭군 마그마 성인",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "サーベル暴君 マグマ星人",
    "name_en": "Saber Tyrant Alien Magma",
    "is_complete": true
  },
  {
    "card_id": "card_0057",
    "name": "블랙 커맨더",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ブラック指令",
    "name_en": "Black Directive",
    "is_complete": true
  },
  {
    "card_id": "card_0058",
    "name": "원반생물 블랙엔드",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ブラックエンド",
    "name_en": "Black End",
    "is_complete": true
  },
  {
    "card_id": "card_0059",
    "name": "더★울트라맨",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ザ★ウルトラマン",
    "name_en": "The★Ultraman",
    "is_complete": true
  },
  {
    "card_id": "card_0060",
    "name": "히카리 초이치로",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ヒカリ超一郎",
    "name_en": "Choichiro Hikari",
    "is_complete": true
  },
  {
    "card_id": "card_0061",
    "name": "호시카와 무츠미",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "星川ムツミ",
    "name_en": "Mutsumi Hoshikawa",
    "is_complete": true
  },
  {
    "card_id": "card_0062",
    "name": "냉동괴수 시그라",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "シーグラ",
    "name_en": "Seagra",
    "is_complete": true
  },
  {
    "card_id": "card_0063",
    "name": "구름괴수 레드스모기",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "レッドスモーギ",
    "name_en": "Red Smogy",
    "is_complete": true
  },
  {
    "card_id": "card_0064",
    "name": "처형괴수 마쿠다타",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "マクダター",
    "name_en": "Mac Datar",
    "is_complete": true
  },
  {
    "card_id": "card_0065",
    "name": "가면라이더 1호",
    "rank": "HR",
    "sp_point": 100,
    "name_jp": "仮面ライダー 1号",
    "name_en": "MASKED RIDER 1",
    "is_complete": true
  },
  {
    "card_id": "card_0066",
    "name": "혼고 타케시",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ほんごう猛",
    "name_en": "Takeshi Hongo",
    "is_complete": true
  },
  {
    "card_id": "card_0067",
    "name": "가면라이더 2호",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "仮面ライダー 2号",
    "name_en": "MASKED RIDER 2",
    "is_complete": true
  },
  {
    "card_id": "card_0068",
    "name": "이치몬지 하야토",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "いちもんじ隼人",
    "name_en": "Hayato Ichimonji",
    "is_complete": true
  },
  {
    "card_id": "card_0069",
    "name": "미도리카와 루리코",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "緑川ルリ子",
    "name_en": "Ruriko Midorikawa",
    "is_complete": true
  },
  {
    "card_id": "card_0070",
    "name": "쇼커 수령",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ショッカー首領",
    "name_en": "Shocker Leader",
    "is_complete": true
  },
  {
    "card_id": "card_0071",
    "name": "졸 대령",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ゾル大佐",
    "name_en": "Colonel Zoll",
    "is_complete": true
  },
  {
    "card_id": "card_0072",
    "name": "사신박사",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "死神博士",
    "name_en": "Dr. Shinigami",
    "is_complete": true
  },
  {
    "card_id": "card_0073",
    "name": "지옥대사",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "地獄大使",
    "name_en": "Ambassador of Hell",
    "is_complete": true
  },
  {
    "card_id": "card_0074",
    "name": "쇼커 전투원",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ショッカー戦闘員",
    "name_en": "Shocker Combatmen",
    "is_complete": true
  },
  {
    "card_id": "card_0075",
    "name": "쇼커 전투원팀",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ショッカー戦闘員チーム",
    "name_en": "Shocker Combatmen team",
    "is_complete": true
  },
  {
    "card_id": "card_0076",
    "name": "여자 쇼커 전투원팀",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "女性ショッカー戦闘員",
    "name_en": "Female Shocker Combatants team",
    "is_complete": true
  },
  {
    "card_id": "card_0077",
    "name": "여자 쇼커 전투원",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "女性ショッカー戦闘員チーム",
    "name_en": "Female Shocker Combatants",
    "is_complete": true
  },
  {
    "card_id": "card_0078",
    "name": "우주형사 갸반",
    "rank": "HR",
    "sp_point": 100,
    "name_jp": "宇宙刑事ギャバン",
    "name_en": "Space Sheriff Gavan",
    "is_complete": true
  },
  {
    "card_id": "card_0079",
    "name": "우주형사 이치죠지 레츠",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "一条寺 烈",
    "name_en": "Space Sheriff Gavan",
    "is_complete": true
  },
  {
    "card_id": "card_0080",
    "name": "은하연방경찰 미미",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ミミー",
    "name_en": "Space Sheriff Mimie",
    "is_complete": true
  },
  {
    "card_id": "card_0081",
    "name": "돈 호러",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ドン・ホラー",
    "name_en": "Don Horror",
    "is_complete": true
  },
  {
    "card_id": "card_0082",
    "name": "호러걸",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ホラーガール",
    "name_en": "Horror Girl",
    "is_complete": true
  },
  {
    "card_id": "card_0083",
    "name": "더블걸",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ダブルガール",
    "name_en": "Double Girl",
    "is_complete": true
  },
  {
    "card_id": "card_0084",
    "name": "크래셔",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "クラッシャー",
    "name_en": "Crusher",
    "is_complete": true
  },
  {
    "card_id": "card_0085",
    "name": "우주형사 샤리반",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "宇宙刑事シャリバン",
    "name_en": "Space Sheriff Sharivan",
    "is_complete": true
  },
  {
    "card_id": "card_0086",
    "name": "우주형사 이가 덴",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "伊賀 電",
    "name_en": "Space Sheriff Sharivan",
    "is_complete": true
  },
  {
    "card_id": "card_0087",
    "name": "우주형사 릴리",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "宇宙刑事 リリィ",
    "name_en": "Space Sheriff Lily",
    "is_complete": true
  },
  {
    "card_id": "card_0088",
    "name": "마왕 사이코",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "宇宙犯罪組織マドーの魔王サイコ",
    "name_en": "Demon King Psycho",
    "is_complete": true
  },
  {
    "card_id": "card_0089",
    "name": "닥터 폴터",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ドクターポルター",
    "name_en": "Doctor Polter",
    "is_complete": true
  },
  {
    "card_id": "card_0090",
    "name": "파이트로",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ファイトロー",
    "name_en": "Fightrow",
    "is_complete": true
  },
  {
    "card_id": "card_0091",
    "name": "우주형사 샤이다",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "宇宙刑事シャイダー",
    "name_en": "Space Sheriff Sharivan",
    "is_complete": true
  },
  {
    "card_id": "card_0092",
    "name": "사와무라 다이",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "沢村大",
    "name_en": "Dai Sawamura",
    "is_complete": true
  },
  {
    "card_id": "card_0093",
    "name": "우주형사 애니",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "宇宙刑事アニー",
    "name_en": "Space Sheriff Annie",
    "is_complete": true
  },
  {
    "card_id": "card_0094",
    "name": "대제왕 쿠빌라이",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "不思議界フーマの大帝王クビライ",
    "name_en": "Great Emperor Kubilai",
    "is_complete": true
  },
  {
    "card_id": "card_0095",
    "name": "헤슬러 지휘관",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ヘスラー指揮官",
    "name_en": "Commander Hessler",
    "is_complete": true
  },
  {
    "card_id": "card_0096",
    "name": "쿠노이치 5인조",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ギャル軍団のくノ一・五人衆",
    "name_en": "Girls Army",
    "is_complete": true
  },
  {
    "card_id": "card_0097",
    "name": "전투원 미라클러",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "戦闘員ミラクラー",
    "name_en": "Soldier Miraclers",
    "is_complete": true
  },
  {
    "card_id": "card_0098",
    "name": "거수특수 쟈스피온",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "巨獣特捜ジャスピオン",
    "name_en": "MegaBeast Investigator Juspion",
    "is_complete": true
  },
  {
    "card_id": "card_0099",
    "name": "자스피온",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ジャスピオン",
    "name_en": "Juspion",
    "is_complete": true
  },
  {
    "card_id": "card_0100",
    "name": "안드로이드 앙리",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "アンリ",
    "name_en": "Gynoid  Anri",
    "is_complete": true
  },
  {
    "card_id": "card_0101",
    "name": "제왕 사탄고스",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "サタンゴース軍団の帝王サタンゴース",
    "name_en": "Satan Gorth",
    "is_complete": true
  },
  {
    "card_id": "card_0102",
    "name": "은하마녀 기르마자",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "銀河魔女ギルマーザ",
    "name_en": "Witch Gilza",
    "is_complete": true
  },
  {
    "card_id": "card_0103",
    "name": "매드 갤런",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "マッドギャラン",
    "name_en": "Mad Gallant",
    "is_complete": true
  },
  {
    "card_id": "card_0104",
    "name": "싸이보그 스필반",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "時空戦士スピルバン",
    "name_en": "Zikusensi Spielban",
    "is_complete": true
  },
  {
    "card_id": "card_0105",
    "name": "스필반",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "スピルバン",
    "name_en": "Spielban",
    "is_complete": true
  },
  {
    "card_id": "card_0106",
    "name": "다이아나",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ダイアナ",
    "name_en": "Diana",
    "is_complete": true
  },
  {
    "card_id": "card_0107",
    "name": "헬렌",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ヘレン",
    "name_en": "Helen",
    "is_complete": true
  },
  {
    "card_id": "card_0108",
    "name": "판도라 여왕",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "女王パンドラ",
    "name_en": "Queen Pandora",
    "is_complete": true
  },
  {
    "card_id": "card_0109",
    "name": "데스제로 장군",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "デスゼロウ将軍",
    "name_en": "General Deathzerow",
    "is_complete": true
  },
  {
    "card_id": "card_0110",
    "name": "릭키",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "リッキー",
    "name_en": "Spy Army Leader Licky",
    "is_complete": true
  },
  {
    "card_id": "card_0111",
    "name": "섀도 & 가샤",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "シャドー&ガシャー",
    "name_en": "Shadow and Gasha",
    "is_complete": true
  },
  {
    "card_id": "card_0112",
    "name": "기계병 킹크론",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "キンクロン",
    "name_en": "Kinclons",
    "is_complete": true
  },
  {
    "card_id": "card_0113",
    "name": "초인기 메탈더",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "超人機メタルダー",
    "name_en": "Choujinki Metalder",
    "is_complete": true
  },
  {
    "card_id": "card_0114",
    "name": "츠루기 류세이",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "剣 流星",
    "name_en": "Ryusei Tsurugi",
    "is_complete": true
  },
  {
    "card_id": "card_0115",
    "name": "오오기 마이",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "仰木 舞",
    "name_en": "Mai Ougi",
    "is_complete": true
  },
  {
    "card_id": "card_0116",
    "name": "제왕 갓 네로스",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "帝王ゴッドネロス",
    "name_en": "God Neros",
    "is_complete": true
  },
  {
    "card_id": "card_0117",
    "name": "미인비서 K, S",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "美人秘書K、S",
    "name_en": "Beautiful Secretary K&S",
    "is_complete": true
  },
  {
    "card_id": "card_0118",
    "name": "경투사 영",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "軽闘士 影",
    "name_en": "Light Fighter",
    "is_complete": true
  },
  {
    "card_id": "card_0119",
    "name": "세계닌자 지라이야",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "世界忍者ジライヤ",
    "name_en": "World Ninja Jiraiya",
    "is_complete": true
  },
  {
    "card_id": "card_0120",
    "name": "야마지 토우하",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "山地 闘破",
    "name_en": "Toha Yamaji",
    "is_complete": true
  },
  {
    "card_id": "card_0121",
    "name": "공주닌 에미하",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "姫忍 恵美破",
    "name_en": "Princess Ninja Emiha",
    "is_complete": true
  },
  {
    "card_id": "card_0122",
    "name": "야마지 케이",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "山地 ケイ",
    "name_en": "Yamaji Kei",
    "is_complete": true
  },
  {
    "card_id": "card_0123",
    "name": "야마지 마나부",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "山地 学",
    "name_en": "Manabu Yamaji",
    "is_complete": true
  },
  {
    "card_id": "card_0124",
    "name": "야규 레이",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "柳生 レイ",
    "name_en": "Rei Yagyu",
    "is_complete": true
  },
  {
    "card_id": "card_0125",
    "name": "아스카 류",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "飛鳥 竜",
    "name_en": "Ryu Asuka",
    "is_complete": true
  },
  {
    "card_id": "card_0126",
    "name": "오니닌자 도쿠사이",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "鬼忍 毒斎",
    "name_en": "Manabu Yamaji",
    "is_complete": true
  },
  {
    "card_id": "card_0127",
    "name": "나비닌자 베니키바",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "蝶忍 紅牙",
    "name_en": "Butterfly Ninja Benikiba",
    "is_complete": true
  },
  {
    "card_id": "card_0128",
    "name": "요닌자 쿠모고젠",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "妖忍 クモ御前",
    "name_en": "Witch Ninja Madam Spider",
    "is_complete": true
  },
  {
    "card_id": "card_0129",
    "name": "새닌자 카라스 텐구",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "鳥忍 カラス天狗",
    "name_en": "Bird Ninjas Karasutengu",
    "is_complete": true
  },
  {
    "card_id": "card_0130",
    "name": "기동형사 지반",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "機動刑事ジバン",
    "name_en": "The Mobile Cop Jiban",
    "is_complete": true
  },
  {
    "card_id": "card_0131",
    "name": "타무라 나오토",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "田村 直人",
    "name_en": "Naoto Tamura",
    "is_complete": true
  },
  {
    "card_id": "card_0132",
    "name": "닥터 기바",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ドクター・ギバ",
    "name_en": "Doctor Giba",
    "is_complete": true
  },
  {
    "card_id": "card_0133",
    "name": "마샤&카샤",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "マーシャ&カーシャ",
    "name_en": "Marsha and Karsha",
    "is_complete": true
  },
  {
    "card_id": "card_0134",
    "name": "매드 가르보",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "マッド・ガルボ",
    "name_en": "Madogarbo",
    "is_complete": true
  },
  {
    "card_id": "card_0135",
    "name": "마스크",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "マスク",
    "name_en": "Masques",
    "is_complete": true
  },
  {
    "card_id": "card_0136",
    "name": "아카레인저",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "アカレンジャー",
    "name_en": "Akarenger",
    "is_complete": true
  },
  {
    "card_id": "card_0137",
    "name": "카이조 츠요시",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "海城 剛",
    "name_en": "Tsuyoshi Kaijo",
    "is_complete": true
  },
  {
    "card_id": "card_0138",
    "name": "아오레인저",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "アオレンジャー",
    "name_en": "Aorenger",
    "is_complete": true
  },
  {
    "card_id": "card_0139",
    "name": "신메이 아키라",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "新命 明",
    "name_en": "Akira Shinmei",
    "is_complete": true
  },
  {
    "card_id": "card_0140",
    "name": "키레인저",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "キレンジャー",
    "name_en": "Kirenger",
    "is_complete": true
  },
  {
    "card_id": "card_0141",
    "name": "오이와 다이타",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "大岩 大太",
    "name_en": "Daita Oiwa",
    "is_complete": true
  },
  {
    "card_id": "card_0142",
    "name": "쿠마노 다이고로",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "くまの 大五郎",
    "name_en": "Daigoro Kumano",
    "is_complete": true
  },
  {
    "card_id": "card_0143",
    "name": "모모레인저",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "モモレンジャー",
    "name_en": "Momorenger",
    "is_complete": true
  },
  {
    "card_id": "card_0144",
    "name": "페기 마츠야마",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ペギー 松山",
    "name_en": "Peggy Matsuyama",
    "is_complete": true
  },
  {
    "card_id": "card_0145",
    "name": "미도레인저",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ミドレンジャー",
    "name_en": "Midorenger",
    "is_complete": true
  },
  {
    "card_id": "card_0146",
    "name": "아스카 켄지",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "あすか 健二",
    "name_en": "Kenji Asuka",
    "is_complete": true
  },
  {
    "card_id": "card_0147",
    "name": "흑십자 총통",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "黒十字総統",
    "name_en": "Black Cross Führer",
    "is_complete": true
  },
  {
    "card_id": "card_0148",
    "name": "흑십자 왕",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "黒十字王",
    "name_en": "Black Cross King",
    "is_complete": true
  },
  {
    "card_id": "card_0149",
    "name": "골든가면 대장군",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "ゴールデン仮面大将軍",
    "name_en": "Commander Golden Mask",
    "is_complete": true
  },
  {
    "card_id": "card_0150",
    "name": "강철검룡",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "鋼鉄剣竜",
    "name_en": "Steel Sword Dragon",
    "is_complete": true
  },
  {
    "card_id": "card_0151",
    "name": "화산가면 마그만장군",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "火の山仮面マグマン将軍",
    "name_en": "Volcano Mask General Magman",
    "is_complete": true
  },
  {
    "card_id": "card_0152",
    "name": "철인가면 테무진 장군",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "鉄人仮面 テムジン将軍",
    "name_en": "Iron Man Mask General Temujin",
    "is_complete": true
  },
  {
    "card_id": "card_0153",
    "name": "일륜가면",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "日輪仮面",
    "name_en": "Sun Halo Mask",
    "is_complete": true
  },
  {
    "card_id": "card_0154",
    "name": "졸더",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ゾルダー",
    "name_en": "Zolders",
    "is_complete": true
  },
  {
    "card_id": "card_0155",
    "name": "마그",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "マグ",
    "name_en": "Mag",
    "is_complete": true
  },
  {
    "card_id": "card_0156",
    "name": "레드 후뢰시",
    "rank": "HR",
    "sp_point": 100,
    "name_jp": "レッドフラッシュ",
    "name_en": "Red Flash",
    "is_complete": true
  },
  {
    "card_id": "card_0157",
    "name": "진",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ジン",
    "name_en": "Jin",
    "is_complete": true
  },
  {
    "card_id": "card_0158",
    "name": "그린 후뢰시",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "グリーンフラッシュ",
    "name_en": "Green Flash",
    "is_complete": true
  },
  {
    "card_id": "card_0159",
    "name": "다이(라이)",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ダイ",
    "name_en": "Dai",
    "is_complete": true
  },
  {
    "card_id": "card_0160",
    "name": "블루 후뢰시",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ブルーフラッシュ",
    "name_en": "Blue Flash",
    "is_complete": true
  },
  {
    "card_id": "card_0161",
    "name": "붕",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ブン",
    "name_en": "Bun",
    "is_complete": true
  },
  {
    "card_id": "card_0162",
    "name": "옐로 후뢰시",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "イエローフラッシュ",
    "name_en": "Yellow Flash",
    "is_complete": true
  },
  {
    "card_id": "card_0163",
    "name": "사라",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "サラ",
    "name_en": "Sara",
    "is_complete": true
  },
  {
    "card_id": "card_0164",
    "name": "핑크 후뢰시",
    "rank": "UR",
    "sp_point": 16,
    "name_jp": "ピンクフラッシュ",
    "name_en": "Pink Flash",
    "is_complete": true
  },
  {
    "card_id": "card_0165",
    "name": "루",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ルー",
    "name_en": "Lou",
    "is_complete": true
  },
  {
    "card_id": "card_0166",
    "name": "플래시성인",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "フラッシュ星人",
    "name_en": "Alien Flash",
    "is_complete": true
  },
  {
    "card_id": "card_0167",
    "name": "영웅타이탄",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "英雄・タイタン",
    "name_en": "Hero Titan",
    "is_complete": true
  },
  {
    "card_id": "card_0168",
    "name": "레이 바라키",
    "rank": "SR",
    "sp_point": 4,
    "name_jp": "レー・バラキ",
    "name_en": "Leh Baraki",
    "is_complete": true
  },
  {
    "card_id": "card_0169",
    "name": "차미래",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "スミレ",
    "name_en": "Sumire Okano",
    "is_complete": true
  },
  {
    "card_id": "card_0170",
    "name": "미랑",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ミラン",
    "name_en": "Milan",
    "is_complete": true
  },
  {
    "card_id": "card_0171",
    "name": "와카쿠사 류",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "若草リュウ",
    "name_en": "Ryu Wakasa",
    "is_complete": true
  },
  {
    "card_id": "card_0172",
    "name": "시벨",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "シベール",
    "name_en": "Shibehl",
    "is_complete": true
  },
  {
    "card_id": "card_0173",
    "name": "강진영 박사",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "時村博士",
    "name_en": "Dr. Tokimura",
    "is_complete": true
  },
  {
    "card_id": "card_0174",
    "name": "강박사 부인",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "時村 節子",
    "name_en": "Setsuko Tokimura",
    "is_complete": true
  },
  {
    "card_id": "card_0175",
    "name": "강세진",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "時村 みどり",
    "name_en": "Midori Tokimura",
    "is_complete": true
  },
  {
    "card_id": "card_0176",
    "name": "강세영",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "時村 かおり",
    "name_en": "Kaori Tokimura",
    "is_complete": true
  },
  {
    "card_id": "card_0177",
    "name": "채유리",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "サユリ",
    "name_en": "Sayuri",
    "is_complete": true
  },
  {
    "card_id": "card_0178",
    "name": "채유리?",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "サユリ?",
    "name_en": "Sayuri?",
    "is_complete": true
  },
  {
    "card_id": "card_0179",
    "name": "유성의 수진",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "スケバンユキ",
    "name_en": "Bad Girl Yuki",
    "is_complete": true
  },
  {
    "card_id": "card_0180",
    "name": "수진",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "ユキ",
    "name_en": "Yuki",
    "is_complete": true
  },
  {
    "card_id": "card_0181",
    "name": "산장 아주머니",
    "rank": "R",
    "sp_point": 2,
    "name_jp": "加代子",
    "name_en": "Kayoko",
    "is_complete": true
  }
];

class GameDataManager {
  constructor() {
    this.ranks = [
      { rank: 'SUHR', sp_point: 1000, name: '슈퍼 울트라 히어로 레어', color: '#ff0055' },
      { rank: 'HR', sp_point: 100, name: '히어로 레어', color: '#ff7700' },
      { rank: 'UR', sp_point: 16, name: '울트라 레어', color: '#a855f7' },
      { rank: 'SR', sp_point: 4, name: '슈퍼 레어', color: '#3b82f6' },
      { rank: 'R', sp_point: 2, name: '레어', color: '#10b981' },
      { rank: 'N', sp_point: 1, name: '노멀', color: '#64748b' }
    ];

    this.gachaRates = [
      { rank: 'N', rate: 0.71 },
      { rank: 'R', rate: 0.22 },
      { rank: 'SR', rate: 0.04 },
      { rank: 'UR', rate: 0.02 },
      { rank: 'HR', rate: 0.009 },
      { rank: 'SUHR', rate: 0.001 }
    ];

    // 스타터 5종 카드
    this.starterCards = ['card_0000', 'card_0022', 'card_0065', 'card_0078', 'card_0156'];

    // 182종 카드 기본 리스트
    this.cards = {};
    this.initDefaultCards();
  }

  initDefaultCards() {
    DEFAULT_TOKU_CARDS.forEach(card => {
      this.cards[card.card_id] = { ...card };
    });
  }

  getRankSP(rank) {
    const found = this.ranks.find(r => r.rank === (rank || 'N').toUpperCase());
    return found ? found.sp_point : 1;
  }

  getRankInfo(rank) {
    const found = this.ranks.find(r => r.rank === (rank || 'N').toUpperCase());
    return found || this.ranks[4];
  }

  getCard(cardId) {
    if (this.cards[cardId]) {
      return this.cards[cardId];
    }
    // 폴백
    return {
      card_id: cardId || 'card_0000',
      name: `영웅 ${(cardId || '').replace('card_', '#')}`,
      rank: 'N',
      sp_point: 30
    };
  }

  getCardImagePath(cardId) {
    if (!cardId) cardId = 'card_0000';
    return `img_card/${cardId}.webp`;
  }

  // 카드 필수 데이터 완성도 검증
  isCardComplete(card) {
    if (!card) return false;
    const id = (card.card_id || '').trim();
    const name = (card.name || '').trim();
    const rank = (card.rank || '').trim().toUpperCase();

    if (!id || id.length < 3) return false;
    if (!name || name === '-' || name.toUpperCase() === 'NULL' || name.toUpperCase() === 'UNDEFINED' || name.indexOf('#N/A') >= 0 || name === '미정' || name === '준비중') {
      return false;
    }
    if (!rank || rank === '-' || rank === 'NULL' || rank === 'UNDEFINED' || rank.indexOf('#N/A') >= 0) {
      return false;
    }
    const rankExists = this.ranks.some(r => r.rank === rank);
    if (!rankExists) return false;

    return true;
  }

  // 가챠에서 출현 가능한 완전한 데이터의 카드 풀만 반환
  // ※ 데이터가 모두 작성되어 있지 않은 카드는 가챠에서 나오지 않음
  getGachaPool(rank = null) {
    const all = Object.values(this.cards);
    return all.filter(c => {
      if (!c.is_complete) return false;
      if (rank && c.rank !== rank) return false;
      return true;
    });
  }

  // 데이터가 완전한 모든 카드 목록 반환
  getAllCompleteCards() {
    return Object.values(this.cards).filter(c => c.is_complete);
  }

  // 구글 시트 등 외부 메타데이터로 갱신 (추후 지속적 카드 추가 완벽 지원)
  loadMetadata(metadata) {
    if (!metadata) return;

    if (Array.isArray(metadata.cardrank) && metadata.cardrank.length > 0) {
      metadata.cardrank.forEach(r => {
        const existing = this.ranks.find(item => item.rank === r.rank);
        if (existing) {
          existing.sp_point = Number(r.sp_point) || existing.sp_point;
          if (r.name) existing.name = r.name;
        } else {
          this.ranks.push({
            rank: r.rank,
            sp_point: Number(r.sp_point) || 30,
            name: r.name || r.rank,
            color: '#a0b0c0'
          });
        }
      });
    }

    if (Array.isArray(metadata.gacha) && metadata.gacha.length > 0) {
      this.gachaRates = metadata.gacha.map(g => ({
        rank: g.rank,
        rate: parseFloat(g.rate) || 0
      }));
    }

    if (Array.isArray(metadata.cardlist) && metadata.cardlist.length > 0) {
      metadata.cardlist.forEach(c => {
        const rawRank = c.rank ? String(c.rank).trim().toUpperCase() : '';
        const rawName = c.name ? String(c.name).trim() : '';
        let rawJp = c.name_jp ? String(c.name_jp).trim() : '';
        let rawEn = c.name_en ? String(c.name_en).trim() : '';

        // 일본어/영어 자동 감지 및 스왑 정규화
        const hasJpInEn = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(rawEn);
        const hasJpInJp = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(rawJp);
        if (hasJpInEn && !hasJpInJp) {
          const temp = rawJp;
          rawJp = rawEn;
          rawEn = temp;
        }

        const cardObj = {
          card_id: String(c.card_id || '').trim(),
          name: rawName,
          rank: rawRank,
          sp_point: Number(c.sp_point) || this.getRankSP(rawRank),
          name_jp: rawJp,
          name_en: rawEn
        };

        // 데이터 작성 완결 여부 체크
        cardObj.is_complete = this.isCardComplete(cardObj);
        this.cards[cardObj.card_id] = cardObj;
      });
    }

    const completeCount = this.getAllCompleteCards().length;
    console.log(`[GameData] Loaded ${Object.keys(this.cards).length} total cards (${completeCount} complete & available for gacha)`);
  }

  // 언어별 카드 이름 반환 (ko: 한국어, ja: 일본어, en: 영어)
  getCardLocalizedName(card, lang = 'ko') {
    if (!card) return '';
    if (typeof card === 'string') {
      card = this.getCard(card);
    }
    if (lang === 'ja') {
      return card.name_jp || card.name || card.name_en || '';
    } else if (lang === 'en') {
      return card.name_en || card.name || card.name_jp || '';
    }
    return card.name || card.name_jp || card.name_en || '';
  }

  // 보유 카드 기반 총 SP 계산
  calculateTotalSP(ownedCards) {
    if (!ownedCards) return 0;
    let total = 0;
    for (const [cardId, count] of Object.entries(ownedCards)) {
      const card = this.getCard(cardId);
      total += (card.sp_point || 0) * (count || 0);
    }
    return total;
  }
}

window.gameData = new GameDataManager();
