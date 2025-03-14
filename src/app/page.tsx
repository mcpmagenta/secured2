"use client";

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { IndustryType } from '../components/Industry3DIcon';

// Dynamically import Three.js components to avoid SSR issues
const Navigation = dynamic(() => import('../components/Navigation'), {
  ssr: false,
  loading: () => <div className="h-20 bg-black" />
});

// Hero3D component - commented out as it's not currently used
// const Hero3D = dynamic(() => import('../components/Hero3D'), {
//   ssr: false,
//   loading: () => <div className="w-full h-[600px] bg-black" />
// });

// Import components directly instead of using dynamic import
// This avoids React DOM reconciliation issues
import DataProtectionJourney from '../components/DataProtectionJourney';

// Dynamically import the IndustryIconsScene component
const IndustryIconsScene = dynamic(() => import('../components/IndustryIconsScene'), {
  ssr: false,
  loading: () => <div className="w-full h-24 bg-transparent" />
});

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dataJourneyRef = useRef<HTMLDivElement>(null);
  const dataJourneySectionRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

// Create a safer approach for storing ScrollTrigger instances
type ScrollTriggerInstance = ScrollTrigger;

const scrollTriggerStore = {
  mainInstances: [] as ScrollTriggerInstance[],
  sectionInstances: [] as ScrollTriggerInstance[]
};
  
  // Effect to detect initial scroll and hide the indicator
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled && window.scrollY > 50) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  // Register ScrollTrigger plugin and set up animations
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;
    
    // Create local references to avoid stale closures
    const dataJourneySection = dataJourneySectionRef.current;
    const textContent = textContentRef.current;
    
    // Delay initialization slightly to ensure DOM is fully ready
    const initTimeout = setTimeout(() => {
      // Register GSAP ScrollTrigger first
      gsap.registerPlugin(ScrollTrigger);
      
      // Verify DOM elements exist before proceeding
      if (!dataJourneySection) {
        console.error('Data journey section not found');
        return;
      }
      
      console.log('Initializing ScrollTrigger with:', {
        dataJourneySection,
        childNodes: dataJourneySection.childNodes
      });
      
      // Create scroll trigger for the entire data journey section
      // Handle pinning at the page level to avoid DOM insertion errors
      
      // Define scrollTriggerInstances at a higher scope to make it accessible throughout the function
      const scrollTriggerInstances: ScrollTriggerInstance[] = [];
      
      if (dataJourneySection) {
        const scrollTrigger = ScrollTrigger.create({
          trigger: dataJourneySection,
          start: 'top top',
          end: '+=150%', // Increased scroll distance to match DataProtectionJourney component
          scrub: 3, // Increased scrub value for smoother, slower transitions
          pin: true, // Pin at the page level
          pinSpacing: true, // Allow space for the animation
          anticipatePin: 1, // Helps prevent DOM insertion errors
          invalidateOnRefresh: true, // Revalidate DOM on refresh
          markers: false,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          }
        });
        
        // Add the ScrollTrigger instance to our array for cleanup
        scrollTriggerInstances.push(scrollTrigger);
      }
      
      // Animate the text content based on scroll progress
      if (textContent) {
        const h1Element = textContent.querySelector('h1');
        const pElement = textContent.querySelector('p');
        const ctaButtons = textContent.querySelector('.cta-buttons');
        
        // Verify elements exist before animating
        if (h1Element && pElement && ctaButtons) {
          const textTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: dataJourneySection,
              start: 'top top',
              end: 'bottom+=100% top',
              scrub: 1
            }
          });
          
          textTimeline
            .to(h1Element, {
              y: -50,
              opacity: 0.7,
              scale: 0.9,
              duration: 1.5, // Extended duration for smoother animation
              ease: 'sine.inOut' // Gentler easing for smoother transitions
            }, 0)
            .to(pElement, {
              y: -30,
              opacity: 0.5,
              duration: 1.5, // Extended duration
              ease: 'sine.inOut' // Gentler easing
            }, 0.2)
            .to(ctaButtons, {
              y: -20,
              opacity: 0,
              duration: 1.5, // Extended duration
              ease: 'sine.inOut' // Gentler easing
            }, 0.3);
          
          // Store the ScrollTrigger instance
          if (textTimeline.scrollTrigger) {
            scrollTriggerInstances.push(textTimeline.scrollTrigger);
          }
        }
      }
      
      // Phase text animations - using a safer query selector approach
      const phaseItems = dataJourneySection.querySelectorAll('.phase-item');
      if (phaseItems && phaseItems.length) {
        gsap.set(phaseItems, { opacity: 0, y: 20 });
        
        const phaseTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: dataJourneySection,
            start: 'top top',
            end: 'bottom+=100% top',
            scrub: 1
          }
        });
        
        // Only animate if elements exist - with extended durations and smoother easing
        if (phaseItems[0]) phaseTimeline.to(phaseItems[0], { opacity: 1, y: 0, duration: 0.5, ease: 'sine.inOut' }, 0.1);
        if (phaseItems[1]) phaseTimeline.to(phaseItems[1], { opacity: 1, y: 0, duration: 0.5, ease: 'sine.inOut' }, 0.45); // Adjusted timing
        if (phaseItems[2]) phaseTimeline.to(phaseItems[2], { opacity: 1, y: 0, duration: 0.5, ease: 'sine.inOut' }, 0.8); // Adjusted timing
        
        // Store the ScrollTrigger instance
        if (phaseTimeline.scrollTrigger) {
          scrollTriggerInstances.push(phaseTimeline.scrollTrigger);
        }
      }
      
      // Store all created instances for proper cleanup
      scrollTriggerStore.mainInstances = scrollTriggerInstances;
    }, 100); // Small delay to ensure DOM is ready
    
    // Comprehensive cleanup function
    return () => {
      // Clear initialization timeout
      clearTimeout(initTimeout);
      
      // Clean up stored ScrollTrigger instances
      if (scrollTriggerStore.mainInstances.length > 0) {
        scrollTriggerStore.mainInstances.forEach((instance: ScrollTriggerInstance) => {
          if (instance && typeof instance.kill === 'function') {
            instance.kill();
          }
        });
        scrollTriggerStore.mainInstances = [];
      }
      
      // Kill all ScrollTrigger instances to be thorough
      if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.getAll) {
        ScrollTrigger.getAll().forEach(t => t.kill());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Separate useEffect for section animations to avoid conflicts
  useEffect(() => {
    // Store reference to scrollTriggerStore for cleanup
    if (typeof window === 'undefined') return;
    
    // Small delay to ensure main ScrollTrigger initialization is complete
    const animationTimeout = setTimeout(() => {
      // Register GSAP ScrollTrigger if needed
      if (typeof ScrollTrigger === 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }
      
      // Store created instances for cleanup
      const sectionTriggers: ScrollTriggerInstance[] = [];
      
      // Animate sections on scroll - using a safer approach
      const sections = document.querySelectorAll('.animate-section');
      if (sections && sections.length) {
        sections.forEach((section) => {
          // Create animation only if element exists
          if (section) {
            const trigger = gsap.fromTo(
              section,
              { opacity: 0, y: 50 },
              {
                opacity: 1,
                y: 0,
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom-=100',
                  end: 'center center+=100',
                  scrub: 0.5,
                  invalidateOnRefresh: true
                }
              }
            );
            
            if (trigger && trigger.scrollTrigger) {
              sectionTriggers.push(trigger.scrollTrigger);
            }
          }
        });
      }
      
      // Animate 3D cards on scroll - check if element exists first
      const cardsContainer = document.querySelector('.cards-container');
      if (cardsContainer) {
        const cardsTrigger = gsap.fromTo(
          cardsContainer,
          { opacity: 0 },
          {
            opacity: 1,
            scrollTrigger: {
              trigger: cardsContainer,
              start: 'top bottom',
              end: 'center center',
              scrub: 0.5,
              invalidateOnRefresh: true
            }
          }
        );
        
        if (cardsTrigger && cardsTrigger.scrollTrigger) {
          sectionTriggers.push(cardsTrigger.scrollTrigger);
        }
      }
      
      // Store for cleanup
      scrollTriggerStore.sectionInstances = sectionTriggers;
    }, 200); // Delay to ensure main ScrollTrigger initialization is complete
    
    // Cleanup function
    return () => {
      clearTimeout(animationTimeout);
      
      // Clean up section triggers
      if (scrollTriggerStore.sectionInstances.length > 0) {
        scrollTriggerStore.sectionInstances.forEach((trigger: ScrollTriggerInstance) => {
          if (trigger && typeof trigger.kill === 'function') {
            trigger.kill();
          }
        });
        scrollTriggerStore.sectionInstances = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative bg-black text-white overflow-hidden">
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section with Data Journey */}
      <section 
        id="hero-section"
        ref={dataJourneySectionRef}
        className="flex flex-col items-center relative overflow-hidden"
        style={{ minHeight: '100vh' }}> {/* Reduced height to minimize black space */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/30 z-0" />
        
        {/* Split Layout for Content and 3D Visualization */}
        <div className="container mx-auto px-4 z-10 pt-24 flex flex-col lg:flex-row items-start justify-between transition-all duration-700 ease-out">
          {/* Scroll indicator - Enhanced with higher z-index and auto-hide functionality */}
          <div 
            className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white z-50 scroll-indicator transition-opacity duration-500 ${hasScrolled ? 'opacity-0' : 'opacity-100'}`}
          >
            <p className="mb-2 text-lg font-medium drop-shadow-lg">Scroll to see the journey</p>
            <div className="animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
          
          {/* Phase indicators that appear during scroll */}
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 flex flex-col space-y-16 z-20 hidden lg:block">
            <div className="phase-item flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <p className="text-blue-300 font-medium">Shrink</p>
            </div>
            <div className="phase-item flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <p className="text-orange-300 font-medium">Shred</p>
            </div>
            <div className="phase-item flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <p className="text-green-300 font-medium">Secure</p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Text Content */}
            <div ref={textContentRef} className="lg:w-2/5 text-left mb-8 lg:mb-0 order-first">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Quantum-secure® 
                <br />
                & AI-safe
              </span>
              <span className="block text-white">
                Data Protection
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-xl font-light mb-8">
              Pioneering the future of data security with QuantaMorphic® technology,
              protecting your data against tomorrow&apos;s quantum and AI threats—today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <a 
                href="#demo" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transform hover:scale-105 active:scale-95"
              >
                Schedule Demo
              </a>
            </div>
            
            {/* Feature Labels */}
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-3"></div>
                <span className="text-blue-300">Shrink your data to reduce attack surface</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-orange-400 mr-3"></div>
                <span className="text-orange-300">Shred into quantum-resistant fragments</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                <span className="text-green-300">Secure against quantum & AI threats</span>
              </div>
            </div>
            </div>
            
            {/* 3D Visualization */}
            <div ref={dataJourneyRef} className="lg:w-3/5 h-[600px] relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1929] to-black/80 border border-blue-900/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)] z-0" />
              <DataProtectionJourney scrollContainerId="hero-section" />
            </div>
          </div>
          
          {/* Removed duplicate 3D visualization */}
        </div>
      </section>

      {/* QuantaMorphic® Technology Section - No 3D visualization here anymore */}
      <section id="data-journey-section" className="py-20 relative animate-section bg-gradient-to-b from-black to-gray-900 mt-0 overflow-visible">
        <div className="container mx-auto px-4 overflow-visible">
          <div className="text-center mb-8 overflow-visible">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-snug bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent overflow-visible">
              QuantaMorphic® Technology
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our revolutionary approach to data security transforms how your information is protected
            </p>
          </div>
          
          {/* Technology description cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gray-900/50 p-6 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="text-blue-300 text-2xl font-bold mb-3">Shrink</div>
              <p className="text-gray-300">Our patented compression algorithms reduce your data&apos;s attack surface by up to 90%, making it significantly harder for attackers to target.</p>
            </div>
            <div className="bg-gray-900/50 p-6 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="text-orange-300 text-2xl font-bold mb-3">Shred</div>
              <p className="text-gray-300">Your data is fragmented into quantum-resistant shards, each individually encrypted and distributed across secure locations.</p>
            </div>
            <div className="bg-gray-900/50 p-6 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="text-green-300 text-2xl font-bold mb-3">Secure</div>
              <p className="text-gray-300">Multiple layers of post-quantum cryptography ensure your data remains protected against both current and future threats.</p>
            </div>
          </div>
        </div>
      </section>
      
      
      {/* Use Cases Section */}
      <section className="py-20 relative animate-section overflow-visible">
        <div className="container mx-auto px-4 overflow-visible">
          <div className="text-center mb-16 overflow-visible">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-snug bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent overflow-visible">
              Industry Solutions
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Secured2 provides tailored security solutions for various industries
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Healthcare',
                description: 'Protect patient data and meet HIPAA compliance requirements',
                industry: 'healthcare' as IndustryType,
                color: '#dc2626'
              },
              {
                title: 'Financial Services',
                description: 'Secure transactions and sensitive financial information',
                industry: 'financial' as IndustryType,
                color: '#eab308'
              },
              {
                title: 'Government',
                description: 'Military-grade protection for classified information',
                industry: 'government' as IndustryType,
                color: '#e5e7eb'
              },
              {
                title: 'Enterprise',
                description: 'Safeguard intellectual property and business secrets',
                industry: 'enterprise' as IndustryType,
                color: '#6366f1'
              },
              {
                title: 'Legal',
                description: 'Ensure client confidentiality and document security',
                industry: 'legal' as IndustryType,
                color: '#3b82f6'
              },
              {
                title: 'Education',
                description: 'Protect student records and research data',
                industry: 'education' as IndustryType,
                color: '#f59e0b'
              }
            ].map((item, index) => (
              <div key={index} className="bg-[#0c1929] p-8 rounded-xl border border-blue-900/30 hover:border-blue-500/50 transition-colors group">
                <div className="h-24 mb-4 flex items-center justify-center">
                  <IndustryIconsScene industry={item.industry} color={item.color} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-blue-400 group-hover:text-blue-300 transition-colors">{item.title}</h3>
                <p className="text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 relative bg-gradient-to-b from-[#0c1929] to-black animate-section overflow-visible">
        <div className="container mx-auto px-4 text-center overflow-visible">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-snug bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent overflow-visible">
            Ready to secure your data?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Contact us today to learn how Secured2 can protect your most valuable assets
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="#demo" 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transform hover:scale-105 active:scale-95"
            >
              Schedule Demo
            </a>
            <a 
              href="/contact" 
              className="px-8 py-4 bg-transparent border-2 border-blue-500/50 text-blue-400 rounded-full font-semibold hover:border-blue-400 hover:text-blue-300 transition-colors transform hover:scale-105 active:scale-95"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t border-blue-900/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Secured2
              </span>
              <p className="text-gray-400 mt-2">Quantum-secure® & AI-safe Data Protection</p>
            </div>
            
            <div className="flex space-x-8">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="mt-8 text-center text-gray-500">
            © {new Date().getFullYear()} Secured2. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
