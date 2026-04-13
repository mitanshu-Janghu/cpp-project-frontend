import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalHeight > 0 ? window.scrollY / totalHeight : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "Home", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <>
      <motion.div
        className="scroll-progress"
        style={{ scaleX: scrollProgress }}
      />
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? "glass-nav" : "bg-transparent"
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <span className="text-sm font-semibold tracking-[-0.04em] text-white">NC</span>
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-[-0.03em] text-white">NeuroCore</span>
            </div>
          </Link>

          <div className="glass-chip hidden items-center gap-2 rounded-full px-2 py-2 md:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  location.pathname === link.href
                    ? "bg-white/[0.14] text-white"
                    : "text-white/56 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/#workbench"
              className="inline-flex items-center justify-center rounded-full border border-primary/25 bg-primary px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
            >
              Train Now
            </a>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
