import { CheerioAPI, load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';

class Vanovel implements Plugin.PluginBase {
  id = 'vanovel.id';
  name = 'Vanovel';
  icon = 'src/id/vanovel/icon.png';
  site = 'https://vanovel.com/';
  version = '1.0.1';

  // =========================
  // LIST / POPULAR
  // =========================

  parseNovels($: CheerioAPI) {
  const novels: Plugin.NovelItem[] = [];

  $('.page-item-detail').each((_, el) => {
    const anchor = $(el).find('.post-title h3 a').first();

    const name = anchor.text().trim();
    const url = anchor.attr('href');

    const cover =
      $(el).find('.item-thumb img').attr('data-src') ||
      $(el).find('.item-thumb img').attr('src');

    if (!url) return;

    novels.push({
      name,
      cover,
      path: url.replace(this.site, ''),
    });
  });

  return novels;
}

  async popularNovels(page = 1): Promise<Plugin.NovelItem[]> {
  const result = await fetchApi(
    `${this.site}manga/?m_orderby=views&page=${page}`
  );
  const body = await result.text();
  const $ = parseHTML(body);
  return this.parseNovels($);
}

  async searchNovels(searchTerm: string, page = 1) {
    const result = await fetchApi(
      `${this.site}?s=${searchTerm}&post_type=wp-manga&page=${page}`
    );
    const body = await result.text();
    const $ = parseHTML(body);
    return this.parseNovels($);
  }

  // =========================
  // DETAIL NOVEL
  // =========================

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const result = await fetchApi(this.site + novelPath);
    const body = await result.text();
    const $ = parseHTML(body);

    const mangaId = $('#manga-chapters-holder').attr('data-id');
console.log('MANGA ID:', mangaId);
    
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

  // =========================
  // CHAPTER CONTENT
  // =========================

  async parseChapter(chapterPath: string): Promise<string> {
    const result = await fetchApi(this.site + chapterPath);
    const body = await result.text();
    const $ = parseHTML(body);

    $('.adsbygoogle').remove();

    return $('.reading-content').html() || '';
  }
}

export default new Vanovel();
