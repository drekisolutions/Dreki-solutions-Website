import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import { portfolioProjects } from "../site-data";

export const metadata: Metadata = {
  title: "Project Portfolio",
  description:
    "A portfolio of Dreki Solutions agentic software demonstrations for service and aviation operations.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <main className="page-main" id="main-content">
      <section
        className="page-section service-industry-section portfolio-section"
        aria-labelledby="portfolio-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Project portfolio</p>
            <h1 id="portfolio-title">See the systems behind the work.</h1>
          </div>
          <div className="section-heading__support">
            <p>
              Six demonstration spaces are ready for approved project walkthroughs,
              operating diagrams, interface previews, and the human controls behind each system.
            </p>
            <PageTurnLink className="button button-primary" href="/contact#consultation">
              Discuss a Project
            </PageTurnLink>
          </div>
        </div>

        <div className="product-grid portfolio-grid" aria-label="Project demonstration spaces">
          {portfolioProjects.map((project) => (
            <article className="product-card portfolio-card" key={project.index}>
              <div><span>{project.index}</span><small>{project.status}</small></div>
              <p>{project.focus}</p>
              <h2>{project.title}</h2>
              <p>{project.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
