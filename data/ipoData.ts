export interface IPO {
  id: string;
  company: string;
  sector: string;
  status: "Open" | "Upcoming" | "Closed";

  openDate: string;
  closeDate: string;
  listingDate: string;

  priceBand: string;
  issueSize: string;
  lotSize: number;
  minInvestment: string;

  gmp: string;
  subscription: string;

  stflScore: number;
}

export const ipoData: IPO[] = [
  {
    id: "nsdl",
    company: "NSDL Ltd.",
    sector: "Financial Services",
    status: "Open",

    openDate: "24 Jul 2026",
    closeDate: "28 Jul 2026",
    listingDate: "02 Aug 2026",

    priceBand: "₹760 - ₹800",
    issueSize: "₹4,011 Cr",
    lotSize: 18,
    minInvestment: "₹14,400",

    gmp: "₹125",
    subscription: "4.20x",

    stflScore: 9.1,
  },

  {
    id: "hero-fincorp",
    company: "Hero FinCorp",
    sector: "NBFC",
    status: "Upcoming",

    openDate: "27 Jul 2026",
    closeDate: "30 Jul 2026",
    listingDate: "05 Aug 2026",

    priceBand: "₹1320 - ₹1395",
    issueSize: "₹3,500 Cr",
    lotSize: 10,
    minInvestment: "₹13,950",

    gmp: "₹84",
    subscription: "-",

    stflScore: 8.4,
  },
];