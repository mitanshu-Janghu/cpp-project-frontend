const Footer = () => {
  const links = {
    Product: ["Documentation", "Getting Started", "API Reference", "Changelog"],
    Community: ["GitHub", "Discord", "Contributing", "Issues"],
    Legal: ["License (MIT)", "Privacy", "Terms"],
  };

  return (
    <footer className="border-t border-border/50 py-16">
      <div className="container mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">NC</span>
              </div>
              <span className="font-semibold text-foreground text-lg">NeuroCore</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              High-performance C++ deep learning engine with GPU support and AutoML.
            </p>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          © 2026 NeuroCore Engine. Built with conviction.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
