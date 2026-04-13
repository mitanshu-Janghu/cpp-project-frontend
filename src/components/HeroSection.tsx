import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { motion } from "framer-motion";
import { ArrowRight, Download, LineChart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetRef.current) {
      return;
    }

    const animations = [
      animate(widgetRef.current.querySelectorAll(".hero-device__glow"), {
        translateX: [0, 18],
        translateY: [0, -14],
        scale: [1, 1.08],
        duration: 4200,
        loop: true,
        direction: "alternate",
        ease: "inOutSine",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-device__signal"), {
        opacity: [0.5, 1, 0.5],
        translateY: [0, -4, 0],
        duration: 2400,
        loop: true,
        ease: "inOutSine",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom__backglow"), {
        scale: [0.96, 1.04, 0.98],
        opacity: [0.26, 0.48, 0.3],
        duration: 3600,
        loop: true,
        ease: "inOutSine",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__orbit-group--a"), {
        rotate: "1turn",
        duration: 12000,
        loop: true,
        ease: "linear",
        transformOrigin: "0px 0px",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__orbit-group--b"), {
        rotate: "-1turn",
        duration: 13600,
        loop: true,
        ease: "linear",
        transformOrigin: "0px 0px",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__orbit-group--c"), {
        rotate: "1turn",
        duration: 15400,
        loop: true,
        ease: "linear",
        transformOrigin: "0px 0px",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__orbit-group--d"), {
        rotate: "-1turn",
        duration: 11200,
        loop: true,
        ease: "linear",
        transformOrigin: "0px 0px",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__electron"), {
        scale: [0.92, 1.08, 0.96],
        opacity: [0.78, 1, 0.86],
        delay: stagger(120),
        duration: 1800,
        loop: true,
        direction: "alternate",
        ease: "inOutSine",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__nucleus-cluster"), {
        scale: [1, 1.06, 1],
        opacity: [0.94, 1, 0.96],
        duration: 2800,
        loop: true,
        ease: "inOutSine",
        transformOrigin: "0px 10px",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__nucleus-aura"), {
        scale: [0.96, 1.08, 1],
        opacity: [0.42, 0.68, 0.48],
        duration: 2600,
        loop: true,
        ease: "inOutSine",
      }),
      animate(widgetRef.current.querySelectorAll(".hero-atom-svg__nucleus-particle"), {
        scale: [0.84, 1.22, 0.92],
        translateX: [-1.5, 1.5, -0.8],
        translateY: [1, -1.2, 0.8],
        opacity: [0.68, 1, 0.76],
        delay: stagger(90, { from: "center" }),
        duration: 1800,
        loop: true,
        direction: "alternate",
        ease: "inOutSine",
      }),
    ];

    return () => {
      animations.forEach((animation) => animation?.pause?.());
    };
  }, []);

  return (
    <section className="relative overflow-hidden px-6 pb-8 pt-28 sm:pt-32">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-16" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(135,209,255,0.12),transparent_24%),linear-gradient(180deg,rgba(6,10,18,0.16),rgba(6,10,18,0.88)_48%,rgba(6,10,18,1))]" />
        <div className="absolute inset-0 aurora-grid opacity-45" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="absolute left-[8%] top-14 h-40 w-40 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute right-[10%] top-24 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="grid items-center gap-12 lg:grid-cols-[0.96fr_1.04fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="hero-stage"
          >
            <div className="premium-pill mx-auto lg:mx-0">
              <Sparkles className="h-4 w-4 text-primary" />
              Premium C++ training studio
            </div>

            <h1 className="mx-auto mt-7 max-w-[19rem] text-center text-[2.55rem] font-semibold leading-[0.97] tracking-[-0.055em] text-white sm:max-w-[24rem] sm:text-[3.1rem] lg:mx-0 lg:max-w-[32rem] lg:text-left lg:text-[3.8rem]">
              Turn raw CSVs
              <br />
              into trained models
              <br />
              <span className="hero-headline-shine">with one beautiful workflow.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-center text-base leading-8 text-white/60 sm:text-lg lg:mx-0 lg:text-left">
              Preview the dataset, compare candidate algorithms, train the best performer on your C++ backend,
              and download the final model in a surface that feels polished, fast, and premium.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <a href="#workbench" className="liquid-button">
                Open Training Studio
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/leaderboard"
                className="glass-chip inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-medium text-white/78 transition-colors hover:bg-white/[0.08]"
              >
                View Leaderboard
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {["Classical models", "ANN variants", "Real-time graphs"].map((item) => (
                <span key={item} className="premium-tag text-white/72">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08 }}
            className="relative"
          >
            <div ref={widgetRef} className="hero-device">
              <div className="hero-device__glow" />
              <div className="hero-device__header">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                </div>
                <div className="hero-device__pill">NeuroCore Studio</div>
              </div>

              <div className="hero-device__body">
                <div className="hero-atom-panel">
                  <div className="hero-device__signal">Model confidence</div>
                  <div className="hero-atom">
                    <div className="hero-atom__scene">
                      <div className="hero-atom__backglow" />
                      <svg className="hero-atom-svg" viewBox="0 0 520 520" aria-hidden="true">
                        <defs>
                          <filter id="hero-orbit-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3.6" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="hero-electron-glow" x="-120%" y="-120%" width="340%" height="340%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="hero-nucleus-glow" x="-160%" y="-160%" width="420%" height="420%">
                            <feGaussianBlur stdDeviation="18" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <radialGradient id="hero-electron-fill" cx="35%" cy="35%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="70%" stopColor="#f5f6ff" />
                            <stop offset="100%" stopColor="#dbe4ff" />
                          </radialGradient>
                          <radialGradient id="hero-orbit-a" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="rgba(232,236,255,0.96)" />
                            <stop offset="100%" stopColor="rgba(169,183,255,0.76)" />
                          </radialGradient>
                          <radialGradient id="hero-orbit-b" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="rgba(218,224,255,0.9)" />
                            <stop offset="100%" stopColor="rgba(146,116,255,0.52)" />
                          </radialGradient>
                          <radialGradient id="hero-orbit-c" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="rgba(225,230,255,0.92)" />
                            <stop offset="100%" stopColor="rgba(122,166,255,0.48)" />
                          </radialGradient>
                          <radialGradient id="hero-nucleus-core-fill" cx="45%" cy="40%">
                            <stop offset="0%" stopColor="#ffe7ef" />
                            <stop offset="55%" stopColor="#ff7994" />
                            <stop offset="100%" stopColor="#ff3f59" />
                          </radialGradient>
                        </defs>

                        <g transform="translate(260 260)">
                          <g className="hero-atom-svg__orbit-group hero-atom-svg__orbit-group--a">
                            <g transform="rotate(8)">
                              <ellipse className="hero-atom-svg__orbit" cx="0" cy="0" rx="134" ry="54" stroke="url(#hero-orbit-a)" filter="url(#hero-orbit-glow)" />
                              <circle className="hero-atom-svg__electron" cx="134" cy="0" r="12" fill="url(#hero-electron-fill)" filter="url(#hero-electron-glow)" />
                            </g>
                          </g>

                          <g className="hero-atom-svg__orbit-group hero-atom-svg__orbit-group--b">
                            <g transform="rotate(-34)">
                              <ellipse className="hero-atom-svg__orbit" cx="0" cy="0" rx="128" ry="56" stroke="url(#hero-orbit-b)" filter="url(#hero-orbit-glow)" />
                              <circle className="hero-atom-svg__electron" cx="-128" cy="0" r="12" fill="url(#hero-electron-fill)" filter="url(#hero-electron-glow)" />
                            </g>
                          </g>

                          <g className="hero-atom-svg__orbit-group hero-atom-svg__orbit-group--c">
                            <g transform="rotate(62)">
                              <ellipse className="hero-atom-svg__orbit" cx="0" cy="0" rx="132" ry="52" stroke="url(#hero-orbit-c)" filter="url(#hero-orbit-glow)" />
                              <circle className="hero-atom-svg__electron" cx="132" cy="0" r="12" fill="url(#hero-electron-fill)" filter="url(#hero-electron-glow)" />
                            </g>
                          </g>

                          <g className="hero-atom-svg__orbit-group hero-atom-svg__orbit-group--d">
                            <g transform="rotate(4)">
                              <ellipse className="hero-atom-svg__orbit" cx="0" cy="0" rx="44" ry="150" stroke="url(#hero-orbit-a)" filter="url(#hero-orbit-glow)" />
                              <circle className="hero-atom-svg__electron" cx="44" cy="-150" r="12" fill="url(#hero-electron-fill)" filter="url(#hero-electron-glow)" />
                            </g>
                          </g>

                          <g className="hero-atom-svg__nucleus-cluster" transform="translate(0 10)">
                            <circle className="hero-atom-svg__nucleus-aura" cx="0" cy="0" r="78" fill="rgba(255,58,94,0.16)" filter="url(#hero-nucleus-glow)" />
                            <circle className="hero-atom-svg__nucleus-aura" cx="0" cy="0" r="50" fill="rgba(255,74,112,0.24)" filter="url(#hero-nucleus-glow)" />
                            <circle className="hero-atom-svg__nucleus-core" cx="0" cy="0" r="34" fill="rgba(84,14,20,0.72)" />
                            {[
                              [-18, -14],
                              [-2, -18],
                              [14, -12],
                              [24, -2],
                              [-28, 0],
                              [-10, 8],
                              [8, 10],
                              [24, 14],
                              [-18, 18],
                              [0, 22],
                              [18, 26],
                              [34, 12],
                            ].map(([cx, cy], index) => (
                              <circle
                                key={`nucleus-${index}`}
                                className="hero-atom-svg__nucleus-particle"
                                cx={cx}
                                cy={cy}
                                r={index % 3 === 0 ? 8 : 6.5}
                                fill="url(#hero-nucleus-core-fill)"
                                filter="url(#hero-nucleus-glow)"
                              />
                            ))}
                          </g>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
            <div className="hero-shelf-card">
              <LineChart className="h-5 w-5 text-primary" />
              <p className="mt-5 text-xs uppercase tracking-[0.26em] text-white/42">Compare</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">All candidates in one ranking</p>
              <p className="mt-3 text-sm leading-6 text-white/54">See which model wins before you commit to export.</p>
            </div>
            <div className="hero-shelf-card">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-5 text-xs uppercase tracking-[0.26em] text-white/42">Preview</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">See the dataset before training</p>
              <p className="mt-3 text-sm leading-6 text-white/54">Check scatter views, target trends, and table rows instantly.</p>
            </div>
            <div className="hero-shelf-card">
              <Download className="h-5 w-5 text-primary" />
              <p className="mt-5 text-xs uppercase tracking-[0.26em] text-white/42">Export</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Download the winning model package</p>
              <p className="mt-3 text-sm leading-6 text-white/54">Take the trained artifact and supporting files in one pass.</p>
            </div>
          </div>
      </div>
    </section>
  );
};

export default HeroSection;
