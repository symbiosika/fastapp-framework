import TurndownService from "turndown";

export interface Article {
  headline: string;
  articleBody: string;
  articleBodyHtml: string;
  description: string;
  datePublished: string;
  datePublishedRaw: string;
  dateModified: string;
  dateModifiedRaw: string;
  authors: Author[];
  inLanguage: string;
  breadcrumbs: Breadcrumb[];
  mainImage: Image;
  images: Image[];
  url: string;
  canonicalUrl: string;
  metadata: Metadata;
}

interface Author {
  name: string;
  nameRaw: string;
}

interface Breadcrumb {
  name: string;
  url: string;
}

interface Image {
  url: string;
}

interface Metadata {
  probability: number;
  dateDownloaded: string;
}

const ZYTE_API_KEY = import.meta.env.ZYTE_API_KEY;

export async function getArticleFromUrl(url: string) {
  const response = await fetch("https://api.zyte.com/v1/extract", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(ZYTE_API_KEY + ":"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      httpResponseBody: false,
      article: true,
      articleOptions: { extractFrom: "httpResponseBody" },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}. ${response.body}`);
  }

  const data = await response.json();
  const article: Article = data.article;

  return { article };
}

export async function getMarkdownFromUrl(url: string) {
  // check if url contains http or https
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  const tds = new TurndownService();

  const response = await fetch("https://api.zyte.com/v1/extract", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(ZYTE_API_KEY + ":"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      httpResponseBody: true,
      article: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}. ${response.body}`);
  }
  const data = await response.json();
  // decode data.httpResponseBody from base64
  const html = atob(data.httpResponseBody);

  const markdown = tds.turndown(html);

  return markdown;
}
