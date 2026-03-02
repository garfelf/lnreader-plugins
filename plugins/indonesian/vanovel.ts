import { Madara } from "../../multisrc/madara/Madara"

class Vanovel extends Madara {
  id = "vanovel"
  name = "Vanovel"
  lang = "id"
  baseUrl = "https://vanovel.com"
  version = "1.0.0"

  async fetchChapters(novelUrl: string) {
    const cleanUrl = novelUrl.replace(/\/$/, "")
    const response = await this.client.get(`${cleanUrl}/chapters/?t=1`)
    const $ = this.cheerio.load(response.data)

    const chapters: { name: string; url: string }[] = []

    $(".wp-manga-chapter a").each((_, el) => {
      const name = $(el).text().trim()
      const url = $(el).attr("href")

      if (name && url) {
        chapters.push({
          name,
          url,
        })
      }
    })

    return chapters.reverse()
  }
}

export default new Vanovel()
