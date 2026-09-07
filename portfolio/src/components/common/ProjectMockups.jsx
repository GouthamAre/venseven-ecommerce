import React from 'react';

// Project 1 Mockup: Crypto Screener Application (Tiled isometric app screens)
export const CryptoMockup = () => {
  return (
    <div className="relative w-full aspect-[16/10] bg-[#12141a] rounded-2xl overflow-hidden border border-zinc-800 p-4 sm:p-6 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
      {/* Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mockup Canvas Grid */}
      <div className="grid grid-cols-12 gap-3 w-full h-full transform -rotate-1 scale-[0.98] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-100">
        
        {/* Left Screen: Dark UI Screen with Yellow Hero Banner */}
        <div className="col-span-5 bg-[#1a1d26] rounded-xl p-3 border border-zinc-700/60 shadow-xl flex flex-col justify-between">
          <div className="bg-[#fbbf24] rounded-lg p-2.5 text-black font-extrabold text-[11px] leading-tight">
            <div className="flex items-center justify-between mb-1">
              <span className="bg-black/20 px-1.5 py-0.5 rounded text-[9px]">LIVE PRO</span>
              <span className="text-[9px]">● $68,420</span>
            </div>
            Get perfect crypto screener for your projects
          </div>
          <div className="space-y-1.5 my-2">
            <div className="bg-zinc-800/80 p-1.5 rounded flex items-center justify-between text-[10px] text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-bold text-black">₿</span>
                <span>Bitcoin BTC</span>
              </div>
              <span className="text-emerald-400 font-semibold">+4.8%</span>
            </div>
            <div className="bg-zinc-800/80 p-1.5 rounded flex items-center justify-between text-[10px] text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold text-white">Ξ</span>
                <span>Ethereum ETH</span>
              </div>
              <span className="text-emerald-400 font-semibold">+6.2%</span>
            </div>
            <div className="bg-zinc-800/80 p-1.5 rounded flex items-center justify-between text-[10px] text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 flex items-center justify-center text-[8px] font-bold text-white">◎</span>
                <span>Solana SOL</span>
              </div>
              <span className="text-emerald-400 font-semibold">+11.4%</span>
            </div>
          </div>
          {/* Chart Line */}
          <div className="h-8 bg-zinc-900/90 rounded p-1 flex items-end gap-1">
            {[40, 60, 55, 75, 70, 90, 85, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-emerald-400/80 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Right Screens Stack */}
        <div className="col-span-7 flex flex-col gap-2.5">
          {/* Top Card */}
          <div className="bg-[#212634] rounded-xl p-3 border border-zinc-700/60 shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-white font-bold mb-2">
              <span>Market Screener</span>
              <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[9px]">24h Bullish</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-900/60 p-2 rounded text-center">
                <span className="text-[9px] text-zinc-400 block">Total Cap</span>
                <span className="text-[11px] font-bold text-white">$2.84T</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded text-center">
                <span className="text-[9px] text-zinc-400 block">Volume</span>
                <span className="text-[11px] font-bold text-white">$94.2B</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded text-center">
                <span className="text-[9px] text-zinc-400 block">Dominance</span>
                <span className="text-[11px] font-bold text-amber-400">54.2%</span>
              </div>
            </div>
          </div>

          {/* Bottom Card: Geometric avatar cards matching visual */}
          <div className="bg-[#1c1f2b] rounded-xl p-2.5 border border-zinc-700/60 flex-1 flex items-center justify-between gap-2">
            <div className="flex-1 bg-[#10b981]/20 border border-[#10b981]/40 rounded-lg p-2 text-[10px]">
              <span className="font-bold text-emerald-300 block">Signal: Strong Buy</span>
              <span className="text-[9px] text-zinc-400">RSI & MACD Reversal</span>
            </div>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex flex-col items-center justify-center text-center p-1">
                <span className="text-[9px] text-purple-300 font-bold">ALPHA</span>
                <span className="text-[10px] text-white font-extrabold">+42%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Project 2 Mockup: Euphoria - Ecommerce (Apparels) Website Template
export const EuphoriaMockup = () => {
  return (
    <div className="relative w-full aspect-[16/10] bg-[#16171d] rounded-2xl overflow-hidden border border-zinc-800 p-4 sm:p-6 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
      {/* Background Glow */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mockup Canvas Grid */}
      <div className="grid grid-cols-12 gap-3 w-full h-full transform rotate-1 scale-[0.98] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-100">
        
        {/* Left Column: Product Cards */}
        <div className="col-span-7 flex flex-col gap-2">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-3 text-white shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded font-bold">New Drop</span>
              <h4 className="text-xs sm:text-sm font-extrabold mt-1">Summer Collection '26</h4>
              <p className="text-[9px] text-blue-100">UP TO 50% OFF APPAREL</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg">
              ✨
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-3 gap-2 flex-1">
            <div className="bg-[#222533] rounded-lg p-1.5 border border-zinc-700/50 flex flex-col justify-between">
              <div className="aspect-square bg-zinc-800 rounded flex items-center justify-center text-xs">🧥</div>
              <div className="mt-1">
                <span className="text-[8px] text-zinc-400 block truncate">Oversized Hoodie</span>
                <span className="text-[10px] font-bold text-white">$64</span>
              </div>
            </div>
            <div className="bg-[#222533] rounded-lg p-1.5 border border-zinc-700/50 flex flex-col justify-between">
              <div className="aspect-square bg-zinc-800 rounded flex items-center justify-center text-xs">👕</div>
              <div className="mt-1">
                <span className="text-[8px] text-zinc-400 block truncate">Minimalist Tee</span>
                <span className="text-[10px] font-bold text-white">$28</span>
              </div>
            </div>
            <div className="bg-[#222533] rounded-lg p-1.5 border border-zinc-700/50 flex flex-col justify-between">
              <div className="aspect-square bg-zinc-800 rounded flex items-center justify-center text-xs">👖</div>
              <div className="mt-1">
                <span className="text-[8px] text-zinc-400 block truncate">Cargo Trousers</span>
                <span className="text-[10px] font-bold text-white">$82</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & Cart Flow */}
        <div className="col-span-5 bg-[#20222e] rounded-xl p-3 border border-zinc-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-700 pb-2 mb-2">
              <span className="text-[11px] font-bold text-white">Cart Summary</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-semibold">2 Items</span>
            </div>
            <div className="space-y-2 text-[9px] text-zinc-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">$146.00</span>
              </div>
              <div className="flex justify-between">
                <span>Express Shipping</span>
                <span className="text-emerald-400">FREE</span>
              </div>
              <div className="flex justify-between border-t border-zinc-700/80 pt-1.5 text-[10px] font-bold text-white">
                <span>Total</span>
                <span>$146.00</span>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-indigo-600 text-white text-center py-1.5 rounded-lg text-[10px] font-bold hover:bg-indigo-500 transition-colors">
            Instant Checkout ⚡
          </div>
        </div>

      </div>
    </div>
  );
};

// Project 3 Mockup: Blog Website Template
export const BlogMockup = () => {
  return (
    <div className="relative w-full aspect-[16/10] bg-[#141416] rounded-2xl overflow-hidden border border-zinc-800 p-4 sm:p-6 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
      {/* Background Glow */}
      <div className="absolute right-10 bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-10 top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mockup Canvas Grid */}
      <div className="grid grid-cols-12 gap-3 w-full h-full transform -rotate-1 scale-[0.98] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-100">
        
        {/* Left Side: Editorial Banner */}
        <div className="col-span-6 bg-[#1f2026] rounded-xl p-3 border border-zinc-700/60 flex flex-col justify-between">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg p-2.5 text-black font-extrabold">
            <span className="text-[8px] bg-black/20 text-black px-1.5 py-0.5 rounded uppercase">Design & Code</span>
            <h4 className="text-xs sm:text-sm leading-tight mt-1">Design Blog Website</h4>
          </div>
          <div className="my-2 space-y-1">
            <div className="text-[10px] font-bold text-white leading-snug">
              Graduate as a graphic & UI designer in 3 months
            </div>
            <p className="text-[8px] text-zinc-400 line-clamp-2">
              Mastering typography, color theory, and full-stack responsive web systems.
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-zinc-800 pt-2">
            <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-white">ES</div>
            <div className="text-[8px] text-zinc-300">
              <span className="font-semibold text-white block">Evren Shah</span>
              <span>5 min read · Oct 2026</span>
            </div>
          </div>
        </div>

        {/* Right Side: Article Cards Grid */}
        <div className="col-span-6 flex flex-col gap-2">
          {/* Article 1 */}
          <div className="bg-[#1c1d24] rounded-lg p-2 border border-zinc-700/50 flex gap-2 items-center">
            <div className="w-12 h-12 bg-purple-900/50 border border-purple-500/30 rounded flex items-center justify-center text-xs">
              🎨
            </div>
            <div className="flex-1">
              <span className="text-[8px] text-purple-400 font-semibold block">Case Study</span>
              <span className="text-[10px] font-bold text-white leading-tight block truncate">Modern Design System</span>
              <span className="text-[8px] text-zinc-400">Figma to React tokens</span>
            </div>
          </div>

          {/* Article 2 */}
          <div className="bg-[#1c1d24] rounded-lg p-2 border border-zinc-700/50 flex gap-2 items-center">
            <div className="w-12 h-12 bg-emerald-900/50 border border-emerald-500/30 rounded flex items-center justify-center text-xs">
              🚀
            </div>
            <div className="flex-1">
              <span className="text-[8px] text-emerald-400 font-semibold block">Performance</span>
              <span className="text-[10px] font-bold text-white leading-tight block truncate">Sub-second Web Loads</span>
              <span className="text-[8px] text-zinc-400">Edge caching & SSR</span>
            </div>
          </div>

          {/* Article 3 */}
          <div className="bg-[#1c1d24] rounded-lg p-2 border border-zinc-700/50 flex gap-2 items-center">
            <div className="w-12 h-12 bg-amber-900/50 border border-amber-500/30 rounded flex items-center justify-center text-xs">
              ⚡
            </div>
            <div className="flex-1">
              <span className="text-[8px] text-amber-400 font-semibold block">Architecture</span>
              <span className="text-[10px] font-bold text-white leading-tight block truncate">React 19 Server Actions</span>
              <span className="text-[8px] text-zinc-400">Zero-bundle client state</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
