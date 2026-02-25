"""
MarianMT Multi-Language Translator
Models: Helsinki-NLP/opus-mt-en-{hi, fr, es, de, zh}
Task: English text → target language

Models are lazy-loaded: only the requested language's model is loaded on first use
and then cached in memory to save RAM.
"""
from transformers import MarianMTModel, MarianTokenizer
from typing import Dict, Optional

SUPPORTED_LANGUAGES: Dict[str, str] = {
    "hi": "Helsinki-NLP/opus-mt-en-hi",   # Hindi
    "fr": "Helsinki-NLP/opus-mt-en-fr",   # French
    "es": "Helsinki-NLP/opus-mt-en-es",   # Spanish
    "de": "Helsinki-NLP/opus-mt-en-de",   # German
    "zh": "Helsinki-NLP/opus-mt-en-zh",   # Chinese
}


class TranslatorModel:
    def __init__(self):
        self._cache: Dict[str, tuple] = {}   # lang_code → (tokenizer, model)
        print("  ✅ Translator ready (lazy-loading per language).")

    def _load(self, lang_code: str):
        """Load and cache a language model on first use."""
        if lang_code not in self._cache:
            model_id = SUPPORTED_LANGUAGES[lang_code]
            print(f"  📥 Loading MarianMT ({model_id})...")
            tokenizer = MarianTokenizer.from_pretrained(model_id)
            model     = MarianMTModel.from_pretrained(model_id)
            model.eval()
            self._cache[lang_code] = (tokenizer, model)
            print(f"  ✅ MarianMT {lang_code} ready.")
        return self._cache[lang_code]

    def translate(self, text: str, target_lang: str) -> Optional[str]:
        """
        Translate English text into the target language.
        
        Args:
            text: English source text
            target_lang: ISO 639-1 code — one of: hi, fr, es, de, zh
            
        Returns:
            Translated string, or None if lang not supported.
        """
        if target_lang == "en":
            return text   # No translation needed

        if target_lang not in SUPPORTED_LANGUAGES:
            print(f"  ⚠️  Unsupported language: {target_lang}")
            return None

        try:
            tokenizer, model = self._load(target_lang)
            inputs = tokenizer([text], return_tensors="pt", padding=True, truncation=True, max_length=512)
            import torch
            with torch.no_grad():
                translated = model.generate(**inputs)
            decoded = tokenizer.decode(translated[0], skip_special_tokens=True)
            return decoded

        except Exception as e:
            print(f"  ⚠️  Translation error ({target_lang}): {e}")
            return text   # Fallback to original English

    @property
    def supported_languages(self):
        return list(SUPPORTED_LANGUAGES.keys()) + ["en"]
