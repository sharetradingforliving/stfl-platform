"use client";

import {

  useRouter,

} from "next/navigation";

import Link from "next/link";



import {

  FormEvent,

  useEffect,

  useMemo,

  useState,

} from "react";





type NullableNumber =

  number | null;





type LatestPrice = {

  observation_date: string;

  indicative_price: number;

  price_low: NullableNumber;

  price_high: NullableNumber;

  buy_price: NullableNumber;

  sell_price: NullableNumber;

  quote_type: string;

  minimum_lot: number | null;

  source: string;

  source_url: string | null;

  verification_status: string;

  notes: string | null;

};





type LatestFinancial = {

  period_end: string;

  period_type: string;

  currency: string;

  unit: string;

  revenue: NullableNumber;

  ebitda: NullableNumber;

  profit_after_tax: NullableNumber;

  total_assets: NullableNumber;

  net_worth: NullableNumber;

  total_debt: NullableNumber;

  operating_cash_flow: NullableNumber;

  earnings_per_share: NullableNumber;

  book_value_per_share: NullableNumber;

  roe_percent: NullableNumber;

  roce_percent: NullableNumber;

  debt_to_equity: NullableNumber;

  source: string;

  source_url: string | null;

  is_audited: boolean;

};





type ValuationSummary = {

  implied_market_cap_cr:

    NullableNumber;

  price_to_earnings:

    NullableNumber;

  price_to_book:

    NullableNumber;

  earnings_yield_percent:

    NullableNumber;

  price_observation_date:

    string | null;

  financial_period_end:

    string | null;

};





type UnlistedCompany = {

  id: number;

  slug: string;

  company_name: string;

  short_name: string | null;

  cin: string | null;

  isin: string | null;

  sector: string | null;

  industry: string | null;

  company_status: string;

  face_value: NullableNumber;

  outstanding_shares:

    NullableNumber;

  data_confidence: string;

  latest_price:

    LatestPrice | null;

  latest_financial:

    LatestFinancial | null;

  valuation: ValuationSummary;

};





type UnlistedCompanyResponse = {

  status: string;

  total: number;

  page: number;

  page_size: number;

  total_pages: number;

  companies: UnlistedCompany[];

  disclaimer: string;

  generated_at: string;

  error?: string;

};





const PAGE_SIZE = 10;





const STATUS_OPTIONS = [

  {

    value: "All",

    label: "All statuses",

  },

  {

    value: "UNLISTED",

    label: "Unlisted",

  },

  {

    value: "PRE_IPO",

    label: "Pre-IPO",

  },

  {

    value: "DELISTED",

    label: "Delisted",

  },

] as const;





function formatDate(

  value: string | null

): string {

  if (!value) {

    return "Not available";

  }



  const parsed = new Date(

    `${value}T00:00:00+05:30`

  );



  if (

    Number.isNaN(

      parsed.getTime()

    )

  ) {

    return value;

  }



  return new Intl.DateTimeFormat(

    "en-IN",

    {

      day: "2-digit",

      month: "short",

      year: "numeric",

      timeZone: "Asia/Kolkata",

    }

  ).format(parsed);

}





function formatDateTime(

  value: string

): string {

  const parsed = new Date(value);



  if (

    Number.isNaN(

      parsed.getTime()

    )

  ) {

    return value;

  }



  return new Intl.DateTimeFormat(

    "en-IN",

    {

      day: "2-digit",

      month: "short",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",

      timeZone: "Asia/Kolkata",

    }

  ).format(parsed);

}





function formatPrice(

  value: NullableNumber

): string {

  if (value === null) {

    return "Not available";

  }



  return value.toLocaleString(

    "en-IN",

    {

      style: "currency",

      currency: "INR",

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,

    }

  );

}





function formatCrores(

  value: NullableNumber

): string {

  if (value === null) {

    return "Not available";

  }



  return `₹${value.toLocaleString(

    "en-IN",

    {

      maximumFractionDigits: 2,

    }

  )} Cr`;

}





function formatMultiple(

  value: NullableNumber

): string {

  if (value === null) {

    return "Not meaningful";

  }



  return `${value.toFixed(2)}×`;

}





function formatStatus(

  value: string

): string {

  return value

    .toLowerCase()

    .split("_")

    .map(

      (word) =>

        word.charAt(0).toUpperCase() +

        word.slice(1)

    )

    .join(" ");

}





