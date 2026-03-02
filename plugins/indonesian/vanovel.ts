import { CheerioAPI, load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';

class Vanovel implements Plugin.PluginBase {
  id = 'vanovel.id';
  name = 'Vanovel';
  icon = 'src/id/vanovel/icon.png';
  site = 'https://vanovel.com/';
  version = '1.0.2';

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

  async popularNovels(page = 1) {
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

  async parseChapter(chapterPath: string) {
    const result = await fetchApi(this.site + chapterPath);
    const body = await result.text();
    const $ = parseHTML(body);

    $('.adsbygoogle').remove();

    return $('.reading-content').html() || '';
  }
}

export default new Vanovel();
