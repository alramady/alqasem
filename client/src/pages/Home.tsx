/*
 * Design: Saudi Architectural Luxury - Neo-Arabian Minimalism
 * Full page composition matching alqasem.com.sa structure
 */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import PropertiesSection from "@/components/PropertiesSection";
import ProjectsSection from "@/components/ProjectsSection";
import VideoShowcase from "@/components/VideoShowcase";
import PartnersSection from "@/components/PartnersSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <PropertiesSection />
      <ProjectsSection />
      <VideoShowcase />
      <PartnersSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
