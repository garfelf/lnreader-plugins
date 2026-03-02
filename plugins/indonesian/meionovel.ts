import { Madara } from "../../multisrc/madara"

class MeioNovel extends Madara {
  id = "meionovel"
  name = "MeioNovel"
  lang = "id"
  baseUrl = "https://meionovels.com"
  version = "1.0.1"

  async fetchChapters(novelUrl: string) {
    const response = await this.client.get(novelUrl)
    const $ = this.cheerio.load(response.data)

    const mangaId = $("#manga-chapters-holder").attr("data-id")
    if (!mangaId) return []

    const ajax = await this.client.post(
      `${this.baseUrl}/wp-admin/admin-ajax.php`,
      `action=wp-manga-get-chapters&manga=${mangaId}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    )

    const $$ = this.cheerio.load(ajax.data)
    const chapters = []

    $$(".wp-manga-chapter a").each((_, el) => {
      const name = $$(el).text().trim()
      const url = $$(el).attr("href")

      if (url) {
        chapters.push({
          name,
          url
        })
      }
    })

    return chapters.reverse()
  }
}

export default new MeioNovel()