/**
 * i18n Configuration and Utilities
 */

export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "vi", "zh", "ja", "ko"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Fallback chain: requested language -> English -> first available
export const LANGUAGE_FALLBACK_CHAIN: Record<string, string[]> = {
    zh: ["zh", "en"], // Chinese -> English
    vi: ["vi", "en"], // Vietnamese -> English
    ja: ["ja", "en"], // Japanese -> English
    ko: ["ko", "en"], // Korean -> English
    en: ["en"], // English (no fallback needed)
};

/**
 * Get fallback language chain for a given language
 */
export function getFallbackChain(language: string): string[] {
    return LANGUAGE_FALLBACK_CHAIN[language] || [language, DEFAULT_LANGUAGE];
}

/**
 * Validate if language is supported
 */
export function isSupportedLanguage(language: string): boolean {
    return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

/**
 * Get language from request (header, query, or default)
 */
export function getLanguageFromRequest(
    acceptLanguage?: string,
    queryLang?: string
): string {
    // Priority: query parameter > Accept-Language header > default
    if (queryLang && isSupportedLanguage(queryLang)) {
        return queryLang;
    }

    if (acceptLanguage) {
        // Parse Accept-Language header: "en-US,en;q=0.9,vi;q=0.8"
        const languages = acceptLanguage
            .split(",")
            .map((lang) =>
                lang.split(";")[0].trim().substring(0, 2).toLowerCase()
            );

        for (const lang of languages) {
            if (isSupportedLanguage(lang)) {
                return lang;
            }
        }
    }

    return DEFAULT_LANGUAGE;
}
