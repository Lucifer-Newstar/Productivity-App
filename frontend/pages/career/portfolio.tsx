"use client";

/**
 * pages/career/portfolio — portfolio module.
 * Thin route wrapper mounting CareerPage HOC with the portfolio section.
 */
import CareerPage from "../../components/career/CareerPage";
import PortfolioSection from "../../components/career/sections/PortfolioSection";

export default function Page() {
  return (
    <CareerPage section="portfolio">
      <PortfolioSection />
    </CareerPage>
  );
}
Page.fullScreen = true;
