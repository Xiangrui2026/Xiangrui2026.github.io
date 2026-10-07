(() => {
  const root = document.querySelector('.site-search-page');
  if (!root) return;

  const form = root.querySelector('.site-search-form');
  const input = root.querySelector('.site-search-input');
  const status = root.querySelector('.site-search-status');
  const results = root.querySelector('.site-search-results');
  let entries = [];

  const normalize = value => (value || '').toLocaleLowerCase();

  function addHighlightedText(container, text, terms) {
    const matches = [];
    const folded = normalize(text);
    terms.forEach(term => {
      let from = 0;
      let at;
      while ((at = folded.indexOf(term, from)) !== -1) {
        matches.push({ start: at, end: at + term.length });
        from = at + term.length;
      }
    });
    matches.sort((a, b) => a.start - b.start || b.end - a.end);

    let cursor = 0;
    for (const match of matches) {
      if (match.start < cursor) continue;
      container.append(document.createTextNode(text.slice(cursor, match.start)));
      const mark = document.createElement('mark');
      mark.textContent = text.slice(match.start, match.end);
      container.append(mark);
      cursor = match.end;
    }
    container.append(document.createTextNode(text.slice(cursor)));
  }

  function makeExcerpt(entry, terms) {
    const content = entry.content.replace(/\s+/g, ' ').trim();
    const positions = terms.map(term => normalize(content).indexOf(term)).filter(index => index >= 0);
    if (!positions.length) return content.slice(0, 180);
    const start = Math.max(0, Math.min(...positions) - 55);
    const end = Math.min(content.length, start + 180);
    return `${start ? '…' : ''}${content.slice(start, end)}${end < content.length ? '…' : ''}`;
  }

  function search() {
    const query = input.value.trim();
    const terms = [...new Set(normalize(query).split(/[\s-]+/).filter(Boolean))];
    results.replaceChildren();

    if (!terms.length) {
      status.textContent = '输入关键词开始搜索。';
      return;
    }

    const matches = entries.map(entry => {
      const title = normalize(entry.title);
      const content = normalize(entry.content);
      const found = terms.filter(term => title.includes(term) || content.includes(term));
      if (found.length !== terms.length) return null;
      const score = found.reduce((total, term) => total + (title.includes(term) ? 10 : 1), 0);
      return { entry, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

    if (!matches.length) {
      status.textContent = `没有找到与“${query}”相关的内容。`;
      return;
    }

    status.textContent = `找到 ${matches.length} 条结果。`;
    for (const { entry } of matches) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      const target = new URL(entry.url, window.location.origin);
      if (target.origin !== window.location.origin) continue;
      link.href = target.href;
      link.className = 'site-search-result-title';
      addHighlightedText(link, entry.title, terms);

      const excerpt = document.createElement('p');
      addHighlightedText(excerpt, makeExcerpt(entry, terms), terms);
      item.append(link, excerpt);
      results.append(item);
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    search();
  });
  input.addEventListener('input', search);
  form.addEventListener('reset', () => requestAnimationFrame(search));

  const query = new URLSearchParams(window.location.search).get('q');
  if (query) input.value = query;

  fetch(root.dataset.indexUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(source => {
      const xml = new DOMParser().parseFromString(source, 'application/xml');
      if (xml.querySelector('parsererror')) throw new Error('Invalid search index');
      entries = [...xml.querySelectorAll('entry')].map(entry => ({
        title: entry.querySelector('title')?.textContent.trim() || '',
        url: entry.querySelector('url')?.textContent.trim() || '',
        content: entry.querySelector('content')?.textContent.replace(/<[^>]*>/g, ' ').trim() || ''
      })).filter(entry => entry.title && entry.url);
      status.textContent = '输入关键词开始搜索。';
      if (input.value.trim()) search();
    })
    .catch(() => {
      status.textContent = '搜索索引加载失败，请稍后重试。';
    });
})();
