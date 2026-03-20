
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import Header from './components/Header';
import { analyzeImage, transformToPersonaSet } from './services/geminiService';
import { getCroppedImg } from './utils/imageUtils';
import { generateEmailSignature, generateBusinessCardHtml } from './utils/assetGenerator';
import { 
  ImageState, TransformationConfig, Gender, PresetStyle, AIAnalysis, PersonaType 
} from './types';
import { 
  Camera, Upload, Sparkles, Wand2, Download, AlertCircle, 
  User, CheckCircle, ChevronRight, RefreshCw, Palette, CreditCard, Mail
} from 'lucide-react';

// Tailwind glass-card class is defined in index.css
const App: React.FC = () => {
  const [stage, setStage] = useState<'IDLE' | 'CAMERA' | 'CROP' | 'PROCESS' | 'RESULT'>('IDLE');
  const [state, setState] = useState<ImageState>({
    file: null,
    originalUrl: null,
    previewUrl: null,
    resultUrl: null,
    personaResults: [],
    isProcessing: false,
    isAnalyzing: false,
    error: null,
    analysis: null
  });

  const [config, setConfig] = useState<TransformationConfig>({
    gender: Gender.UNSPECIFIED,
    background: 'Premium Gray',
    style: PresetStyle.MODERN_TECH,
    personalColorSync: true,
    corporateSync: false // Feature 7
  });

  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setState(prev => ({ ...prev, error: 'Please upload a valid image file.' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setState(prev => ({
          ...prev,
          file,
          originalUrl: reader.result as string,
          error: null
        }));
        setStage('CROP');
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Logic Integration
  useEffect(() => {
    let stream: MediaStream | null = null;
    const enableCamera = async () => {
      if (stage === 'CAMERA' && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1024 } } 
          });
          videoRef.current.srcObject = stream;
        } catch (err) {
          setState(prev => ({ ...prev, error: "Cannot access camera. Please check permissions." }));
          setStage('IDLE');
        }
      }
    };
    enableCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stage]);

  const startCamera = () => {
    setStage('CAMERA');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setState(prev => ({
          ...prev,
          originalUrl: dataUrl,
          error: null
        }));
        setStage('CROP');
      }
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (state.originalUrl && croppedAreaPixels) {
      const cropped = await getCroppedImg(state.originalUrl, croppedAreaPixels);
      setState(prev => ({ ...prev, previewUrl: cropped }));
      setStage('PROCESS');
      // Trigger Analysis automatically (Feature 4 & 5)
      performAnalysis(cropped!);
    }
  };

  const performAnalysis = async (imageUrl: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
      const base64 = imageUrl.split(',')[1];
      const analysis = await analyzeImage(base64, 'image/jpeg');
      setState(prev => ({ ...prev, analysis, isAnalyzing: false }));
      
      // Auto-sync personal color if enabled (Feature 5)
      if (config.personalColorSync && analysis.recommendedColors.length > 0) {
        setConfig(prev => ({ ...prev, background: analysis.recommendedColors[0] }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleTransform = async () => {
    if (!state.previewUrl) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const base64Data = state.previewUrl.split(',')[1];
      const personas = await transformToPersonaSet(base64Data, 'image/png', config);
      
      setState(prev => ({
        ...prev,
        personaResults: personas,
        resultUrl: personas[0].url, // Set the first one as default
        isProcessing: false,
      }));
      setStage('RESULT');
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || 'AI Transformation failed.',
      }));
    }
  };

  const reset = () => {
    setState({
      file: null,
      originalUrl: null,
      previewUrl: null,
      resultUrl: null,
      personaResults: [],
      isProcessing: false,
      isAnalyzing: false,
      error: null,
      analysis: null
    });
    setStage('IDLE');
  };

  const downloadAll = () => {
    state.personaResults.forEach(persona => {
      const link = document.createElement('a');
      link.href = persona.url;
      link.download = `ProPhoto-${persona.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30">
      <Header />
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          
          {/* STAGE 1: IDLE / UPLOAD */}
          {stage === 'IDLE' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="mb-12">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-block p-2 px-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
                >
                  ✨ Driven by Gemini 2.5 Flash
                </motion.div>
                <h2 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight">
                  Design Your <span className="text-gradient">Persona_Shot</span>
                </h2>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  Upload your casual photo and let our AI consultant analyze your impression 
                  and craft a stunning professional persona.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card aspect-video md:aspect-square rounded-[2.5rem] flex flex-col items-center justify-center p-8 cursor-pointer group hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-500 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                  <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Upload className="h-8 w-8 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-white mb-2">Upload Photo</p>
                  <p className="text-slate-500 text-sm">From your gallery</p>
                </div>

                <div 
                  onClick={startCamera}
                  className="glass-card aspect-video md:aspect-square rounded-[2.5rem] flex flex-col items-center justify-center p-8 cursor-pointer group hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-500 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 bg-purple-600/10 rounded-3xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                    <Camera className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-white mb-2">Live Capture</p>
                  <p className="text-slate-500 text-sm">Using your webcam</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE: CAMERA */}
          {stage === 'CAMERA' && (
            <motion.div 
              key="camera"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Live Camera</h3>
                  <p className="text-slate-400">Position yourself in the center for a perfect headshot.</p>
                </div>
                <button onClick={reset} className="text-sm font-medium text-slate-400 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
              </div>

              <div className="glass-card rounded-[3rem] p-4 relative overflow-hidden aspect-square md:aspect-video flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover rounded-[2.5rem] grayscale-[0.2]"
                />
                
                {/* Visual Guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="w-64 h-80 border-2 border-dashed border-white/20 rounded-full"></div>
                </div>

                <div className="absolute inset-x-0 bottom-10 flex justify-center items-center gap-8">
                  <button 
                  onClick={capturePhoto} 
                  className="group relative flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-white/30 group-active:scale-95 transition-transform">
                      <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center">
                         <div className="w-10 h-10 rounded-full bg-slate-900"></div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

          {/* STAGE 2: CROP */}
          {stage === 'CROP' && state.originalUrl && (
            <motion.div 
              key="crop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-bold text-white">1. Precision Frame</h3>
                  <p className="text-slate-400">Position your face clearly for the best AI results.</p>
                </div>
                <button onClick={reset} className="text-sm font-medium text-red-400 px-4 py-2 rounded-full bg-red-400/10 border border-red-400/20">Cancel</button>
              </div>

              <div className="glass-card rounded-[2.5rem] p-4 flex flex-col gap-6">
                <div className="relative aspect-square w-full max-h-[500px] overflow-hidden rounded-3xl">
                  <Cropper
                    image={state.originalUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={4/5}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="flex flex-col gap-4 px-4 py-2">
                   <div className="flex items-center gap-4">
                     <span className="text-xs font-bold text-slate-500 uppercase">Zoom</span>
                     <input 
                       type="range" value={zoom} min={1} max={3} step={0.1} 
                       onChange={(e) => setZoom(Number(e.target.value))} 
                       className="flex-grow accent-blue-500"
                     />
                   </div>
                   <button 
                    onClick={handleCropSave}
                    className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl text-lg hover:shadow-2xl hover:shadow-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    Confirm & Analyze <ChevronRight />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: PROCESS / ANALYZE */}
          {stage === 'PROCESS' && (
            <motion.div 
              key="stylize"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              {/* Left: AI Consultant & Controls */}
              <div className="space-y-6">
                {/* Feature 4: AI Analysis Card */}
                <div className="glass-card rounded-3xl p-6 border-blue-500/20 relative overflow-hidden">
                  {state.isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                       <RefreshCw className="animate-spin text-blue-400 h-8 w-8" />
                       <p className="text-sm font-bold text-blue-400 animate-pulse">AI Consultant is reviewing your photo...</p>
                    </div>
                  ) : state.analysis ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                       <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-4 tracking-widest">
                         <Sparkles size={14} /> AI Analysis Report
                       </div>
                       <div className="space-y-4">
                          <div>
                            <p className="text-xl font-bold text-white mb-1">"{state.analysis.impression}"</p>
                            <div className="flex items-center gap-4 text-xs">
                               <span className="px-2 py-1 rounded bg-white/10 text-slate-300">Score: {state.analysis.scoring}/100</span>
                               <span className="px-2 py-1 rounded bg-white/10 text-slate-300">Lighting: {state.analysis.lighting}</span>
                            </div>
                          </div>
                          
                          {/* Feature 5: Personal Color */}
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/5">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-white/50 uppercase">Personal Palette</span>
                                <span className="text-xs font-black text-blue-400">{state.analysis.personalColor} Tone</span>
                             </div>
                             <div className="flex gap-2">
                                {state.analysis.recommendedColors.map(color => (
                                  <button 
                                    key={color}
                                    onClick={() => setConfig({...config, background: color})}
                                    className={`flex-1 flex items-center gap-2 p-2 rounded-xl border transition-all ${config.background === color ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10'}`}
                                  >
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: color.toLowerCase()}} />
                                    <span className="text-[10px] font-bold truncate">{color}</span>
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ) : null}
                </div>

                {/* Feature 3: Style Presets */}
                <div className="glass-card rounded-3xl p-6 space-y-6">
                  <h3 className="font-bold text-lg text-white">2. Select Your Elite Persona</h3>
                  
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Industry Styles</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: PresetStyle.TRADITIONAL, name: 'Executive', icon: <User size={16}/> },
                        { id: PresetStyle.MODERN_TECH, name: 'Tech / Startup', icon: <Sparkles size={16}/> },
                        { id: PresetStyle.CREATIVE, name: 'Creative / Art', icon: <Palette size={16}/> },
                        { id: PresetStyle.KOREAN_ID, name: 'Global ID (Formal)', icon: <CheckCircle size={16}/> }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setConfig({ ...config, style: style.id })}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                            config.style === style.id 
                              ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-900/40 text-white' 
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                          }`}
                        >
                          {style.icon}
                          <span className="text-sm font-bold">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Attire</label>
                    <div className="flex gap-2">
                      {[
                        { id: Gender.MALE, label: 'Suit & Tie' },
                        { id: Gender.FEMALE, label: 'Blazer/Blouse' },
                        { id: Gender.UNSPECIFIED, label: 'Unisex' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setConfig({ ...config, gender: opt.id })}
                          className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all ${
                            config.gender === opt.id 
                              ? 'bg-white text-black border-white' 
                              : 'bg-white/5 text-slate-400 border-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-sm font-bold text-white">Corporate Sync Mode</p>
                          <p className="text-[10px] text-slate-500">Unify lighting & background for team consistency.</p>
                       </div>
                       <button 
                        onClick={() => setConfig({...config, corporateSync: !config.corporateSync})}
                        className={`w-12 h-6 rounded-full transition-all relative ${config.corporateSync ? 'bg-blue-600' : 'bg-white/10'}`}
                       >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.corporateSync ? 'right-1' : 'left-1'}`} />
                       </button>
                    </div>
                  </div>

                  <button
                    onClick={handleTransform}
                    disabled={state.isProcessing}
                    className="w-full py-5 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl font-black text-xl hover:shadow-2xl hover:shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {state.isProcessing ? <><RefreshCw className="animate-spin" /> Processing...</> : <><Wand2 /> Generate Elite Portrait</>}
                  </button>
                </div>
              </div>

              {/* Right: Real-time Preview */}
              <div className="relative group">
                 <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                 <div className="glass-card rounded-[3rem] p-4 relative min-h-[500px] flex flex-col items-center justify-center overflow-hidden">
                    {state.isProcessing ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center space-y-6 z-10"
                      >
                         <div className="w-32 h-32 relative mx-auto">
                            <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-4 border-2 border-purple-500/20 border-b-purple-500 rounded-full animate-spin-slow"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                               <Sparkles className="text-blue-400 h-10 w-10 animate-pulse" />
                            </div>
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-white animate-pulse">Crafting Persona...</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Harmonizing features, applying studio lighting, and tailoring attire.</p>
                         </div>
                      </motion.div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-4">
                        <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/40 border border-white/5">
                          <img src={state.previewUrl!} className="w-full h-full object-cover opacity-60 grayscale-[0.5]" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                             <p className="text-xs font-black text-white/40 uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full">Preview Ready</p>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 4: RESULT */}
          {stage === 'RESULT' && state.personaResults.length > 0 && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-12"
            >
               <div className="text-center space-y-4">
                  <motion.div 
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="inline-block p-2 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest"
                  >
                    👑 Brand Collection Ready
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">Your <span className="text-gradient">Professional Multiverse</span></h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">We've crafted three distinct elite personas to handle every professional scenario in your career journey.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {state.personaResults.map((persona, index) => (
                    <motion.div 
                      key={persona.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={`relative group cursor-pointer transition-all duration-500 ${state.resultUrl === persona.url ? 'scale-105' : 'scale-95 opacity-70 hover:opacity-100'}`}
                      onClick={() => setState(prev => ({...prev, resultUrl: persona.url}))}
                    >
                      <div className={`absolute -inset-1 rounded-[2.5rem] blur transition duration-1000 ${state.resultUrl === persona.url ? 'bg-gradient-to-r from-blue-500 to-purple-600 opacity-50' : 'bg-white/10 opacity-0 group-hover:opacity-20'}`}></div>
                      <div className="glass-card rounded-[2.5rem] overflow-hidden p-3 relative h-full flex flex-col">
                        <div className="relative aspect-[4/5] rounded-[1.8rem] overflow-hidden mb-4">
                          <img src={persona.url} className="w-full h-full object-cover" alt={persona.label} />
                          <div className="absolute top-4 left-4 flex gap-2">
                             <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-white border border-white/20">
                               {persona.label}
                             </span>
                          </div>
                          {state.resultUrl === persona.url && (
                             <div className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                               <CheckCircle size={16} />
                             </div>
                          )}
                        </div>
                        <div className="px-2 pb-2">
                          <h4 className="text-lg font-bold text-white mb-1">{persona.label}</h4>
                          <p className="text-xs text-slate-500 mb-4">{persona.description}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = persona.url;
                              link.download = `ProPhoto-${persona.id}.png`;
                              link.click();
                            }}
                            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> Download This
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 pt-16 border-t border-white/5">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <CreditCard className="text-blue-400" /> Selected Identity Kit
                    </h3>
                    <p className="text-slate-400 text-sm">The persona you select above will be used to generate your dynamic assets below.</p>
                    <div className="flex gap-4">
                       <button onClick={downloadAll} className="flex-1 py-5 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20">
                         <Download /> Download Set (Zip)
                       </button>
                       <button onClick={reset} className="px-8 py-5 glass-card text-white font-bold rounded-2xl hover:bg-white/5 transition-all">New Shoot</button>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="glass-card rounded-[2.5rem] p-8 space-y-8 border-blue-500/20">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><Sparkles size={20} /></div>
                           <h3 className="text-xl font-bold text-white">Smart Asset Preview</h3>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Digital Business Card</p>
                              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform scale-95 -translate-x-2">
                                 <div dangerouslySetInnerHTML={{ __html: generateBusinessCardHtml("Elite Professional", "Digital Persona", state.resultUrl!) }} />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Signature</p>
                              <div className="rounded-xl overflow-hidden shadow-2xl transform scale-75 origin-top-left -mb-16">
                                 <div dangerouslySetInnerHTML={{ __html: generateEmailSignature("Elite Professional", "Verified AI Portrait", "Secured Contact", "pro@ai-studio.io", "branding.me", state.resultUrl!) }} />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {state.error && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 max-w-md w-full glass-card p-4 border-red-500/30 rounded-2xl flex items-center gap-4 animate-bounce">
            <AlertCircle className="text-red-400" />
            <p className="text-sm text-red-100 leading-tight">{state.error}</p>
            <button onClick={() => setState(prev => ({...prev, error: null}))} className="ml-auto text-slate-400">×</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
