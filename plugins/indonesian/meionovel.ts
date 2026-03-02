import { CheerioAPI, load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';

class MeioNovel implements Plugin.PluginBase {
  id = 'meionovel.id';
  name = 'MeioNovel';
  icon = 'src/id/meionovel/icon.png';
  site = 'https://meionovels.com/';
  version = '1.0.1';

  parseNovels($: CheerioAPI) {
    const novels: Plugin.NovelItem[] = [];

    $('.page-item-detail').each((_, el) => {
      const anchor = $(el).find('.post-title a').first();
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

  async popularNovels(page = 1) {
    const res = await fetchApi(`${this.site}novel/?page=${page}`);
    const body = await res.text();
    const $ = parseHTML(body);
    return this.parseNovels($);
  }

  async searchNovels(searchTerm: string, page = 1) {
    const res = await fetchApi(
      `${this.site}?s=${searchTerm}&page=${page}`
    );
    const body = await res.text();
    const $ = parseHTML(body);
    return this.parseNovels($);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
  const res = await fetchApi(this.site + novelPath);
  const body = await res.text();
  const $ = parseHTML(body);

  const mangaId = $('#manga-chapters-holder').attr('data-id');

  const novel: Plugin.SourceNovel = {
    path: novelPath,
    name: $('.post-title h1').text().trim(),
    cover:
      $('.summary_image img').attr('data-src') ||
      $('.summary_image img').attr('src'),
    author: $('.author-content a').text().trim(),
    summary: $('.summary__content').text().trim(),
    status: $('.post-status .summary-content').last().text().trim(),
    chapters: [],
  };

  if (!mangaId) return novel;

  const ajaxRes = await fetchApi(
    `${this.site}wp-admin/admin-ajax.php`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': this.site,
        'Referer': this.site + novelPath,
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
      },
      body: `action=wp-manga-get-chapters&manga=${mangaId}`,
    }
  );

  const chapterHtml = await ajaxRes.text();
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

  async parseChapter(chapterPath: string) {
    const res = await fetchApi(this.site + chapterPath);
    const body = await res.text();
    const $ = parseHTML(body);

    $('.adsbygoogle').remove();

    return $('.reading-content').html() || '';
  }
}

export default new MeioNovel();
