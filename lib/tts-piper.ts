const PIPER_VOICE_MAP: Record<string, string> = {
  "ar-SA": "ar_JO-kareem-medium",
  "zh-CN": "zh_CN-huayan-medium",
  "cs-CZ": "cs_CZ-jirka-medium",
  "da-DK": "da_DK-talesyntese-medium",
  "nl-NL": "nl_NL-mls-medium",
  "en-US": "en_US-hfc_female-medium",
  "en-GB": "en_GB-cori-medium",
  "fi-FI": "fi_FI-harri-medium",
  "fr-FR": "fr_FR-siwis-medium",
  "de-DE": "de_DE-thorsten-medium",
  "el-GR": "el_GR-rapunzelina-low",
  "hu-HU": "hu_HU-anna-medium",
  "it-IT": "it_IT-paola-medium",
  "nb-NO": "no_NO-talesyntese-medium",
  "pl-PL": "pl_PL-darkman-medium",
  "pt-BR": "pt_BR-faber-medium",
  "pt-PT": "pt_PT-tugão-medium",
  "ro-RO": "ro_RO-mihai-medium",
  "ru-RU": "ru_RU-irina-medium",
  "es-ES": "es_ES-davefx-medium",
  "es-MX": "es_MX-ald-medium",
  "sv-SE": "sv_SE-nst-medium",
  "tr-TR": "tr_TR-dfki-medium",
  "uk-UA": "uk_UA-lada-x_low",
  "vi-VN": "vi_VN-vais1000-medium",
};

export function getPiperVoiceForLang(lang: string): string | null {
  return PIPER_VOICE_MAP[lang] ?? null;
}

export function isPiperSupported(lang: string): boolean {
  return lang in PIPER_VOICE_MAP;
}

export function getPiperSupportedLanguages(): string[] {
  return Object.keys(PIPER_VOICE_MAP);
}

export async function piperSpeak(text: string, lang: string): Promise<Blob> {
  const voiceId = getPiperVoiceForLang(lang);
  if (!voiceId) {
    throw new Error(`No Piper voice available for language: ${lang}`);
  }

  const { TtsSession } = await import("@mintplex-labs/piper-tts-web");

  // TtsSession is an internal singleton: once created, `new TtsSession()`
  // returns the *same* instance and only updates the voiceId property — it
  // does NOT reload the ONNX model.  We must reset the singleton whenever
  // the requested voice differs from the one the session was built with.
  if (TtsSession._instance && TtsSession._instance.voiceId !== voiceId) {
    TtsSession._instance = null;
  }

  const session = new TtsSession({
    voiceId,
    wasmPaths: {
      onnxWasm: "/ort-wasm/",
      piperData: `${TtsSession.WASM_LOCATIONS.piperData}`,
      piperWasm: `${TtsSession.WASM_LOCATIONS.piperWasm}`,
    },
  });
  await session.waitReady;
  return session.predict(text);
}

export async function getPiperStoredVoices(): Promise<string[]> {
  const { stored } = await import("@mintplex-labs/piper-tts-web");
  return await stored();
}

export async function clearPiperVoices(): Promise<void> {
  const { flush } = await import("@mintplex-labs/piper-tts-web");
  await flush();
}
