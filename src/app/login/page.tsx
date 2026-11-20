import LoginForm from "@/components/login-form";
import { UtensilsCrossed, MonitorCheck, Sparkles, ReceiptText, QrCode } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 lg:p-8 bg-[#0a0c10] overflow-hidden">
      {/* Background ambient image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/restaurant-interior.jpg"
          alt="Restaurant Ambiance"
          fill
          priority
          className="object-cover opacity-25 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/85 to-[#0a0c10]/70" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
        {/* Left column: Branding & Features */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 pr-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 w-fit">
            <Sparkles size={14} /> Spice Symphony Flagship Station
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
            The Intelligent Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Modern Dining</span>.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
            Seamlessly coordinate table management, mobile QR ordering, point-of-sale checkout, kitchen display systems, and inventory control with enterprise stability.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4 max-w-lg">
            <div className="bg-[#141820]/80 border border-[#232b38] rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                <UtensilsCrossed size={18} />
              </div>
              <div className="font-bold text-sm text-white">Visual Floor Plan</div>
              <div className="text-xs text-slate-400 mt-0.5">Real-time table occupancies & zones</div>
            </div>

            <div className="bg-[#141820]/80 border border-[#232b38] rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <ReceiptText size={18} />
              </div>
              <div className="font-bold text-sm text-white">Touch POS & Billing</div>
              <div className="text-xs text-slate-400 mt-0.5">Multi-tender, 5% GST, split checks</div>
            </div>

            <div className="bg-[#141820]/80 border border-[#232b38] rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <MonitorCheck size={18} />
              </div>
              <div className="font-bold text-sm text-white">Live Kitchen Display</div>
              <div className="text-xs text-slate-400 mt-0.5">Real-time prep tickets & alerts</div>
            </div>

            <div className="bg-[#141820]/80 border border-[#232b38] rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
                <QrCode size={18} />
              </div>
              <div className="font-bold text-sm text-white">Digital QR Ordering</div>
              <div className="text-xs text-slate-400 mt-0.5">Contactless guest smartphone menu</div>
            </div>
          </div>
        </div>

        {/* Right column: Login form */}
        <div className="flex justify-center">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