function confidenceClasses(

  value: string

): string {

  switch (

    value.toUpperCase()

  ) {

    case "HIGH":

      return (

        "border-emerald-500/30 " +

        "bg-emerald-500/10 " +

        "text-emerald-300"

      );



    case "MEDIUM":

      return (

        "border-amber-500/30 " +

        "bg-amber-500/10 " +

        "text-amber-300"

      );



    default:

      return (

        "border-slate-700 " +

        "bg-slate-800 " +

        "text-slate-400"

      );

  }

}





const UNLISTED_SECTORS = [
  "Communication Services",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Financial Services",
  "Healthcare",
  "Industrials",
  "Information Technology",
  "Materials",
  "Real Estate",
  "Utilities",
] as const;

const UNLISTED_INDUSTRIES_BY_SECTOR: Record<
  string,
  readonly string[]
> = {
  "Communication Services": [
    "Publishing",
    "Sports & Entertainment",
  ],
  "Consumer Discretionary": [
    "Apparel & Fashion",
    "Auto Components",
    "Consumer Durables",
    "Consumer Electronics",
    "Electric Vehicle Components",
    "Fashion Retail",
    "Home Furnishings",
    "Hotels & Resorts",
    "Hotels & Travel",
    "Interior Products",
    "Lighting Products",
    "Quick Service Restaurants",
    "Restaurants",
    "Retail",
    "Textiles",
  ],
  "Consumer Staples": [
    "Agricultural Products",
    "Brewers",
    "Distillers & Brewers",
    "Packaged Foods",
    "Quick Commerce",
  ],
  Energy: [
    "Oil Refining & Marketing",
    "Oilfield Services",
  ],
  "Financial Services": [
    "Asset Management",
    "Banking",
    "Commodity Exchange",
    "Commodity Exchange Technology",
    "Commodity Repository",
    "Custody & Depository Services",
    "Digital Assets",
    "Financial Holding Company",
    "Fintech & Payments",
    "Gas Exchange",
    "General Insurance",
    "Health Insurance",
    "Holding Company",
    "Housing Finance",
    "Investment Company",
    "Leasing & Finance",
    "Microfinance",
    "Non-Banking Finance",
    "Power Exchange",
    "Securities Broking",
    "Stock Exchange",
    "Structured Finance",
    "Vehicle Finance",
  ],
  Healthcare: [
    "Clinical Research",
    "Hospitals",
    "Medical Devices",
    "Medical Textiles",
    "Online Pharmacy",
    "Pharmaceuticals",
  ],
  Industrials: [
    "Advanced Composites",
    "Aerospace & Defence",
    "Aerospace Components",
    "Airport Services",
    "Aviation Services",
    "B2B Commerce",
    "Business Services",
    "Carbon & Graphite Products",
    "Construction Materials Marketplace",
    "Digital Manufacturing",
    "Diversified Manufacturing",
    "Diversified Services",
    "Diversified Trading",
    "Electrical Equipment",
    "Elevators & Escalators",
    "Engineering",
    "Engineering & Construction",
    "Environmental Engineering",
    "Environmental Services",
    "Equipment Rental",
    "Facility Management Services",
    "Fasteners",
    "Heavy Engineering",
    "Hydrogen Equipment",
    "Industrial Engineering",
    "Industrial Machinery",
    "Infrastructure Development",
    "Railway Equipment",
    "Recycling Services",
    "Shipbuilding",
    "Shipping & Marine Services",
  ],
  "Information Technology": [
    "Artificial Intelligence",
    "Clean Energy Electronics",
    "Consumer Electronics",
    "Cybersecurity",
    "Digital Solutions",
    "Education Technology",
    "Electronics Manufacturing",
    "Financial Technology",
    "IT Services",
    "Security & Surveillance Systems",
    "Semiconductors",
    "Simulation Software",
    "Software Services",
    "Solar Technology",
    "Technology Services",
    "Telecom & Network Services",
  ],
  Materials: [
    "Building Products",
    "Carbon & Graphite Products",
    "Ferro Alloys",
    "Fertilizers & Agri Inputs",
    "Industrial Minerals",
    "Metals & Mining",
    "Packaging",
    "Plastics & Resins",
    "Refractories",
    "Specialty Chemicals",
    "Steel",
    "Textile Materials",
  ],
  "Real Estate": [
    "Coworking Spaces",
    "Exhibition & Convention Centres",
    "Property Technology",
    "Student Housing",
  ],
  Utilities: [
    "Gas Distribution",
    "Power Transmission",
    "Renewable Gas",
    "Renewable Power",
    "Solar Power",
    "Water Infrastructure",
    "Water Treatment",
  ],
};


