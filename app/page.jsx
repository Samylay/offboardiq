'use client';

import Link from 'next/link';
import { Shield, Brain, BarChart3, Zap, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Knowledge Capture', desc: 'Structured interviews extract explicit, implicit, and tacit knowledge through progressive deepening — the knowledge people don\'t know they have.' },
  { icon: BarChart3, title: 'Risk Quantification', desc: 'Multi-factor risk engine scores knowledge concentration, project impact, relationship dependencies, timeline pressure, and replacement difficulty.' },
  { icon: Zap, title: 'Proactive Detection', desc: 'Identify single points of failure and knowledge vulnerabilities across your organization before departures happen.' },
];

const steps = [
  { num: '01', title: 'Connect Your HRIS', desc: 'Webhook integrations with BambooHR, Workday, Rippling auto-trigger offboarding when departures are announced.' },
  { num: '02', title: 'AI Interviews Begin', desc: 'Our 5-phase knowledge extraction engine conducts structured interviews, extracting documented processes, tribal knowledge, and relationship maps.' },
  { num: '03', title: 'Knowledge Captured & Transferred', desc: 'Auto-generated transfer plans, verified knowledge items, and risk-scored handoff ensure nothing falls through the cracks.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-brand-600" />
          <span className="text-xl font-bold text-gray-900">OffboardIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign In</Link>
          <Link href="/login?tab=register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 py-24 text-center">
        <div className="badge bg-brand-100 text-brand-700 mb-6">AI-Powered Knowledge Protection</div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Stop Losing Institutional Knowledge<br />When Employees Leave
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          OffboardIQ uses AI-driven interviews and risk assessment to capture the knowledge
          that walks out the door — before it's gone forever.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login?tab=register" className="btn-primary text-base px-8 py-3">
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="#how-it-works" className="btn-secondary text-base px-8 py-3">
            See How It Works
          </Link>
        </div>
        <div className="flex justify-center gap-8 mt-12 text-sm text-gray-400">
          {['No credit card required', '14-day free trial', 'SOC 2 compliant'].map((t) => (
            <span key={t} className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" />{t}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why OffboardIQ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold">{num}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{title}</h3>
                  <p className="text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Protect Your Knowledge?</h2>
        <p className="text-brand-100 mb-8 text-lg">Start capturing institutional knowledge before your next departure.</p>
        <Link href="/login?tab=register" className="inline-flex items-center px-8 py-3 bg-white text-brand-700 font-semibold rounded-lg hover:bg-brand-50 transition-colors">
          Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t">
        <p>&copy; {new Date().getFullYear()} OffboardIQ. All rights reserved.</p>
      </footer>
    </div>
  );
}
