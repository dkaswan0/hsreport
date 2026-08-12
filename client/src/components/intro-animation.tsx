import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import newLogoPath from "@assets/hs-logo.png";

interface IntroAnimationProps {
  onComplete: () => void;
  duration?: number;
}

export function IntroAnimation({ onComplete, duration = 4000 }: IntroAnimationProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 1200);
    const timer2 = setTimeout(() => setPhase('fade'), duration - 800);
    const timer3 = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {phase !== 'fade' && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)"
          }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-zinc-400/30 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0
                }}
                animate={{
                  y: [null, Math.random() * window.innerHeight],
                  scale: [0, 1, 0],
                  opacity: [0, 0.8, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Rotating gear rings */}
          <motion.div
            className="absolute w-[500px] h-[500px] border border-zinc-700/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] border border-zinc-700/50 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] border border-zinc-700 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />

          {/* Main content container */}
          <div className="relative flex flex-col items-center z-10">
            {/* Logo with glow effect */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                duration: 1.2 
              }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(197, 133, 44, 0.4) 0%, transparent 70%)",
                  transform: "scale(1.5)"
                }}
                animate={{
                  scale: [1.5, 1.8, 1.5],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Pulsing ring */}
              <motion.div
                className="absolute -inset-4 border-2 border-zinc-600 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 0, 0.8]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />

              {/* Logo image */}
              <motion.img
                src={newLogoPath}
                alt="High Safety"
                className="w-40 h-40 md:w-56 md:h-56 rounded-full object-cover shadow-2xl"
                style={{
                  boxShadow: "0 0 60px rgba(197, 133, 44, 0.5), 0 0 120px rgba(197, 133, 44, 0.3)"
                }}
                animate={{
                  boxShadow: [
                    "0 0 60px rgba(197, 133, 44, 0.5), 0 0 120px rgba(197, 133, 44, 0.3)",
                    "0 0 80px rgba(197, 133, 44, 0.7), 0 0 160px rgba(197, 133, 44, 0.4)",
                    "0 0 60px rgba(197, 133, 44, 0.5), 0 0 120px rgba(197, 133, 44, 0.3)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Text content */}
            <AnimatePresence>
              {phase === 'text' && (
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Arabic text */}
                  <motion.h1
                    className="text-2xl md:text-4xl font-black text-white font-arabic mb-2"
                    initial={{ opacity: 0, letterSpacing: "0.5em" }}
                    animate={{ opacity: 1, letterSpacing: "0.1em" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    مركز الأمان
                  </motion.h1>
                  
                  {/* Tagline */}
                  <motion.p
                    className="text-lg md:text-2xl font-arabic"
                    style={{
                      background: "linear-gradient(90deg, #ffffff, #a1a1aa, #ffffff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundSize: "200% 100%"
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{ 
                      opacity: { duration: 0.5, delay: 0.4 },
                      backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                    }}
                  >
                    الذي تثق به
                  </motion.p>

                  {/* English subtitle */}
                  <motion.p
                    className="text-sm md:text-base text-white/60 mt-2 tracking-widest"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    THE SAFETY CENTER YOU TRUST
                  </motion.p>

                  {/* Decorative line */}
                  <motion.div
                    className="mt-6 h-0.5 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: 200 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    style={{ margin: "0 auto" }}
                  />

                  {/* Loading indicator */}
                  <motion.div
                    className="mt-6 flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-white"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Corner decorations */}
          <motion.div
            className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-zinc-700"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          />
          <motion.div
            className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-zinc-700"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          />
          <motion.div
            className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-zinc-700"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          />
          <motion.div
            className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-zinc-700"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
