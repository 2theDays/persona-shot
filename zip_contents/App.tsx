
import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import { transformToProfessionalPhoto } from './services/geminiService';
import { ImageState, TransformationConfig, Gender } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<ImageState>({
    file: null,
    previewUrl: null,
    resultUrl: null,
    isProcessing: false,
    error: null,
  });

  const [config, setConfig] = useState<TransformationConfig>({
    gender: Gender.UNSPECIFIED,
    background: 'blue',
    style: 'modern',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setState(prev => ({ ...prev, error: 'Please upload a valid image file.' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setState({
          file,
          previewUrl: reader.result as string,
          resultUrl: null,
          isProcessing: false,
          error: null,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransform = async () => {
    if (!state.previewUrl) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const base64Data = state.previewUrl.split(',')[1];
      const mimeType = state.file?.type || 'image/png';
      
      const result = await transformToProfessionalPhoto(base64Data, mimeType, config);
      
      setState(prev => ({
        ...prev,
        resultUrl: result,
        isProcessing: false,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || 'An unexpected error occurred.',
      }));
    }
  };

  const reset = () => {
    setState({
      file: null,
      previewUrl: null,
      resultUrl: null,
      isProcessing: false,
      error: null,
    });
  };

  const downloadResult = () => {
    if (state.resultUrl) {
      const link = document.createElement('a');
      link.href = state.resultUrl;
      link.download = 'professional-resume-photo.png';
      link.click();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Get a Professional <span className="text-blue-600">Resume Photo</span> in Seconds
          </h2>
          <p className="text-lg text-slate-600">
            Upload your casual photo and our AI will transform it into a high-quality studio portrait perfect for LinkedIn, CVs, and professional profiles.
          </p>
        </div>

        {!state.previewUrl ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-2xl mx-auto aspect-video bg-white border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-900 mb-2">Click to upload your photo</p>
            <p className="text-slate-500">Supports PNG, JPG, JPEG (Max 5MB)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Original Preview & Controls */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">1. Customize Transformation</h3>
                <button onClick={reset} className="text-sm font-medium text-red-500 hover:underline">Change Photo</button>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-50 flex items-center justify-center border border-slate-100 max-h-[400px] w-full mx-auto">
                <img 
                  src={state.previewUrl} 
                  alt="Original" 
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute top-4 left-4 bg-slate-900/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full">
                  Original
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Attire Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: Gender.MALE, label: 'Suit & Tie' },
                      { id: Gender.FEMALE, label: 'Blazer/Blouse' },
                      { id: Gender.UNSPECIFIED, label: 'Professional' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setConfig({ ...config, gender: opt.id })}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                          config.gender === opt.id 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Studio Background</label>
                  <div className="flex gap-4">
                    {['blue', 'gray', 'white'].map(bg => (
                      <button
                        key={bg}
                        onClick={() => setConfig({ ...config, background: bg as any })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          config.background === bg 
                            ? 'border-blue-600 ring-2 ring-blue-100' 
                            : 'border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border border-slate-200 ${
                          bg === 'blue' ? 'bg-[#2b4162]' : bg === 'gray' ? 'bg-slate-300' : 'bg-white'
                        }`} />
                        <span className="text-sm font-medium capitalize">{bg}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleTransform}
                disabled={state.isProcessing}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {state.isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Professional Portrait
                  </>
                )}
              </button>
              {state.error && <p className="text-red-500 text-sm font-medium text-center">{state.error}</p>}
            </div>

            {/* Right: Result Display */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
              {!state.resultUrl && !state.isProcessing && (
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Result will appear here</h3>
                  <p className="text-slate-400 text-sm mt-2">Adjust settings and click Generate</p>
                </div>
              )}

              {state.isProcessing && (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.673.337a2 2 0 01-1.547.132l-1.88-.47a2 2 0 01-1.312-1.313l-.471-1.88a2 2 0 01.132-1.547l.337-.673a6 6 0 00.517-3.86l-.477-2.387a2 2 0 00-.547-1.022L7.428 2.572a2 2 0 00-2.828 0l-2 2a2 2 0 000 2.828l1.428 1.428a2 2 0 001.022.547l2.387.477a6 6 0 003.86-.517l.673-.337a2 2 0 011.547-.132l1.88.47a2 2 0 011.312 1.313l.471 1.88a2 2 0 01-.132 1.547l-.337.673a6 6 0 00-.517 3.86l.477-2.387a2 2 0 00.547-1.022l1.428 1.428a2 2 0 002.828 0l2-2a2 2 0 000-2.828l-1.428-1.428z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 animate-pulse">AI is crafting your portrait...</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">This takes about 5-10 seconds. We're applying professional studio lighting and business attire.</p>
                </div>
              )}

              {state.resultUrl && (
                <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
                  <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-50 flex items-center justify-center border border-slate-100 max-h-[400px] w-full mx-auto">
                    <img 
                      src={state.resultUrl} 
                      alt="Result" 
                      className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-green-500/80 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Professionalized
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={downloadResult}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download HD
                    </button>
                    <button 
                      onClick={reset}
                      className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                    >
                      New Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-20 border-t border-slate-100 pt-12 pb-24">
          <h3 className="text-2xl font-bold text-center text-slate-900 mb-8">Why Use ProPhoto AI?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50/50 p-6 rounded-2xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Save Time & Money</h4>
              <p className="text-sm text-slate-600">No need to book an expensive studio session. Get high-quality results in seconds from your home.</p>
            </div>
            <div className="bg-blue-50/50 p-6 rounded-2xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Professional Grade</h4>
              <p className="text-sm text-slate-600">Our AI is trained on thousands of professional portraits to ensure perfect lighting and attire.</p>
            </div>
            <div className="bg-blue-50/50 p-6 rounded-2xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Privacy First</h4>
              <p className="text-sm text-slate-600">Your photos are processed securely and deleted from our active servers after transformation.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-bold">ProPhoto AI</span>
            </div>
            <p className="text-sm max-w-xs">Helping professionals around the world look their best on paper and screen.</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
          <p className="text-sm">© 2024 ProPhoto AI Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
