import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Upload, Download, RefreshCw, Heart, MessageCircle, 
  Send, Bookmark, MoreHorizontal, Sparkles, ChevronRight, 
  Image as ImageIcon, CheckCircle2, AlertCircle, Trash2, CameraIcon, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Cropper from 'react-easy-crop';
import { STYLE_PRESETS } from './components/StylePresets';
import { getCroppedImg } from './utils/cropImage';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const App = () => {
  const [tempImage, setTempImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [error, setError] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[2]); // Default to 'Professional'
  const [showComparison, setShowComparison] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  
  // Cropper specific state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Gemini API Key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 

  // Camera Logic
  useEffect(() => {
    let stream = null;
    const enableCamera = async () => {
      if (isCameraActive && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } } 
          });
          videoRef.current.srcObject = stream;
        } catch (err) {
          setError("카메라 권한을 얻을 수 없습니다. 브라우저 설정을 확인해주세요.");
          setIsCameraActive(false);
        }
      }
    };
    enableCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

  const startCamera = () => {
    setError(null);
    setIsCameraActive(true);
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    setError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setTempImage(dataUrl);
      setIsCameraActive(false);
      setIsCropping(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("이미지 크기가 너무 큽니다 (최대 10MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels);
      setOriginalImage(croppedImage);
      setProcessedImage(null);
      setError(null);
      setIsCropping(false);
      setTempImage(null);
    } catch (e) {
      console.error(e);
      setError("이미지 크롭 중 오류가 발생했습니다.");
    }
  };

  // AI Processing
  const processImage = async () => {
    if (!originalImage || !apiKey) {
      if (!apiKey) setError("API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.");
      return;
    }

    setStatus('processing');
    setError(null);

    const base64Data = originalImage.split(',')[1];
    const prompt = `Task: Face and Style Transformation. 
    Rule 1: Maintain the face identity from the provided image.
    Rule 2: ${selectedStyle.prompt}
    Rule 3: You MUST COMPLETELY CHANGE THE ORIGINAL BACKGROUND. Do not leave any part of the original room or furniture.
    Rule 4: You MUST CHANGE THE OUTFIT as described.
    Model: FaceFit Nano Banana. Ensure high professional quality.`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    };

    try {
      // Use gemini-2.5-flash-image for native image generation output
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || 'API 요청 실패';
        // Show the raw error message to help debug exactly what's wrong with the API/Model
        throw new Error(`[API Error] ${errorMsg}`);
      }
      
      const result = await response.json();
      const base64Image = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (base64Image) {
        setProcessedImage(`data:image/png;base64,${base64Image}`);
        setStatus('success');
      } else {
        throw new Error('AI가 이미지를 생성하지 못했습니다.');
      }
    } catch (err) {
      setError(err.message || "오류가 발생했습니다.");
      setStatus('error');
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `FaceFit-${selectedStyle.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#000] text-slate-100 font-sans pb-24 overflow-x-hidden selection:bg-purple-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <motion.h1 
          className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
        >
          FaceFit
        </motion.h1>
        <div className="flex gap-5 px-1">
          <Heart size={24} />
          <Send size={24} />
        </div>
      </header>

      <main className="max-w-xl mx-auto space-y-8 pt-6">
        {/* Initial View */}
        {!originalImage && !isCameraActive && !isCropping && (
          <div className="px-6 grid grid-cols-2 gap-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={startCamera}
              className="flex flex-col items-center justify-center gap-4 aspect-square rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <Camera size={32} strokeWidth={1.5} className="text-yellow-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-white/60">사진 촬영</span>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current.click()}
              className="flex flex-col items-center justify-center gap-4 aspect-square rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <ImageIcon size={32} strokeWidth={1.5} className="text-pink-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-white/60">갤러리 선택</span>
            </motion.button>
          </div>
        )}

        {/* Camera Feed */}
        {isCameraActive && (
          <div className="px-6 space-y-4 animate-fade-in">
            <div className="aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[0.3]" />
              <div className="absolute inset-x-0 bottom-8 flex justify-center gap-6">
                <button onClick={stopCamera} className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                  <Trash2 size={24} />
                </button>
                <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-white/20">
                  <div className="w-12 h-12 rounded-full border-2 border-black"></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cropper View */}
        {isCropping && tempImage && (
          <div className="px-6 animate-fade-in space-y-6">
            <div className="relative aspect-square w-full h-[400px] rounded-3xl overflow-hidden border border-white/10 bg-neutral-900">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-black text-white/30 tracking-widest">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setIsCropping(false); setTempImage(null); }}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest border border-white/10"
                >
                  취소
                </button>
                <button 
                  onClick={handleCropSave}
                  className="flex-1 py-4 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-widest shadow-xl"
                >
                  위치 확정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Card (Success State) */}
        {originalImage && !isCropping && (
          <div className="animate-fade-in relative">
            <div className="bg-black/40 border-y border-white/10 relative">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-black overflow-hidden select-none">
                      <img src={originalImage} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className="font-bold text-sm">Nano_Banana_AI</span>
                </div>
                <MoreHorizontal size={20} className="text-white/40" />
              </div>

              <div className="aspect-square bg-neutral-900 overflow-hidden relative group select-none">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={status}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full"
                  >
                    <img 
                      src={processedImage && !showComparison ? processedImage : originalImage} 
                      className="w-full h-full object-cover" 
                      alt="Result" 
                    />
                  </motion.div>
                </AnimatePresence>

                {status === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
                    <RefreshCw size={40} className="animate-spin text-yellow-400" />
                    <p className="mt-4 font-black text-lg tracking-tighter">AI가 변신시키는 중...</p>
                  </div>
                )}

                {processedImage && (
                  <button 
                    onMouseDown={() => setShowComparison(true)}
                    onMouseUp={() => setShowComparison(false)}
                    onTouchStart={() => setShowComparison(true)}
                    onTouchEnd={() => setShowComparison(false)}
                    className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/80"
                  >
                    {showComparison ? "원본" : "길게 눌러 비교"}
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                <div className="flex justify-between">
                  <div className="flex gap-5">
                    <Heart size={24} className={processedImage ? "text-pink-500 fill-pink-500" : ""} />
                    <MessageCircle size={24} />
                    <Send size={24} />
                  </div>
                  <Bookmark size={24} />
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedStyle(preset)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                          selectedStyle.id === preset.id 
                            ? "bg-white text-black border-white" 
                            : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
                        )}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                  <motion.div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">변환 예시</p>
                    <p className="text-sm text-white/80">"{selectedStyle.exampleText}"</p>
                  </motion.div>
                </div>
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-400" />
                    <p className="text-xs text-red-100">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 flex gap-4 mt-6">
              <button 
                onClick={processImage}
                disabled={status === 'processing'}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-pink-600 text-black font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-yellow-500/10"
              >
                AI 변환하기
              </button>
              {processedImage && (
                <button onClick={downloadImage} className="px-6 aspect-square bg-white rounded-2xl flex items-center justify-center text-black">
                  <Download size={22} />
                </button>
              )}
              <button 
                onClick={() => { setOriginalImage(null); setProcessedImage(null); setStatus('idle'); setError(null); }}
                className="px-6 aspect-square bg-white/10 rounded-2xl flex items-center justify-center text-white/60"
              >
                <Trash2 size={22} />
              </button>
            </div>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-white/10 flex justify-around items-center z-50">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <Sparkles className="text-black" size={20} />
        </div>
        <div className="w-7 h-7 rounded-sm bg-white/20 overflow-hidden">
          {originalImage && <img src={originalImage} className="w-full h-full object-cover" />}
        </div>
      </nav>
    </div>
  );
};

export default App;
