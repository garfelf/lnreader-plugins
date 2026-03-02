import { CheerioAPI, load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';

class Vanovel implements Plugin.PluginBase {
  id = 'vanovel.id';
  name = 'Vanovel';
  icon = 'src/id/vanovel/icon.png';
  site = 'https://vanovel.com/';
  version = '1.0.0';

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
  const result = await fetchApi(this.site + novelPath);
  const body = await result.text();
  const $ = parseHTML(body);

  const novel: Plugin.SourceNovel = {
    path: novelPath,
    name: $('.post-title h1').first().text().trim(),
    cover: $('.summary_image img').attr('data-src') || 
           $('.summary_image img').attr('src'),
    author: $('.author-content a').text().trim(),
    summary: $('.summary__content').text().trim(),
    status: $('.post-status .summary-content')
      .first()
      .text()
      .trim(),
    chapters: [],
  };

  // 🔥 IMPORTANT: ambil daftar chapter dari AJAX endpoint
  const mangaId = $('#manga-chapters-holder').attr('data-id');

  if (!mangaId) return novel;

  const ajax = await fetchApi(
    `${this.site}wp-admin/admin-ajax.php`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `action=wp-manga-get-chapters&manga=${mangaId}`,
    },
  );

  const chapterHtml = await ajax.text();
  const $$ = parseHTML(chapterHtml);

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

  async popularNovels(page = 1): Promise<Plugin.NovelItem[]> {
  const result = await fetchApi(
    `${this.site}manga/?page=${page}&m_orderby=views`
  );
  const body = await result.text();
  const $ = parseHTML(body);
  return this.parseNovels($);
}

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const result = await fetchApi(this.site + novelPath);
    const body = await result.text();
    const $ = parseHTML(body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('.post-title h1').text().trim() || 'Untitled',
      cover: $('.summary_image img').attr('src'),
      author: $('.author-content a').text().trim(),
      summary: $('.summary__content').text().trim(),
      status: $('.post-status .summary-content').text().trim(),
      chapters: [],
    };

    const chapterResult = await fetchApi(
      `${this.site}${novelPath.replace(/\/$/, '')}/chapters/?t=1`,
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

  async parseChapter(chapterPath: string): Promise<string> {
    const result = await fetchApi(this.site + chapterPath);
    const body = await result.text();
    const $ = parseHTML(body);

    $('.adsbygoogle').remove();

    return $('.reading-content').html() || '';
  }

  async searchNovels(searchTerm: string, page = 1) {
  const result = await fetchApi(
    `${this.site}?s=${searchTerm}&post_type=wp-manga&page=${page}`
  );
  const body = await result.text();
  const $ = parseHTML(body);
  return this.parseNovels($);
}
}

export default new Vanovel();
