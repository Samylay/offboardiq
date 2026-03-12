import { Link } from 'react-router-dom';
import { Zap, Brain, Shield, BarChart3, Clock, Users, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Knowledge Extraction',
    description: 'Structured AI interviews that surface tacit knowledge — the stuff people don\'t even realize they know.',
  },
  {
    icon: Shield,
    title: 'Risk Scoring Engine',
    description: 'Quantify the real cost of each departure. Know which knowledge gaps will hurt before they do.',
  },
  {
    icon: Clock,
    title: 'Automated Transfer Plans',
    description: 'AI-generated handoff plans with shadow sessions, documentation tasks, and relationship introductions.',
  },
  {
    icon: BarChart3,
    title: 'Coverage Analytics',
    description: 'Real-time dashboards showing knowledge capture progress, gaps, and organizational risk exposure.',
  },
  {
    icon: Users,
    title: 'Successor Mapping',
    description: 'Identify and assign successors for every knowledge domain. Ensure nothing falls through the cracks.',
  },
  {
    icon: Zap,
    title: 'HRIS Integration',
    description: 'Auto-trigger offboarding workflows from resignation events in BambooHR, Workday, Rippling, and more.',
  },
];

const painPoints = [
  'An employee resigns on Friday. By Monday, three projects are stalled because nobody knows the vendor contacts, the deployment process, or why that one API is configured the way it is.',
  'Exit interviews capture sentiment. They don\'t capture the 47 undocumented procedures that just walked out the door.',
  'Your Confluence wiki has 10,000 pages. Zero of them explain what actually happens when the payment gateway throws error code 4071.',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-7 h-7 text-brand-600" />
            <span className="text-xl font-bold tracking-tight">OffboardIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link to="/login" className="btn-primary text-sm">Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <div className="badge badge-info mb-4">Now in beta</div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Stop losing your company's brain
            <span className="text-brand-600"> every time someone leaves</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            OffboardIQ uses AI to extract, structure, and transfer the knowledge your departing
            employees carry in their heads — before it walks out the door forever.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="btn-primary text-lg px-6 py-3 flex items-center gap-2">
              Start free trial <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="btn-secondary text-lg px-6 py-3">See how it works</a>
          </div>
          <p className="mt-4 text-sm text-gray-500">14-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">The $31 billion problem nobody's solving</h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl">
            US companies lose an estimated $31 billion annually to knowledge loss from employee turnover.
            Current tools treat offboarding as a checklist. It's not. It's a knowledge crisis.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((point, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="text-red-400 font-mono text-sm mb-3">Scenario #{i + 1}</div>
                <p className="text-gray-300 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Built for the post-resignation window</h2>
          <p className="text-gray-600 text-lg mb-12 max-w-2xl">
            The 2-4 weeks between resignation and departure is your only chance to capture years of accumulated knowledge. OffboardIQ makes every day count.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="card">
                <feature.icon className="w-10 h-10 text-brand-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">How OffboardIQ works</h2>

          <div className="max-w-3xl mx-auto space-y-8">
            {[
              { step: '1', title: 'Resignation triggers workflow', desc: 'Automatically or manually initiate an offboarding case. The system maps the departing employee\'s role, responsibilities, and organizational footprint.' },
              { step: '2', title: 'AI maps knowledge domains', desc: 'Our AI conducts structured interviews with the departing employee, progressively surfacing explicit, implicit, and tacit knowledge across 5 phases.' },
              { step: '3', title: 'Risk engine quantifies exposure', desc: 'Every knowledge domain is scored for criticality, concentration risk, and replacement difficulty. You see exactly where the gaps are.' },
              { step: '4', title: 'Transfer plans execute automatically', desc: 'AI generates handoff tasks — shadow sessions, documentation reviews, relationship introductions — assigned to the right people with the right deadlines.' },
              { step: '5', title: 'Knowledge lives on', desc: 'Captured knowledge becomes a searchable organizational asset. The next person in the role starts with context, not confusion.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                  {step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{title}</h3>
                  <p className="text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4 text-center">Simple, transparent pricing</h2>
          <p className="text-gray-600 text-lg mb-12 text-center">Pay per offboarding case, not per seat. You only pay when you need us.</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '$49', unit: '/departure', features: ['Up to 10 departures/year', 'AI knowledge interviews', 'Basic risk scoring', 'Email notifications', 'Knowledge base export'], cta: 'Start free trial' },
              { name: 'Growth', price: '$149', unit: '/departure', features: ['Unlimited departures', 'Advanced AI extraction (5 phases)', 'Full risk engine', 'Transfer plan generation', 'Slack integration', 'Analytics dashboard', 'HRIS webhooks'], cta: 'Start free trial', featured: true },
              { name: 'Enterprise', price: 'Custom', unit: '', features: ['Everything in Growth', 'SSO / SAML', 'Custom AI models', 'API access', 'Dedicated success manager', 'SOC 2 compliance', 'Data residency options'], cta: 'Contact sales' },
            ].map((plan) => (
              <div key={plan.name} className={`card ${plan.featured ? 'ring-2 ring-brand-600 relative' : ''}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-info">Most popular</div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">{plan.unit}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={plan.featured ? 'btn-primary w-full text-center block' : 'btn-secondary w-full text-center block'}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-400" />
            <span className="text-white font-semibold">OffboardIQ</span>
          </div>
          <p className="text-sm">&copy; 2026 OffboardIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
