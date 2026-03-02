import { CheerioAPI, load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';

class Vanovel implements Plugin.PluginBase {
  id = 'vanovel.id';
  name = 'Vanovel';
  icon = 'src/id/vanovel/icon.png';
  site = 'https://vanovel.com/';
  version = '1.0.0';

  parseNovels($: CheerioAPI) {
    const novels: Plugin.NovelItem[] = [];

    $('article.post').each((_, el) => {
      const name = $(el).find('.entry-title').text().trim();
      const cover = $(el).find('img').attr('src');
      const url = $(el).find('a').attr('href');

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
    const result = await fetchApi(`${this.site}page/${page}/?s`);
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

  async searchNovels(
    searchTerm: string,
    page = 1,
  ): Promise<Plugin.NovelItem[]> {
    const result = await fetchApi(
      `${this.site}page/${page}/?s=${searchTerm}`,
    );
    const body = await result.text();
    const $ = parseHTML(body);
    return this.parseNovels($);
  }
}

export default new Vanovel();
