import { load } from "cheerio"
import { fetchApi } from "../../utils"
import { Plugin } from "../../types"

export default class MeioNovel implements Plugin.PluginBase {
  id = "meionovel"
  name = "MeioNovel"
  lang = "id"
  site = "https://meionovels.com/"
  version = "1.0.1"

  async parseNovel(novelPath: string) {
    const res = await fetchApi(this.site + novelPath)
    const html = await res.text()
    const $ = load(html)

    const mangaId = $("#manga-chapters-holder").attr("data-id")
    if (!mangaId) return { chapters: [] }

    const ajaxRes = await fetchApi(
      this.site + "wp-admin/admin-ajax.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Referer": this.site + novelPath,
        },
        body: `action=wp-manga-get-chapters&manga=${mangaId}`,
      }
    )

    const chapterHtml = await ajaxRes.text()
    const $$ = load(chapterHtml)

    const chapters: Plugin.Chapter[] = []

    $$(".wp-manga-chapter a").each((_, el) => {
      const name = $$(el).text().trim()
      const href = $$(el).attr("href")

      if (href) {
        chapters.push({
          name,
          path: href.replace(this.site, ""),
        })
      }
    })

    return { chapters }
  }

  async parseChapter(chapterPath: string) {
    const res = await fetchApi(this.site + chapterPath)
    const html = await res.text()
    const $ = load(html)

    const content: string[] = []

    $(".reading-content p, .entry-content p").each((_, el) => {
      const text = $(el).text().trim()
      if (text) content.push(text)
    })

    return content
  }
}