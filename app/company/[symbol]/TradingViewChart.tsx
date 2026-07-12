"use client";

import { useEffect, useRef } from "react";

type TradingViewChartProps = {
  symbol: string;
  exchange: "NSE" | "BSE";
};

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewChart({
  symbol,
  exchange,
}: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = "";

    const widget = document.createElement("div");
    widget.id = "tv_chart_container";
    widget.style.height = "700px";
    widget.style.width = "100%";

    container.current.appendChild(widget);

    const script = document.createElement("script");

    script.src = "https://s3.tradingview.com/tv.js";

    script.onload = () => {
      if (!window.TradingView) return;

      new window.TradingView.widget({
        autosize: true,
        symbol: `${exchange}:${symbol}`,
        interval: "D",
        timezone: "Asia/Kolkata",
        theme: "dark",
        style: "1",
        locale: "en",
        container_id: "tv_chart_container",
        hide_side_toolbar: false,
        withdateranges: true,
        allow_symbol_change: false,
      });
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [symbol, exchange]);

  return (
    <div
      ref={container}
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
    />
  );
}