
import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Sparkles, User, Globe, Share2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="w-full h-20 sticky top-0 z-[60] backdrop-blur-3xl bg-black/40 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-blue-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tighter leading-none">PERSONA_SHOT</h1>
            <span className="text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase">AI Career Portrait Studio</span>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-10">
          <a href="#" className="text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">How it Works</a>
          <a href="#" className="text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Enterprise</a>
          <a href="#" className="text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
             <Globe size={14} className="text-blue-500" /> English
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex p-3 rounded-full hover:bg-white/5 text-slate-400 transition-all">
             <Share2 size={18} />
          </button>
          <button className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all hover:shadow-2xl hover:shadow-blue-500/20 active:scale-95">
            Sign In
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
