export interface TtsLanguage {
  code: string;
  label: string;
  piperVoiceId?: string;
}

export const TTS_LANGUAGES: TtsLanguage[] = [
  { code: "ar-SA", label: "Arabic", piperVoiceId: "ar_JO-kareem-medium" },
  { code: "zh-CN", label: "Chinese (Mandarin)", piperVoiceId: "zh_CN-huayan-medium" },
  { code: "zh-TW", label: "Chinese (Taiwanese)" },
  { code: "cs-CZ", label: "Czech", piperVoiceId: "cs_CZ-jirka-medium" },
  { code: "da-DK", label: "Danish", piperVoiceId: "da_DK-talesyntese-medium" },
  { code: "nl-NL", label: "Dutch", piperVoiceId: "nl_NL-mls-medium" },
  { code: "en-US", label: "English (US)", piperVoiceId: "en_US-hfc_female-medium" },
  { code: "en-GB", label: "English (UK)", piperVoiceId: "en_GB-cori-medium" },
  { code: "fi-FI", label: "Finnish", piperVoiceId: "fi_FI-harri-medium" },
  { code: "fr-FR", label: "French", piperVoiceId: "fr_FR-siwis-medium" },
  { code: "de-DE", label: "German", piperVoiceId: "de_DE-thorsten-medium" },
  { code: "el-GR", label: "Greek", piperVoiceId: "el_GR-rapunzelina-low" },
  { code: "he-IL", label: "Hebrew" },
  { code: "hi-IN", label: "Hindi" },
  { code: "hu-HU", label: "Hungarian", piperVoiceId: "hu_HU-anna-medium" },
  { code: "id-ID", label: "Indonesian" },
  { code: "it-IT", label: "Italian", piperVoiceId: "it_IT-paola-medium" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "nb-NO", label: "Norwegian", piperVoiceId: "no_NO-talesyntese-medium" },
  { code: "pl-PL", label: "Polish", piperVoiceId: "pl_PL-darkman-medium" },
  { code: "pt-BR", label: "Portuguese (Brazil)", piperVoiceId: "pt_BR-faber-medium" },
  { code: "pt-PT", label: "Portuguese (Portugal)", piperVoiceId: "pt_PT-tugão-medium" },
  { code: "ro-RO", label: "Romanian", piperVoiceId: "ro_RO-mihai-medium" },
  { code: "ru-RU", label: "Russian", piperVoiceId: "ru_RU-irina-medium" },
  { code: "es-ES", label: "Spanish (Spain)", piperVoiceId: "es_ES-davefx-medium" },
  { code: "es-MX", label: "Spanish (Mexico)", piperVoiceId: "es_MX-ald-medium" },
  { code: "sv-SE", label: "Swedish", piperVoiceId: "sv_SE-nst-medium" },
  { code: "th-TH", label: "Thai" },
  { code: "tr-TR", label: "Turkish", piperVoiceId: "tr_TR-dfki-medium" },
  { code: "uk-UA", label: "Ukrainian", piperVoiceId: "uk_UA-lada-x_low" },
  { code: "vi-VN", label: "Vietnamese", piperVoiceId: "vi_VN-vais1000-medium" },
];

export function getTtsLanguageLabel(code: string): string {
  return TTS_LANGUAGES.find((l) => l.code === code)?.label || code;
}

export function getPiperVoice(code: string): string | null {
  return TTS_LANGUAGES.find((l) => l.code === code)?.piperVoiceId ?? null;
}

export function getPiperSupportedLabels(): string[] {
  return TTS_LANGUAGES.filter((l) => l.piperVoiceId).map((l) => l.label);
}
