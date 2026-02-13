import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Anchor, Globe, Activity } from 'lucide-react';

const FRAME_COUNT = 240;

export default function CrudeOil() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  
  // State for images
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Smooth scroll progress for less jittery scrubbing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20, restDelta: 0.001 });

  // Load images
  useEffect(() => {
    let mounted = true;
    const loadedImages: HTMLImageElement[] = new Array(FRAME_COUNT).fill(null);
    let loadedCount = 0;

    const loadImages = async () => {
      // Optimized batch loading (chunks of 20)
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        // Try both 3-digit padding (001) and if user used a tool that outputs standard numbers, wait.
        // User said "changed images inside {"file"..."}". Assuming same naming convention is safest: ezgif-frame-XXX.jpg
        const frameNumber = i.toString().padStart(3, '0');
        img.src = `/arot-l/ezgif-frame-${frameNumber}.jpg?v=2`;
        
        img.onload = () => {
          if (!mounted) return;
          loadedImages[i - 1] = img;
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / FRAME_COUNT) * 100));
          
          if (i === 1) setIsReady(true);
          if (loadedCount % 20 === 0) setImages([...loadedImages]); 
        };

        img.onerror = () => {
             // specific frame might be missing, assume valid flow
             loadedCount++;
             setLoadingProgress(Math.round((loadedCount / FRAME_COUNT) * 100));
        };
      }
    };

    loadImages();
    // Final sync check
    const interval = setInterval(() => {
        if(mounted && loadedCount > 0) setImages([...loadedImages]);
    }, 2000);

    return () => { 
        mounted = false; 
        clearInterval(interval);
    };
  }, []);

  // Canvas Drawing with Smooth Progress - FIXED RESOLUTION
  useEffect(() => {
    const render = (latest: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // CRITICAL FIX: Force canvas resolution to match window size
      // Without this, canvas defaults to 300x150 which causes black screen
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      }

      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(latest * FRAME_COUNT)
      );

      let img = images[frameIndex];
      if (!img) {
          img = images.slice(0, frameIndex).reverse().find(i => i) || images.find(i => i);
      }

      if (img && img.complete && img.naturalWidth > 0) {
         const hRatio = canvas.width / img.naturalWidth;
         const vRatio = canvas.height / img.naturalHeight;
         const ratio = Math.max(hRatio, vRatio);
         
         const centerShift_x = (canvas.width - img.naturalWidth * ratio) / 2;
         const centerShift_y = (canvas.height - img.naturalHeight * ratio) / 2;
         
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         ctx.drawImage(img, 
            0, 0, img.naturalWidth, img.naturalHeight,
            centerShift_x, centerShift_y, img.naturalWidth * ratio, img.naturalHeight * ratio
         );
      }
    };

    const unsubscribe = smoothProgress.onChange(render);
    render(smoothProgress.get());
    return () => unsubscribe();
  }, [smoothProgress, images]);

  // Resize handler (backup for window resize events)
  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current) {
              canvasRef.current.width = window.innerWidth;
              canvasRef.current.height = window.innerHeight;
          }
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial call
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Refined Overlay Transforms - Spaced out for 240 frames
  // Total Scroll: 0 -> 1
  
  // 1. Start (0.10 - 0.25)
  const opacity1 = useTransform(smoothProgress, [0.10, 0.15, 0.20, 0.25], [0, 1, 1, 0]);
  const y1 = useTransform(smoothProgress, [0.10, 0.25], [30, -30]);

  // 2. Middle (0.40 - 0.55)
  const opacity2 = useTransform(smoothProgress, [0.40, 0.45, 0.50, 0.55], [0, 1, 1, 0]);
  const y2 = useTransform(smoothProgress, [0.40, 0.55], [30, -30]);

  // 3. End (0.70 - 0.85)
  const opacity3 = useTransform(smoothProgress, [0.70, 0.75, 0.80, 0.85], [0, 1, 1, 0]);
  const y3 = useTransform(smoothProgress, [0.70, 0.85], [30, -30]);

  // 4. Final CTA (0.90+)
  const finalOpacity = useTransform(smoothProgress, [0.90, 0.98], [0, 1]);
  const finalScale = useTransform(smoothProgress, [0.90, 0.98], [0.9, 1]);


  return (
    <div ref={containerRef} className="relative h-[500vh] bg-black">
      
      {/* Sticky Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
        
        {!isReady && (
             <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
                 <div className="text-amber-500 font-mono text-sm tracking-widest">
                     Loading System: {loadingProgress}%
                 </div>
             </div>
        )}
      </div>

      {/* Floating Scroll Hint */}
      <motion.div 
        style={{ opacity: useTransform(smoothProgress, [0, 0.02], [1, 0]) }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 text-white z-20 flex flex-col items-center gap-2 pointer-events-none mix-blend-difference"
      >
        <span className="text-xs uppercase tracking-[0.2em]">Scroll to Initialize</span>
        <ChevronDown className="animate-bounce w-5 h-5" />
      </motion.div>

      {/* Overlay Sections */}
      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
          {/* Section 1 */}
          <motion.div style={{ opacity: opacity1, y: y1 }} className="absolute text-center max-w-4xl px-6">
               <h2 className="text-6xl md:text-8xl font-bold text-white mb-2 tracking-tighter drop-shadow-2xl">
                   LOGISTICS
               </h2>
               <p className="text-xl md:text-2xl text-amber-500 font-light tracking-widest uppercase">
                   Supply Chain Intelligence
               </p>
          </motion.div>

          {/* Section 2 */}
          <motion.div style={{ opacity: opacity2, y: y2 }} className="absolute text-center max-w-4xl px-6">
               <h2 className="text-6xl md:text-8xl font-bold text-amber-500 mb-2 tracking-tighter drop-shadow-2xl">
                   ANALYTICS
               </h2>
               <p className="text-xl md:text-2xl text-white font-light tracking-widest uppercase">
                   Real-time Data Processing
               </p>
          </motion.div>

          {/* Section 3 */}
          <motion.div style={{ opacity: opacity3, y: y3 }} className="absolute text-center max-w-4xl px-6">
               <h2 className="text-6xl md:text-8xl font-bold text-white mb-2 tracking-tighter drop-shadow-2xl">
                   FORECAST
               </h2>
               <p className="text-xl md:text-2xl text-amber-500 font-light tracking-widest uppercase">
                   Predictive Market Modeling
               </p>
          </motion.div>

          {/* Final CTA */}
          <motion.div style={{ opacity: finalOpacity, scale: finalScale }} className="absolute text-center pointer-events-auto">
               <h2 className="text-7xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-none">
                   AROT<span className="text-amber-500"></span>
               </h2>
               <Button 
                size="lg" 
                className="text-lg h-20 px-12 rounded-full bg-white text-black hover:bg-neutral-200 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] font-bold tracking-tight"
                onClick={() => navigate('/cot-reports?code=067651')}
               >
                 ANALYZE COT REPORT
                 <ArrowRight className="ml-2 w-5 h-5" />
               </Button>
          </motion.div>
      </div>

      {/* Custom Bottom Bar */}
      <motion.div 
        style={{ opacity: useTransform(smoothProgress, [0.05, 0.1], [0, 1]) }}
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/80 backdrop-blur-md px-6 py-3 flex justify-between items-center text-[10px] md:text-xs text-neutral-500 font-mono tracking-wider"
      >
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              SYSTEM ACTIVE
          </div>
          <div className="flex gap-4 md:gap-8">
              <span>LAT: 40.7128° N</span>
              <span className="hidden md:inline">LNG: 74.0060° W</span>
              <span className="text-amber-500">SECURE CONNECT</span>
          </div>
      </motion.div>

    </div>
  );
}
