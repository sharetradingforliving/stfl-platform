import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://sharetradingforliving.com";

  const lastModified = new Date("2026-10-26");

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/company-research`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/market-intelligence`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/market-movers`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fii-dii-data`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news-sentiment`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fundamental-research`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fundamental-research/discovery`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ipo-research`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/unlisted-shares`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/corporate-actions`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/learning-centre`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/market-astrology`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/premium-research`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/research-methodology`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/editorial-policy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
