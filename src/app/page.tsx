import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  Target,
  TrendingUp,
  Users,
  ChevronRight,
  Flame,
  Trophy,
  BarChart3,
} from 'lucide-react';

export const metadata: Metadata = {
  description:
    'Train with elite coaches, follow structured programs, track every workout, and build momentum. Start your 7-day free trial today.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-secondary bg-bg-primary/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-accent-primary" />
            <span className="text-xl font-bold text-text-primary tracking-tight">THRYV</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent-primary hover:bg-accent-primary-hover px-4 py-2 text-sm font-bold text-white transition-all shadow-lg shadow-accent-primary/20"
            >
              Start Free Trial
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent-primary/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent-secondary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-primary bg-bg-secondary px-4 py-1.5 mb-8">
            <Flame className="h-4 w-4 text-accent-primary" />
            <span className="text-xs font-medium text-text-secondary">
              Where training comes together
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-text-primary">Train with the</span>
            <br />
            <span className="gradient-text">best coaches</span>
            <br />
            <span className="text-text-primary">on earth</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Access structured programs from elite coaches, track every workout, build momentum,
            and join a community that pushes you forward. One subscription, unlimited growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-primary hover:bg-accent-primary-hover px-8 py-3.5 text-base font-bold text-white transition-all shadow-lg shadow-accent-primary/25 glow"
            >
              Start 7-Day Free Trial
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-tertiary px-8 py-3.5 text-base font-medium text-text-secondary hover:text-text-primary transition-all"
            >
              See How It Works
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">500+</div>
              <div className="text-xs text-text-muted mt-1">Programs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">50+</div>
              <div className="text-xs text-text-muted mt-1">Elite Coaches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">10K+</div>
              <div className="text-xs text-text-muted mt-1">Active Athletes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20 px-6 border-t border-border-secondary">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Everything you need to <span className="gradient-text">level up</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              One platform. Structured programs. Real coaches. Measurable progress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Structured Programs',
                desc: 'Follow week-by-week plans built by certified coaches with clear progressions.',
              },
              {
                icon: TrendingUp,
                title: 'Momentum System',
                desc: 'Earn points for every workout, build streaks, and unlock new levels as you progress.',
              },
              {
                icon: Users,
                title: 'Program Communities',
                desc: 'Connect with others on the same program. Share wins, ask questions, stay motivated.',
              },
              {
                icon: BarChart3,
                title: 'Track Everything',
                desc: 'Workouts, streaks, consistency — see your progress over time in one clean dashboard.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border-secondary bg-bg-card p-6 hover:bg-bg-card-hover hover:border-border-primary transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center mb-4 group-hover:bg-accent-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-accent-primary" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-border-secondary bg-bg-secondary">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Get started in <span className="gradient-text">3 steps</span>
            </h2>
          </div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Sign up & tell us your goals',
                desc: 'Quick onboarding — your experience level, equipment, and how much time you have. We use this to recommend the right programs.',
              },
              {
                step: '02',
                title: 'Activate a program',
                desc: 'Browse programs from top coaches, filtered to match your goals. Use your monthly credits to activate and start training.',
              },
              {
                step: '03',
                title: 'Train, track, and build momentum',
                desc: 'Follow your weekly plan, log workouts, build streaks, and watch your Momentum grow. Stay connected through program communities.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg momentum-gradient flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">{item.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator CTA */}
      <section className="py-20 px-6 border-t border-border-secondary">
        <div className="mx-auto max-w-4xl text-center">
          <Trophy className="h-10 w-10 text-accent-secondary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Are you a coach?
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-8">
            Publish programs, grow your audience, and earn based on real engagement.
            Your expertise deserves a platform built for performance.
          </p>
          <Link
            href="/creator-signup"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-secondary/30 bg-accent-secondary/10 hover:bg-accent-secondary/20 px-6 py-3 text-sm font-medium text-accent-secondary transition-all"
          >
            Apply as a Creator
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-secondary py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent-primary" />
            <span className="font-bold text-text-primary">THRYV</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="#" className="hover:text-text-secondary transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-text-secondary transition-colors">
              Privacy
            </Link>
            <span>&copy; {new Date().getFullYear()} THRYV</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