export default function UnlistedSharesPage() {
  const router = useRouter();

  const [
    activeSuggestionIndex,
    setActiveSuggestionIndex,
  ] = useState(-1);

  const [

    searchInput,

    setSearchInput,

  ] = useState("");



  const [

    appliedSearch,

    setAppliedSearch,

  ] = useState("");



  const [

    sector,

    setSector,

  ] = useState("All Sectors");



  const [

    industry,

    setIndustry,

  ] = useState("All Industries");



  const [

    companyStatus,

    setCompanyStatus,

  ] = useState("All");



  const [

    page,

    setPage,

  ] = useState(1);



  const [

    data,

    setData,

  ] = useState<

    UnlistedCompanyResponse | null

  >(null);



  const [

    loading,

    setLoading,

  ] = useState(true);



  const [

    error,

    setError,

  ] = useState("");





  useEffect(() => {

    const controller =

      new AbortController();



    async function loadCompanies() {

      setLoading(true);

      setError("");



      try {

        const query =

          new URLSearchParams({

            search: appliedSearch,

            sector,

            industry,

            status: companyStatus,

            page: String(page),

            pageSize:

              String(PAGE_SIZE),

          });



        const response = await fetch(

          `/api/unlisted-shares?${query.toString()}`,

          {

            method: "GET",

            cache: "no-store",

            signal:

              controller.signal,

            headers: {

              Accept:

                "application/json",

            },

          }

        );



        const responseText =

          await response.text();



        let payload:

          UnlistedCompanyResponse;



        try {

          payload = JSON.parse(

            responseText

          ) as

            UnlistedCompanyResponse;

        } catch {

          throw new Error(

            "The unlisted-share service returned an invalid response."

          );

        }



        if (!response.ok) {

          throw new Error(

            payload.error ??

            "Unable to retrieve unlisted shares."

          );

        }



        setData(payload);

      } catch (requestError) {

        if (

          requestError instanceof

            DOMException &&

          requestError.name ===

            "AbortError"

        ) {

          return;

        }



        setError(

          requestError instanceof

            Error

            ? requestError.message

            : "Unable to retrieve unlisted shares."

        );

      } finally {

        if (

          !controller.signal.aborted

        ) {

          setLoading(false);

        }

      }

    }



    loadCompanies();



    return () => {

      controller.abort();

    };

  }, [

    appliedSearch,

    sector,

    industry,

    companyStatus,

    page,

  ]);





  const visiblePages =

    useMemo(() => {

      const totalPages =

        data?.total_pages ?? 0;



      if (totalPages <= 0) {

        return [];

      }



      const maximumPages = 5;



      let firstPage = Math.max(

        1,

        page -

          Math.floor(

            maximumPages / 2

          )

      );



      if (

        firstPage +

          maximumPages -

          1 >

        totalPages

      ) {

        firstPage = Math.max(

          1,

          totalPages -

            maximumPages +

            1

        );

      }



      const lastPage = Math.min(

        totalPages,

        firstPage +

          maximumPages -

          1

      );



      return Array.from(

        {

          length:

            lastPage -

            firstPage +

            1,

        },

        (_, index) =>

          firstPage + index

      );

    }, [

      data?.total_pages,

      page,

    ]);





  const rangeText = useMemo(() => {

    if (

      !data ||

      data.total === 0

    ) {

      return "0 companies";

    }



    const first =

      (data.page - 1) *

        data.page_size +

      1;



    const last = Math.min(

      data.total,

      first +

        data.companies.length -

        1

    );



    return (

      `${first}-${last} of ` +

      `${data.total} companies`

    );

  }, [data]);





  function submitSearch(

    event: FormEvent

  ) {

    event.preventDefault();

    setPage(1);

    setAppliedSearch(

      searchInput.trim()

    );

  }





  function resetFilters() {

    setSearchInput("");

    setAppliedSearch("");

    setSector("All Sectors");

    setIndustry("All Industries");

    setCompanyStatus("All");

    setPage(1);

    setActiveSuggestionIndex(-1);

  }

  const searchSuggestions =

    data?.companies.slice(0, 8) ??

    [];



  return (

    <main className="min-h-screen bg-[#020817] text-white">

      <section className="border-b border-slate-800/80 bg-slate-950/70">

        <div className="mx-auto max-w-[1500px] px-5 py-12 md:px-8">

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">

            Market Research

          </p>



          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">

            Unlisted Shares

          </h1>



          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400 md:text-base">

            Research unlisted,

            pre-IPO and delisted

            companies using dated

            indicative price

            observations, audited

            financial statements and

            transparent valuation

            metrics.

          </p>



          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-6 text-amber-100/70">

            Prices shown here are

            indicative observations,

            not live exchange prices

            or executable quotations.

          </div>

        </div>

      </section>



      <section className="mx-auto max-w-[1500px] px-5 py-8 md:px-8">

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">

          <div className="border-b border-slate-800 p-5">

            <form

              onSubmit={submitSearch}

              className="grid gap-4 lg:grid-cols-[minmax(250px,1.4fr)_minmax(170px,0.75fr)_minmax(190px,0.85fr)_minmax(160px,0.7fr)_auto]"

            >

              <div className="relative block">

                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">

                  Company

                </span>



                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => {
                    const value = event.target.value;

                    setSearchInput(value);
                    setAppliedSearch(value.trim());
                    setPage(1);
                    setActiveSuggestionIndex(-1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setActiveSuggestionIndex(-1);
                      return;
                    }

                    if (searchSuggestions.length === 0) {
                      return;
                    }

                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveSuggestionIndex((current) =>
                        Math.min(
                          current + 1,
                          searchSuggestions.length - 1
                        )
                      );
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveSuggestionIndex((current) =>
                        current <= 0
                          ? searchSuggestions.length - 1
                          : current - 1
                      );
                    } else if (
                      event.key === "Enter" &&
                      activeSuggestionIndex >= 0
                    ) {
                      event.preventDefault();
                      router.push(
                        `/unlisted-shares/${searchSuggestions[activeSuggestionIndex].slug}`
                      );
                    }
                  }}
                  placeholder="Search company, CIN or ISIN"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={searchInput.trim().length >= 2}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/70"
                />

                {searchInput.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
                    {loading ? (
                      <p className="px-4 py-3 text-sm text-slate-400">
                        Searching companies…
                      </p>
                    ) : searchSuggestions.length > 0 ? (
                      searchSuggestions.map((company, index) => (
                        <Link
                          key={company.id}
                          href={`/unlisted-shares/${company.slug}`}
                          onMouseEnter={() =>
                            setActiveSuggestionIndex(index)
                          }
                          className={`block border-b border-slate-800 px-4 py-3 transition last:border-b-0 ${
                            index === activeSuggestionIndex
                              ? "bg-amber-400/10"
                              : "hover:bg-slate-900"
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">
                            {company.company_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {company.sector ?? "Sector not classified"}
                            {" • "}
                            {formatStatus(company.company_status)}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-slate-500">
                        No matching companies found.
                      </p>
                    )}
                  </div>
                )}

              </div>



              <label className="block">

                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">

                  Sector

                </span>



                <select

                  value={sector}

                  onChange={(

                    event

                  ) => {

                    setSector(

                      event.target.value

                    );

                    setIndustry(

                      "All Industries"

                    );

                    setPage(1);

                  }}

                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-400/70"

                >

                  <option value="All Sectors">

                    All sectors

                  </option>



                  {UNLISTED_SECTORS.map((sectorOption) => (
                    <option
                      key={sectorOption}
                      value={sectorOption}
                    >
                      {sectorOption}
                    </option>
                  ))}

                </select>

              </label>



              <label className="block">

                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">

                  Industry

                </span>



                <select

                  value={industry}

                  onChange={(

                    event

                  ) => {

                    setIndustry(

                      event.target.value

                    );

                    setPage(1);

                  }}

                  disabled={

                    sector === "All Sectors"

                  }

                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-amber-400/70"

                >

                  <option value="All Industries">

                    All industries

                  </option>



                  {(UNLISTED_INDUSTRIES_BY_SECTOR[

                    sector

                  ] ?? []).map((industryOption) => (

                    <option

                      key={industryOption}

                      value={industryOption}

                    >

                      {industryOption}

                    </option>

                  ))}

                </select>

              </label>



              <label className="block">

                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">

                  Status

                </span>



                <select

                  value={companyStatus}

                  onChange={(

                    event

                  ) => {

                    setCompanyStatus(

                      event.target.value

                    );

                    setPage(1);

                  }}

                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-400/70"

                >

                  {STATUS_OPTIONS.map(

                    (option) => (

                      <option

                        key={

                          option.value

                        }

                        value={

                          option.value

                        }

                      >

                        {option.label}

                      </option>

                    )

                  )}

                </select>

              </label>



              <div className="flex items-end gap-2">

                <button

                  type="submit"

                  className="h-11 rounded-xl bg-amber-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"

                >

                  Search

                </button>



                <button

                  type="button"

                  onClick={

                    resetFilters

                  }

                  className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"

                >

                  Reset

                </button>

              </div>

            </form>

          </div>



          {error ? (

            <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">

              {error}

            </div>

          ) : null}



          <div className="overflow-x-auto">

            <table className="min-w-[1250px] divide-y divide-slate-800 text-left">

              <thead className="bg-slate-950/70">

                <tr className="text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-5 py-4 font-medium">

                    Company

                  </th>



                  <th className="px-5 py-4 font-medium">

                    Status

                  </th>



                  <th className="px-5 py-4 font-medium">

                    Indicative price

                  </th>



                  <th className="px-5 py-4 font-medium">

                    Implied market cap

                  </th>



                  <th className="px-5 py-4 font-medium">

                    P/E

                  </th>



                  <th className="px-5 py-4 font-medium">

                    P/B

                  </th>



                  <th className="px-5 py-4 font-medium">

                    Latest financial

                  </th>



                  <th className="px-5 py-4 font-medium">

                    Confidence

                  </th>



                  <th className="px-5 py-4 font-medium">

                    Research

                  </th>

                </tr>

              </thead>



              <tbody className="divide-y divide-slate-800/80">

                {loading ? (

                  <tr>

                    <td

                      colSpan={9}

                      className="px-5 py-16 text-center text-sm text-slate-500"

                    >

                      Loading unlisted

                      companies...

                    </td>

                  </tr>

                ) : data?.companies

                    .length ? (

                  data.companies.map(

                    (company) => (

                      <tr

                        key={company.id}

                        className="align-top transition hover:bg-slate-800/30"

                      >

                        <td className="px-5 py-5">

                          <p className="font-semibold text-white">

                            {

                              company.short_name ??

                              company.company_name

                            }

                          </p>



                          <p className="mt-1 max-w-[250px] text-xs leading-5 text-slate-400">

                            {

                              company.company_name

                            }

                          </p>



                          <p className="mt-1 text-[11px] text-slate-600">

                            {company.isin ??

                              "ISIN unavailable"}

                          </p>

                        </td>



                        <td className="px-5 py-5">

                          <span className="inline-flex whitespace-nowrap rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">

                            {formatStatus(

                              company.company_status

                            )}

                          </span>

                        </td>



                        <td className="px-5 py-5">

                          {company.latest_price ? (

                            <>

                              <p className="font-bold text-emerald-300">

                                {formatPrice(

                                  company.latest_price.indicative_price

                                )}

                              </p>



                              <p className="mt-1 whitespace-nowrap text-xs text-slate-500">

                                {formatDate(

                                  company.latest_price.observation_date

                                )}

                              </p>



                              <p className="mt-1 max-w-[180px] text-[11px] text-slate-600">

                                {

                                  company.latest_price.source

                                }

                              </p>

                            </>

                          ) : (

                            <span className="text-sm text-slate-600">

                              Not available

                            </span>

                          )}

                        </td>



                        <td className="whitespace-nowrap px-5 py-5 text-sm font-semibold text-white">

                          {formatCrores(

                            company.valuation.implied_market_cap_cr

                          )}

                        </td>



                        <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-300">

                          {formatMultiple(

                            company.valuation.price_to_earnings

                          )}

                        </td>



                        <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-300">

                          {formatMultiple(

                            company.valuation.price_to_book

                          )}

                        </td>



                        <td className="px-5 py-5">

                          {company.latest_financial ? (

                            <>

                              <p className="whitespace-nowrap text-sm text-slate-300">

                                {formatDate(

                                  company.latest_financial.period_end

                                )}

                              </p>



                              <p

                                className={`mt-1 text-xs font-medium ${

                                  company.latest_financial.profit_after_tax !==

                                    null &&

                                  company.latest_financial.profit_after_tax <

                                    0

                                    ? "text-red-300"

                                    : "text-emerald-300"

                                }`}

                              >

                                PAT{" "}

                                {formatCrores(

                                  company.latest_financial.profit_after_tax

                                )}

                              </p>



                              <p className="mt-1 text-[11px] text-slate-600">

                                {company.latest_financial.is_audited

                                  ? "Audited"

                                  : "Unaudited"}

                              </p>

                            </>

                          ) : (

                            <span className="text-sm text-slate-600">

                              Not available

                            </span>

                          )}

                        </td>



                        <td className="px-5 py-5">

                          <span

                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${confidenceClasses(

                              company.data_confidence

                            )}`}

                          >

                            {formatStatus(

                              company.data_confidence

                            )}

                          </span>

                        </td>



                                                <td className="px-5 py-5">

                          <Link

                            href={`/unlisted-shares/${company.slug}`}

                            className="inline-flex whitespace-nowrap rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/20"

                          >

                            View research

                          </Link>

                        </td>

                      </tr>

                    )

                  )

                ) : (

                  <tr>

                    <td

                      colSpan={9}

                      className="px-5 py-16 text-center"

                    >

                      <p className="font-medium text-slate-300">

                        No matching

                        unlisted companies

                      </p>



                      <p className="mt-2 text-sm text-slate-600">

                        Adjust the search

                        or filters and try

                        again.

                      </p>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>



          <div className="flex flex-col gap-4 border-t border-slate-800 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-slate-500">

                Showing {rangeText}

              </p>



              {data?.generated_at ? (
  <p className="mt-1 text-xs text-slate-600">
    Generated {
  formatDate(
    data.generated_at.split("T")[0]
  )
}
  </p>
) : null}

            </div>



            <div className="flex flex-wrap items-center gap-2">

              <button

                type="button"

                disabled={

                  loading ||

                  page <= 1

                }

                onClick={() =>

                  setPage(

                    (current) =>

                      Math.max(

                        1,

                        current - 1

                      )

                  )

                }

                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"

              >

                Previous

              </button>



              {visiblePages.map(

                (pageNumber) => (

                  <button

                    key={pageNumber}

                    type="button"

                    onClick={() =>

                      setPage(

                        pageNumber

                      )

                    }

                    className={`h-9 min-w-9 rounded-lg border px-3 text-xs font-bold transition ${

                      pageNumber ===

                      page

                        ? "border-amber-400 bg-amber-400 text-slate-950"

                        : "border-slate-700 text-slate-300 hover:border-slate-500"

                    }`}

                  >

                    {pageNumber}

                  </button>

                )

              )}



              <button

                type="button"

                disabled={

                  loading ||

                  !data ||

                  page >=

                    data.total_pages

                }

                onClick={() =>

                  setPage(

                    (current) =>

                      current + 1

                  )

                }

                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"

              >

                Next

              </button>

            </div>

          </div>

        </div>



        <div className="mt-8 grid gap-4 lg:grid-cols-3">

          <ExplanationCard

            title="Indicative price"

            description="A dated observation from an identified unlisted-market source. It is not a live exchange price or guaranteed transaction value."

          />



          <ExplanationCard

            title="Implied valuation"

            description="Market capitalisation and valuation ratios use the latest available price observation and financial period, which may have different dates."

          />



          <ExplanationCard

            title="Data confidence"

            description="Confidence reflects source quality and completeness. It does not measure investment quality or predict future returns."

          />

        </div>



        <p className="mt-6 text-xs leading-6 text-slate-600">

          {data?.disclaimer ??

            "Unlisted-share information should be independently verified before making any financial decision."}

        </p>

      </section>

    </main>

  );

}





function ExplanationCard({

  title,

  description,

}: {

  title: string;

  description: string;

}) {

  return (

    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">

      <h2 className="font-semibold text-white">

        {title}

      </h2>



      <p className="mt-2 text-sm leading-6 text-slate-500">

        {description}

      </p>

    </div>

  );

}
