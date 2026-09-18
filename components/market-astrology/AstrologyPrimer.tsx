const astrologyTerms = [
  {
    term: "Planetary position",
    explanation:
      "The calculated location of a planet within a 360-degree zodiac circle at a particular date and time.",
  },
  {
    term: "Zodiac sign",
    explanation:
      "The zodiac is divided into 12 sections of 30 degrees each. The sign identifies the section occupied by the planet. This is astronomical positioning for research, not a personal horoscope.",
  },
  {
    term: "Direct motion",
    explanation:
      "The planet appears to move forward through the zodiac when viewed from Earth.",
  },
  {
    term: "Retrograde motion",
    explanation:
      "The planet temporarily appears to move backwards when viewed from Earth. It is an apparent motion caused by the relative movement of Earth and the planet.",
  },
  {
    term: "Planetary aspect",
    explanation:
      "A measured angular relationship between two planets. Astrology studies whether similar angular relationships repeatedly coincide with particular market conditions.",
  },
  {
    term: "Orb",
    explanation:
      "The difference between the measured angle and the exact aspect angle. A smaller orb means the alignment is closer to exact.",
  },
];

const aspectTypes = [
  {
    name: "Conjunction",
    angle: "0°",
    explanation:
      "Two planets occupy nearly the same zodiac longitude. Traditional astrology treats this as a concentration or combination of themes.",
  },
  {
    name: "Sextile",
    angle: "60°",
    explanation:
      "Two planets are approximately 60 degrees apart. Traditionally interpreted as a potentially supportive relationship.",
  },
  {
    name: "Square",
    angle: "90°",
    explanation:
      "Two planets are approximately 90 degrees apart. Traditionally associated with friction, pressure or adjustment.",
  },
  {
    name: "Trine",
    angle: "120°",
    explanation:
      "Two planets are approximately 120 degrees apart. Traditionally associated with smoother or reinforcing conditions.",
  },
  {
    name: "Opposition",
    angle: "180°",
    explanation:
      "Two planets are positioned on opposite sides of the zodiac. Traditionally associated with tension or competing forces.",
  },
];

export default function AstrologyPrimer() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/60">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Beginner guide
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              How to Read This Research
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              A plain-language explanation
              of planetary positions,
              retrograde motion, aspects
              and market-event terminology.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition group-open:border-emerald-500/40 group-open:text-emerald-300">
            Open guide
          </span>
        </summary>

        <div className="border-t border-slate-800 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {astrologyTerms.map(
              (item) => (
                <article
                  key={item.term}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
                >
                  <h3 className="font-semibold text-white">
                    {item.term}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.explanation}
                  </p>
                </article>
              )
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white">
              Common Planetary Aspects
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              These interpretations come
              from traditional astrology.
              STFL will test them against
              historical market data rather
              than assume they predict market
              behaviour.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-y border-slate-800 bg-slate-900/40">
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">
                      Aspect
                    </th>

                    <th className="px-4 py-3">
                      Exact angle
                    </th>

                    <th className="px-4 py-3">
                      Plain-language meaning
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {aspectTypes.map(
                    (aspect) => (
                      <tr key={aspect.name}>
                        <td className="px-4 py-4 font-semibold text-white">
                          {aspect.name}
                        </td>

                        <td className="px-4 py-4 font-mono text-emerald-300">
                          {aspect.angle}
                        </td>

                        <td className="px-4 py-4 text-sm leading-6 text-slate-400">
                          {
                            aspect.explanation
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <h3 className="font-semibold text-cyan-200">
              Example
            </h3>

            <p className="mt-2 text-sm leading-6 text-cyan-100/80">
              “Mars–Pluto conjunction
              with an orb of 0.13°” means
              Mars and Pluto were almost
              at the same zodiac longitude.
              The 0.13° orb shows that the
              conjunction was very close
              to exact. It does not, by
              itself, mean that a market
              crash was predicted.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MarketTerm
              title="Market Peak"
              description="The highest closing level reached before a qualifying decline begins."
            />

            <MarketTerm
              title="Market Trough"
              description="The lowest closing level reached during the detected correction or crash."
            />

            <MarketTerm
              title="Recovery"
              description="The date on which the index returns to or exceeds its previous peak."
            />
          </div>
        </div>
      </details>
    </section>
  );
}

type MarketTermProps = {
  title: string;
  description: string;
};

function MarketTerm({
  title,
  description,
}: MarketTermProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </article>
  );
}