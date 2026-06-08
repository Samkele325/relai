import "./globals.css";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="bg-glow"></div>
      <div className="bg-glow-2"></div>

      {/* NAVBAR */}

      <nav>
        <div className="logo">RelAI</div>
      </nav>

      {/* HERO SECTION */}

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            AI-Powered Relocation Guidance
          </div>

          <h1>
            Find Your Best Visa Pathway in Minutes
          </h1>

          <p>
            RelAI helps South Africans discover the best relocation pathways
            for the UK, Canada, and the USA using AI-powered analysis and
            personalized recommendations.
          </p>

          {/* FIXED BUTTON */}

          <Link href="/questionnaire" className="cta-btn">
            Start Free Assessment
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section>
        <h2 className="section-title">
          How It Works
        </h2>

        <p className="section-sub">
          A simple AI-powered process designed to help you explore
          relocation opportunities faster and smarter.
        </p>

        <div className="cards">
          <div className="card">
            <div className="card-icon">📝</div>

            <h3>Answer a Few Questions</h3>

            <p>
              Tell us about your education, work experience,
              goals, and preferred destination.
            </p>
          </div>

          <div className="card">
            <div className="card-icon">🤖</div>

            <h3>AI Analyzes Your Profile</h3>

            <p>
              Our AI evaluates your profile and matches you
              with potential relocation pathways.
            </p>
          </div>

          <div className="card">
            <div className="card-icon">🌍</div>

            <h3>Get Your Relocation Roadmap</h3>

            <p>
              Receive tailored guidance and next-step recommendations
              within minutes.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFITS */}

      <section>
        <h2 className="section-title">
          Why Use RelAI?
        </h2>

        <p className="section-sub">
          Built for modern relocation planning with AI-first experiences
          and clean guidance.
        </p>

        <div className="benefits-box">
          <div className="benefits">
            <div className="benefit">
              <div className="check">✓</div>
              Personalized pathways
            </div>

            <div className="benefit">
              <div className="check">✓</div>
              AI-powered recommendations
            </div>

            <div className="benefit">
              <div className="check">✓</div>
              Immigration guidance in minutes
            </div>

            <div className="benefit">
              <div className="check">✓</div>
              Built for South Africans
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}

      <section className="final-cta">
        <div className="final-cta-box">
          <h2>
            Start Your Free AI Assessment
          </h2>

          <p>
            Discover smarter relocation opportunities powered by AI.
            Get personalized insights and guidance tailored to your profile.
          </p>

          {/* FIXED BUTTON */}

          <Link href="/questionnaire" className="cta-btn">
            Start Free Assessment
          </Link>
        </div>
      </section>

      {/* FOOTER */}

      <footer>
        © 2026 RelAI. All rights reserved.
      </footer>
    </>
  );
}