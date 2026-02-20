import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import BenchmarkSection from "@/components/BenchmarkSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import ModelsSection from "@/components/ModelsSection";
import CLISection from "@/components/CLISection";
import GitHubSection from "@/components/GitHubSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <BenchmarkSection />
      <ArchitectureSection />
      <ModelsSection />
      <CLISection />
      <GitHubSection />
      <Footer />
    </div>
  );
};

export default Index;
