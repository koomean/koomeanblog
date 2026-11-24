const BLOG_PREFERENCES_KEY = 'kms_blog_preferences';

function readBlogPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(BLOG_PREFERENCES_KEY));
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}

function deviceBlogLanguage() {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.map(tag => String(tag || '').toLowerCase().split('-')[0])
    .find(code => code === 'th' || code === 'en') || 'en';
}

function blogText(thai, english) {
  return document.documentElement.lang === 'en' ? english : thai;
}

const blogLocalizedFields = [
  ['data-l10n', null],
  ...['aria-label', 'placeholder', 'title', 'alt', 'value'].map(name => ['data-l10n-'+name, name])
];
const blogLocalizedSelector = blogLocalizedFields.map(([marker]) => '['+marker+']').join(',');
const blogOriginalCopy = new WeakMap();
let blogLanguagePreference = 'auto';

function applyBlogLanguage(preference) {
  blogLanguagePreference = ['th', 'en'].includes(preference) ? preference : 'auto';
  const root = document.documentElement;
  const previous = root.lang;
  const language = blogLanguagePreference === 'auto' ? deviceBlogLanguage() : blogLanguagePreference;
  root.lang = language;

  for (const node of document.querySelectorAll(blogLocalizedSelector)) {
    let original = blogOriginalCopy.get(node);
    if (!original) blogOriginalCopy.set(node, original = new Map());
    for (const [marker, attribute] of blogLocalizedFields) {
      if (!node.hasAttribute(marker)) continue;
      if (!original.has(marker)) original.set(marker, attribute ? node.getAttribute(attribute) : node.textContent);
      const value = language === 'en' ? node.getAttribute(marker) : original.get(marker);
      if (!attribute) {
        if (node.textContent !== value) node.textContent = value;
      }
      else if (value === null) node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
    }
  }

  if (language !== previous) window.dispatchEvent(new Event('blog-language-change'));
}

window.addEventListener('languagechange', () => {
  if (blogLanguagePreference === 'auto') applyBlogLanguage('auto');
});
