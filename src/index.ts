import { parseHTML } from "linkedom";

const BASE_URL = "https://www.dlsite.com";
const TEMPLATES: Record<string, string> = {
  maniax:
    "/maniax/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/work_category[0]/doujin/work_category[1]/books/work_category[2]/pc/work_category[3]/app/order[0]/trend/options_and_or/and/per_page/{results}/show_type/1/from/fs.header/?locale={lang}",
  books:
    "/books/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/work_category[0]/books/order[0]/trend/options_and_or/and/per_page/{results}/show_type/1/from/fs.header/?locale={lang}",
  pro: "/pro/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/work_category[0]/pc/order[0]/trend/options_and_or/and/per_page/{results}/show_type/1/from/fs.header/?locale={lang}",
  appx: "/appx/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/order[0]/trend/options_and_or/and/per_page/{results}/show_type/1/from/fs.header/?locale={lang}",
  home: "/home/fsr/=/language/jp/keyword/{query}/age_category[0]/general/work_category[0]/doujin/work_category[1]/pc/work_category[2]/app/order[0]/trend/options_and_or/and/per_page/{results}/show_type/1/from/fs.header/?locale={lang}",
  soft: "/soft/fsr/=/language/jp/keyword/{query}/age_category[0]/general/order[0]/trend/options_and_or/and/per_page/{results}/show_type/1/from/fs.header/?locale={lang}",
  app: "/app/fsr/=/language/jp/keyword/{query}/age_category[0]/general/order[0]/trend/options_and_or/and/per_page/{results}/show_type/1/from/fs.header/?locale={lang}",
};

function normalizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return BASE_URL + url;
  return url;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers,
      });
    }
    const { search, query, results } = body;
    if (!search || !query || !results) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers,
      });
    }
    const template = TEMPLATES[search];
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Invalid search category" }),
        { status: 400, headers }
      );
    }
    const lang = "ja_JP";
    const encodedQuery = encodeURIComponent(query);
    const urlPath = template
      .replace(/{query}/g, encodedQuery)
      .replace(/{results}/g, String(results))
      .replace(/{lang}/g, lang);
    const fullUrl = BASE_URL + urlPath;
    try {
      const resp = await fetch(fullUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });
      const html = await resp.text();
      const { document } = parseHTML(html);
      const table = document.querySelector(".work_1col_table.n_worklist");
      if (!table) {
        return new Response(JSON.stringify([]), { status: 200, headers });
      }
      const rows = Array.from(table.querySelectorAll("tr"));
      const searchResults = rows.map((row: Element) => {
        const a = row.querySelector(".work_name a"); // 作品名
        const title = a?.textContent?.trim() || "";
        const link = a?.getAttribute("href") || "";

        const img = row.querySelector(".work_thumb img"); // 封面
        const rawImg =
          img?.getAttribute("data-src") || img?.getAttribute("src") || null;
        const image = normalizeImageUrl(rawImg);

        const b = row.querySelector(".maker_name a"); // 制作者
        const maker = b?.textContent?.trim() || "";
        const maker_link = b?.getAttribute("href") || "";

        const c = row.querySelector(".work_price_parts .work_price_base"); // 价格
        const price = c?.textContent?.trim() || "";

        const d = row.querySelector(".sales_date"); // 发布日期
        const date = d?.textContent?.trim() || "";

        return {
          title,
          link: link.startsWith("http") ? link : BASE_URL + link,
          image,
          maker,
          maker_link,
          price: price + "円",
          date,
        };
      });
      return new Response(JSON.stringify(searchResults), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers,
      });
    }
  },
};
