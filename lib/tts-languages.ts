export interface TtsLanguage {
  code: string;
  label: string;
}

export const TTS_LANGUAGES: TtsLanguage[] = [
  { code: "ar-SA", label: "Arabic" },
  { code: "zh-CN", label: "Chinese (Mandarin)" },
  { code: "zh-TW", label: "Chinese (Taiwanese)" },
  { code: "cs-CZ", label: "Czech" },
  { code: "da-DK", label: "Danish" },
  { code: "nl-NL", label: "Dutch" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "fi-FI", label: "Finnish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "el-GR", label: "Greek" },
  { code: "he-IL", label: "Hebrew" },
  { code: "hi-IN", label: "Hindi" },
  { code: "hu-HU", label: "Hungarian" },
  { code: "id-ID", label: "Indonesian" },
  { code: "it-IT", label: "Italian" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "nb-NO", label: "Norwegian" },
  { code: "pl-PL", label: "Polish" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "pt-PT", label: "Portuguese (Portugal)" },
  { code: "ro-RO", label: "Romanian" },
  { code: "ru-RU", label: "Russian" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "sv-SE", label: "Swedish" },
  { code: "th-TH", label: "Thai" },
  { code: "tr-TR", label: "Turkish" },
  { code: "uk-UA", label: "Ukrainian" },
  { code: "vi-VN", label: "Vietnamese" },
];

export function getTtsLanguageLabel(code: string): string {
  return TTS_LANGUAGES.find((l) => l.code === code)?.label || code;
}
