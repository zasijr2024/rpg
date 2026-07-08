import { describe, expect, it } from "vitest";
import {
  AUDIO_EVENT_DUCK_VOLUME,
  AUDIO_EVENT_FADE_MULTIPLIER,
  AUDIO_FADE_TIME,
  AUDIO_MISSING_BUFFER_CHANNELS,
  AUDIO_MISSING_BUFFER_GAIN_DIVISOR,
  AUDIO_MISSING_BUFFER_SECONDS,
  AUDIO_MISSING_BUFFER_SINE_STEP,
  AUDIO_SAFARI_DECODE_POLL_MS,
  canonicalManifest,
  LOCALIZATION_BABEL_CONFIG_PATH,
  LOCALIZATION_LANGS_PATH,
  LOCALIZATION_MAIN_CSS_PATH,
  LOCALIZATION_TEMPLATE_MSGID_ENTRIES,
  LOCALIZATION_TEMPLATE_PATH,
  originalAudioManifest,
  originalContentRegistry,
  originalDeferredLocalizationScope,
  originalLanguageCodes,
  originalLocaleInventory,
} from "../../content/original";

describe("original deferred audio and localization manifests", () => {
  it("ports exact audio engine constants", () => {
    expect(AUDIO_FADE_TIME).toBe(1);
    expect(AUDIO_EVENT_DUCK_VOLUME).toBe(0.2);
    expect(AUDIO_EVENT_FADE_MULTIPLIER).toBe(2);
    expect(AUDIO_MISSING_BUFFER_CHANNELS).toBe(1);
    expect(AUDIO_MISSING_BUFFER_SECONDS).toBe(1);
    expect(AUDIO_MISSING_BUFFER_SINE_STEP).toBe(0.05);
    expect(AUDIO_MISSING_BUFFER_GAIN_DIVISOR).toBe(4);
    expect(AUDIO_SAFARI_DECODE_POLL_MS).toBe(20);
  });

  it("matches audio constants from the canonical manifest", () => {
    expect(originalAudioManifest.map((audio) => audio.key)).toEqual(
      canonicalManifest.keys.audioConstants,
    );
    expect(originalAudioManifest).toContainEqual({
      key: "MUSIC_FIRE_ROARING",
      path: "audio/fire-roaring.flac",
      kind: "music",
    });
    expect(originalAudioManifest).toContainEqual({
      key: "LANDMARK_CRASHED_SHIP",
      path: "audio/landmark-crashed-ship.flac",
      kind: "landmark",
    });
    expect(originalAudioManifest).toContainEqual({
      key: "ASTEROID_HIT_8",
      path: "audio/asteroid-hit-8.flac",
      kind: "space",
    });
  });

  it("stores localization template and registry metadata", () => {
    expect(LOCALIZATION_TEMPLATE_PATH).toBe("ORIGINAL/lang/adarkroom.pot");
    expect(LOCALIZATION_TEMPLATE_MSGID_ENTRIES).toBe(773);
    expect(LOCALIZATION_LANGS_PATH).toBe("ORIGINAL/lang/langs.js");
    expect(LOCALIZATION_BABEL_CONFIG_PATH).toBe("ORIGINAL/lang/babel.cfg");
    expect(LOCALIZATION_MAIN_CSS_PATH).toBe("ORIGINAL/lang/main.css");
    expect(originalLanguageCodes).toEqual([
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
      "zh_tw",
    ]);
  });

  it("stores deferred locale inventory", () => {
    expect(originalLocaleInventory).toHaveLength(25);
    expect(originalLocaleInventory).toContainEqual({
      code: "cs",
      dataPath: "DATA/locales/cs.md",
      msgidEntries: 805,
      hasJs: true,
      hasPo: true,
      hasCss: true,
    });
    expect(originalLocaleInventory).toContainEqual({
      code: "zh_cn",
      dataPath: "DATA/locales/zh_cn.md",
      msgidEntries: 793,
      hasJs: true,
      hasPo: true,
      hasCss: true,
    });
    expect(originalDeferredLocalizationScope).toEqual({
      implementationDeferredUntil: "post-remake parity",
      reason:
        "Localization switching is preserved as inventory now and implemented after the desktop-only parity remake is complete.",
    });
  });

  it("feeds the original content registry", () => {
    expect(originalContentRegistry.audioManifest).toBe(originalAudioManifest);
    expect(originalContentRegistry.languageCodes).toBe(originalLanguageCodes);
    expect(originalContentRegistry.localeInventory).toBe(
      originalLocaleInventory,
    );
  });
});
