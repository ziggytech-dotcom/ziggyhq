import Link from 'next/link'
import { MarketingNav } from '@/app/components/marketing/Nav'
import { MarketingFooter } from '@/app/components/marketing/Footer'

const placeholderPosts = [
  {
    tag: 'Sales Strategy',
    title: '7 CRM habits that top-performing sales reps swear by',
    excerpt: 'The difference between reps who hit 150% of quota and those who miss isn\'t talent — it\'s process. Here\'s what the best do differently.',
    readTime: '6 min read',
    comingSoon: true,
  },
  {
    tag: 'Pipeline Management',
    title: 'How to build a sales pipeline that actually converts',
    excerpt: 'Most pipelines are just wish lists. Learn how to structure stages, set exit criteria, and forecast revenue you can actually bank on.',
    readTime: '8 min read',
    comingSoon: true,
  },
  {
    tag: 'AI & Automation',
    title: 'AI calling is here: how small teams are closing more deals with less effort',
    excerpt: 'Bland.ai-powered voice agents are qualifying leads 24/7 for businesses our size. Here\'s what we\'ve learned from early adopters.',
    readTime: '5 min read',
    comingSoon: true,
  },
]

export default function BlogPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            ZiggyHQ Blog
          </h1>
          <p className="text-xl text-[#b3b3b3] max-w-xl mx-auto">
            CRM tips, sales strategies, and business growth — written for teams that want to close more.
          </p>
        </div>
      </section>

      {/* Placeholder posts */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {placeholderPosts.map((post) => (
              <div key={post.title} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                {/* Thumbnail placeholder */}
                <div className="aspect-[16/9] bg-[#111] flex items-center justify-center border-b border-[#2d2d2d]">
                  <p className="text-[#555] text-xs">Article image coming soon</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#0ea5e9] text-xs font-medium">{post.tag}</span>
                    <span className="bg-[#2d2d2d] text-[#b3b3b3] text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2 leading-snug">{post.title}</h3>
                  <p className="text-[#b3b3b3] text-xs leading-relaxed mb-4">{post.excerpt}</p>
                  <p className="text-[#555] text-xs">{post.readTime}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Email capture */}
          <div className="bg-[#111111] border border-[#2d2d2d] rounded-2xl p-10 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-full flex items-center justify-center mx-auto mb-5 text-[#0ea5e9]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">The blog launches soon</h2>
            <p className="text-[#b3b3b3] text-sm mb-6 max-w-md mx-auto">
              We&apos;re writing practical, no-fluff content for sales teams. Drop your email and we&apos;ll notify you the moment we publish.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#0ea5e9] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#0ea5e9] text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors whitespace-nowrap"
              >
                Notify Me
              </button>
            </form>
            <p className="text-[#555] text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
