async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
  const result = await fetchApi(this.site + novelPath);
  const body = await result.text();
  const $ = parseHTML(body);

  const novel: Plugin.SourceNovel = {
    path: novelPath,
    name: $('.post-title h1').first().text().trim(),
    cover:
      $('.summary_image img').attr('data-src') ||
      $('.summary_image img').attr('src'),
    author: $('.author-content a').text().trim(),
    summary: $('.summary__content').text().trim(),
    status: $('.post-status .summary-content')
      .first()
      .text()
      .trim(),
    chapters: [],
  };

  // 🔥 langsung ambil dari endpoint chapter
  const chapterResult = await fetchApi(
    `${this.site}${novelPath.replace(/\/$/, '')}/ajax/chapters/`
  );

  const chapterBody = await chapterResult.text();
  const $$ = parseHTML(chapterBody);

  const chapters: Plugin.ChapterItem[] = [];

  $$('.wp-manga-chapter a').each((_, el) => {
    const name = $$(el).text().trim();
    const url = $$(el).attr('href');

    if (!url) return;

    chapters.push({
      name,
      path: url.replace(this.site, ''),
    });
  });

  novel.chapters = chapters.reverse();

  return novel;
}
