export interface OriginalLocaleInventoryEntry {
  code: string;
  dataPath: string;
  msgidEntries: number;
  hasJs: boolean;
  hasPo: boolean;
  hasCss: boolean;
}

export const LOCALIZATION_TEMPLATE_PATH = "ORIGINAL/lang/adarkroom.pot";
export const LOCALIZATION_TEMPLATE_MSGID_ENTRIES = 773;
export const LOCALIZATION_LANGS_PATH = "ORIGINAL/lang/langs.js";
export const LOCALIZATION_BABEL_CONFIG_PATH = "ORIGINAL/lang/babel.cfg";
export const LOCALIZATION_MAIN_CSS_PATH = "ORIGINAL/lang/main.css";

export const originalLanguageCodes = [
  "cs",
  "de",
  "el",
  "en",
  "eo",
  "es",
  "fr",
  "gl",
  "id",
  "it",
  "lv",
  "ja",
  "ko",
  "nb",
  "pl",
  "lt_LT",
  "pt",
  "pt_br",
  "ru",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh_cn",
  "zh_tw"
] as const;

export const originalLocaleInventory: OriginalLocaleInventoryEntry[] = [
  { code: "cs", dataPath: "DATA/locales/cs.md", msgidEntries: 805, hasJs: true, hasPo: true, hasCss: true },
  { code: "de", dataPath: "DATA/locales/de.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "el", dataPath: "DATA/locales/el.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "eo", dataPath: "DATA/locales/eo.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "es", dataPath: "DATA/locales/es.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "fr", dataPath: "DATA/locales/fr.md", msgidEntries: 781, hasJs: true, hasPo: true, hasCss: true },
  { code: "gl", dataPath: "DATA/locales/gl.md", msgidEntries: 793, hasJs: true, hasPo: true, hasCss: true },
  { code: "id", dataPath: "DATA/locales/id.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "it", dataPath: "DATA/locales/it.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "ja", dataPath: "DATA/locales/ja.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "ko", dataPath: "DATA/locales/ko.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "lt_LT", dataPath: "DATA/locales/lt_LT.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "lv", dataPath: "DATA/locales/lv.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "nb", dataPath: "DATA/locales/nb.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "pl", dataPath: "DATA/locales/pl.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "pt", dataPath: "DATA/locales/pt.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "pt_br", dataPath: "DATA/locales/pt_br.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "ru", dataPath: "DATA/locales/ru.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "sv", dataPath: "DATA/locales/sv.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "th", dataPath: "DATA/locales/th.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "tr", dataPath: "DATA/locales/tr.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "uk", dataPath: "DATA/locales/uk.md", msgidEntries: 781, hasJs: true, hasPo: true, hasCss: true },
  { code: "vi", dataPath: "DATA/locales/vi.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true },
  { code: "zh_cn", dataPath: "DATA/locales/zh_cn.md", msgidEntries: 793, hasJs: true, hasPo: true, hasCss: true },
  { code: "zh_tw", dataPath: "DATA/locales/zh_tw.md", msgidEntries: 773, hasJs: true, hasPo: true, hasCss: true }
];

export const originalDeferredLocalizationScope = {
  implementationDeferredUntil: "post-remake parity",
  reason: "Localization switching is preserved as inventory now and implemented after the desktop-only parity remake is complete."
} as const;
