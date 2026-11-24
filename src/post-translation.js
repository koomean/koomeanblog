let postTranslationText = '';

function hasPostTranslationText(post) {
  return typeof post?.content === 'string' && post.content.trim() !== '';
}

function renderPostTranslationAction(post) {
  if (!hasPostTranslationText(post)) return '';
  const label = esc(blogText('แปลโพสต์', 'Translate post'));
  const text = esc(blogText('แปล', 'Translate'));
  return `<button type="button" class="act post-translate-action" data-click="openPostTranslation" data-a0="${esc(post.rowIdx)}" data-t0="string" title="${label}" aria-label="${label}"><i aria-hidden="true" class="fas fa-globe"></i><span class="post-translate-label">${text}</span></button>`;
}

function openPostTranslation(rowIdx) {
  const post = S.posts.find(item => String(item.rowIdx) === rowIdx);
  if (!hasPostTranslationText(post)) return;
  postTranslationText = post.content;
  D('post-translation-language').value = document.documentElement.lang === 'en' ? 'th' : 'en';
  openModal('post-translation-modal');
}

function closePostTranslation() {
  closeModal('post-translation-modal');
  postTranslationText = '';
}

function translatePost() {
  if (!D('post-translation-modal').classList.contains('open') || !postTranslationText) return;
  const language = D('post-translation-language').value;
  if (!language) return;

  const url = new URL('https://translate.google.com/');
  url.search = new URLSearchParams({
    sl: 'auto',
    tl: language,
    text: postTranslationText,
    op: 'translate'
  });
  window.open(url.href, '_blank', 'noopener,noreferrer');
  closePostTranslation();
}
