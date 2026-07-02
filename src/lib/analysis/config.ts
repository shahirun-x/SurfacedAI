export interface BrandConfig {
  brandName: string;
  ctaPhrases: string[];
  competitors: string[];
  minWordCountStandard: number;
  minWordCountComplex: number;
  internalLinksMin: number;
  internalLinksMax: number | null;
  faqMinimumCount: number;
}

export const defaultBrandConfig: BrandConfig = {
  brandName: "",
  ctaPhrases: [],
  competitors: [],
  minWordCountStandard: 400,
  minWordCountComplex: 800,
  internalLinksMin: 1,
  internalLinksMax: null,
  faqMinimumCount: 3,
};
