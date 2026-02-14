import Link from "next/link";
import Image from "next/image";
import logo from "../assests/logo.png";
import { ArrowRight, UserCircle, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] dark:bg-zinc-950 p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <Image
              src={logo}
              alt="Bauhaus Spaces"
              width={300}
              height={100}
              className="h-auto w-auto max-w-[240px] invert dark:invert-0"
              priority
            />
          </div>
          <h1 className="text-5xl font-extrabold text-cs-heading dark:text-white tracking-tight mb-4">
            Bauhaus <span className="text-[#C5A059] italic">Project Manager</span>
          </h1>
          <p className="text-xl text-cs-text dark:text-zinc-400 max-w-2xl mx-auto">
            A premium bridge between designers and clients. Manage projects, track progress visually, and deliver excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Admin Entry */}
          <Link href="/admin/login" className="group relative bg-white border border-cs-border rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex flex-col h-full">
              <div className="h-12 w-12 rounded-xl bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] mb-6 dark:bg-[#C5A059]/20">
                <UserCircle size={28} />
              </div>
              <h2 className="text-2xl font-bold text-cs-heading dark:text-white mb-2">Admin Portal</h2>
              <p className="text-cs-text dark:text-zinc-400 mb-8 leading-relaxed">
                Access the management console to register clients, launch new projects, and upload visual updates.
              </p>
              <div className="mt-auto flex items-center gap-2 font-bold text-[#C5A059] group-hover:gap-4 transition-all">
                Enter System <ArrowRight size={20} />
              </div>
            </div>
          </Link>

          {/* Client Portal */}
          <Link href="/client/login" className="group relative bg-white border border-cs-border rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex flex-col h-full">
              <div className="h-12 w-12 rounded-xl bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] mb-6 dark:bg-[#C5A059]/20">
                <Briefcase size={28} />
              </div>
              <h2 className="text-2xl font-bold text-cs-heading dark:text-white mb-2">Client Portal</h2>
              <p className="text-cs-text dark:text-zinc-400 mb-8 leading-relaxed">
                Personalized space for homeowners to witness their home's transformation. (Requires Client PIN)
              </p>
              <div className="mt-auto flex items-center gap-2 font-bold text-[#C5A059] group-hover:gap-4 transition-all">
                Access Portal <ArrowRight size={20} />
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-[#C5A059]/10 text-[#C5A059] text-[10px] uppercase font-bold px-2 py-1 rounded dark:bg-[#C5A059]/30">
              Active
            </div>
          </Link>
        </div>

        <footer className="mt-20 text-center text-sm text-cs-text dark:text-zinc-500 font-medium tracking-wide">
          DESIGNED FOR INTERIOR PROFESSIONALS &bull; 2025
        </footer>
      </div>
    </div>
  );
}
