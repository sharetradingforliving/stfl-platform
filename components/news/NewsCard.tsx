import Link from "next/link";
import { NewsArticle } from "@/lib/news/types";

type NewsCardProps = {
  title: string;
  badge?: string;
  news: NewsArticle[];
  viewMoreLink?: string;
};

export default function NewsCard({
  title,
  badge,
  news,
  viewMoreLink = "/news",
}: NewsCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          {title}
        </h3>

        {badge && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {news.length === 0 ? (
          <p className="text-slate-400">
            No news available.
          </p>
        ) : (
          <>
            {news.slice(0, 10).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-slate-800 p-4 transition hover:border-emerald-500/40"
              >
                <h4 className="font-medium text-white">
                  {item.headline}
                </h4>

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>{item.source}</span>

                  <span>
                    {new Date(item.publishedAt).toLocaleString()}
                  </span>
                </div>
              </a>
            ))}

            {news.length > 10 && (
              <div className="pt-2 text-center">
                <Link
                  href={viewMoreLink}
                  className="inline-block rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
                >
                  View More →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}