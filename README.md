# DLSite网页元数据抓取

一个基于 Cloudflare Workers 的轻量级 API 服务，用于获取DLSite网页基础元数据

## ✨ 功能特性
- 智能提取网页内容
- 响应结果 JSON 格式化
- 使用 TypeScript

## API 文档
### 请求格式

#### DLSite可用
```
POST https://your-worker.example/dlsite
```

|参数|必须|类型|描述|
|--|--|--|--|
|search|是|string|选择搜索的类型(maniax/books/pro/appx/home/soft/app)|
|query|是|string|需要搜索的文本|
|results|是|int|输出的条目条数|

> 下面是可用的url合并以便获取到用户需要的内容
> 
    public const string BaseUrl = "https://www.dlsite.com/";
    string searchCategory,
    string query,
    int maxSearchResults = 100,
    SupportedLanguages language = SupportedLanguages.ja_JP

    //R18
    //同人
    "maniax" =>
        "{0}/fsr/=/language/jp/sex_category[0]/male/keyword/{1}/work_category[0]/doujin/work_category[1]/books/work_category[2]/pc/work_category[3]/app/order[0]/trend/options_and_or/and/per_page/{2}/show_type/1/from/fs.header/?locale={3}",
    // 漫画
    "books" =>
        "{0}/fsr/=/language/jp/sex_category[0]/male/keyword/{1}/work_category[0]/books/order[0]/trend/options_and_or/and/per_page/{2}/show_type/1/from/fs.header/?locale={3}",
    // 游戏
    "pro" =>
        "{0}/fsr/=/language/jp/sex_category[0]/male/keyword/{1}/work_category[0]/pc/order[0]/trend/options_and_or/and/per_page/{2}/show_type/1/from/fs.header/?locale={3}",
    // 软件
    "appx" =>
        "{0}/fsr/=/language/jp/sex_category[0]/male/keyword/{1}/order[0]/trend/options_and_or/and/per_page/{2}/show_type/1/from/fs.header/?locale={3}",

    // 全年龄
    // 同人
    "home" =>
        "{0}/fsr/=/language/jp/keyword/{1}/age_category[0]/general/work_category[0]/doujin/work_category[1]/pc/work_category[2]/app/order[0]/trend/options_and_or/and/per_page/{2}/show_type/1/from/fs.header/?locale={3}",
    // 软件
    "soft" =>
        "{0}/fsr/=/language/jp/keyword/{1}/age_category[0]/general/order[0]/trend/options_and_or/and/per_page/{2}/show_type/1/from/fs.header/?locale={3}",
    // 手机游戏
    "app" =>
        "{0}/fsr/=/language/jp/keyword/{1}/age_category[0]/general/order[0]/trend/options_and_or/and/per_page/{2}/show_type/1/from/fs.header/?locale={3}",

例如

https://your-worker.example/dlsite
search  = maniax
query   = ASMR
results = 30

https://www.dlsite.com/maniax/fsr/=/language/jp/sex_category[0]/male/keyword/ASMR/work_category[0]/doujin/work_category[1]/books/work_category[2]/pc/work_category[3]/app/order[0]/trend/options_and_or/and/per_page/30/show_type/1/from/fs.header/?locale=ja_JP


#### C#使用的示例

        query = query.Replace(" ", "+");

        searchUrl = string.Format(searchUrl, searchCategory, query, maxSearchResults, language.ToString());

        var cookies = new CookieContainer();
        cookies.Add(new Cookie("locale", "ja-jp", "/", ".dlsite.com"));
        var handler = new HttpClientHandler()
        {
            CookieContainer = cookies,
            UseCookies = true,
            SslProtocols = SslProtocols.Tls12
        };
        var client = new HttpClient(handler);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        //client.Timeout = TimeSpan.FromSeconds(20);
        Console.WriteLine(BaseUrl + searchUrl);
        var responseBody = await client.GetStringAsync(BaseUrl + searchUrl);
        

        var context = BrowsingContext.New(Configuration.Default);
        var document = await context.OpenAsync(req => req.Content(responseBody));

        var searchResults = new List<DLsiteSearchResult>();

        var searchResultsTable = document.QuerySelector(".work_1col_table.n_worklist");

        if (searchResultsTable is null) return searchResults;

        var searchResultsRows = searchResultsTable.QuerySelectorAll("tr");

        searchResults.AddRange( from row in searchResultsRows
                                let title = row.QuerySelector(".work_name a")?.Text().Trim()
                                let link = row.QuerySelector(".work_name a")?.GetAttribute("href")
                                let img = row.QuerySelector(".work_thumb img")
                                let rawExcerpt = img?.GetAttribute("data-src") ?? img?.GetAttribute("src")
                                let excerpt = NormalizeImageUrl(rawExcerpt)
                                select new DLsiteSearchResult { Title = title, Link = link, Excerpt = excerpt }
        );
