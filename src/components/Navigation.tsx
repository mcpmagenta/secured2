import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Modern Navigation Component with Scale-inspired styling
const Navigation = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Menu items for the "Secure" dropdown
  const secureItems = [
    'QuantaMorphic® Technology',
    'Quantum-Resistant Encryption',
    'AI-Safe Protection',
    'Military-Grade Security',
    'Enterprise Solutions'
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    // Close dropdown when route changes
    setActiveDropdown(null);

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pathname]); // Add pathname as a dependency

  const handleMenuItemSelect = (item: string) => {
    console.log(`Selected: ${item}`);
    setActiveDropdown(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-blue-900/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Secure2
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            
            {/* Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'secure' ? null : 'secure')}
                className={`text-gray-300 hover:text-white transition-colors flex items-center ${activeDropdown === 'secure' ? 'text-blue-400' : ''}`}
              >
                Secure
                <svg
                  className={`ml-1 w-4 h-4 transition-transform ${activeDropdown === 'secure' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Stylish Dropdown Menu */}
              {activeDropdown === 'secure' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gradient-to-b from-[#0c1929] to-[#051525] rounded-lg shadow-lg shadow-blue-500/20 border border-blue-900/30 overflow-hidden z-50">
                  <div className="py-1">
                    {secureItems.map((item, index) => (
                      <a
                        key={index}
                        href="#"
                        className="block px-4 py-3 text-sm text-blue-300 hover:bg-blue-900/30 hover:text-blue-100 transition-colors border-l-2 border-transparent hover:border-blue-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMenuItemSelect(item);
                        }}
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                  
                  {/* Glowing accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-blue-500/0"></div>
                </div>
              )}
            </div>
            
            <Link href="/solutions" className="text-gray-300 hover:text-white transition-colors">
              Solutions
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>

          {/* CTA Button */}
          <Link
            href="/demo"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            Schedule Demo
          </Link>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-300 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
