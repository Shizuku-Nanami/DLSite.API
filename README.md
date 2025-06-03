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

>application/json
```JSON
{"search":"maniax","query":"ASMR","results":"100"}
```

> 得到的结果
```JSON
{
  "title": "【低音ムレムレ】陸上部のデカ乳汗っかき姉妹とロッカー密着フェロモン交尾",
  "link": "https://www.dlsite.com/maniax/work/=/product_id/RJ01379611.html",
  "image": "https://img.dlsite.jp/resize/images2/work/doujin/RJ01380000/RJ01379611_img_main_240x240.jpg",
  "maker": "しゃーぷ",
  "maker_link": "https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG38133.html",
  "author": "柚木つばめ||涼花みなせ",
  "price": "1,155円",
  "date": "販売日: 2025年05月18日",
  "tags": "淫語||ASMR||手コキ||中出し||フェラチオ||オホ声",
  "text": "汗っかき姉妹のフェロモンロッカーで…濃厚匂い嗅ぎ…♪ CV柚木つばめ様・涼花みなせ様 総時間約1時間50分"
},
```
|原|译|
|--|--|
|title|标题|
|link|链接|
|image|图片链接|
|maker|社团|
|maker_link|社团链接|
|author|一般为CV/或社团外联合作者类(大概)|
|price|价钱|
|date|贩卖日期|
|tags|标签(||分隔,方便开发)|
|text|描述|
