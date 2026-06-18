import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('#home')
  const location = useLocation()

  const navLinks = [
    { name: 'Home', path: '#home' },
    { name: 'Events', path: '#events' },
    { name: 'Gallery', path: '#gallery' },
    { name: 'Blog', path: '#blog' },
    { name: 'About Us', path: '#about' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll spy to update active section automatically
  useEffect(() => {
    if (location.pathname !== '/') return;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const path = `#${entry.target.id}`;
          setActiveSection(path);
          window.history.replaceState(null, '', `/${path === '#home' ? '' : path}`);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    navLinks.forEach(link => {
      if (link.path.startsWith('#')) {
        const el = document.getElementById(link.path.substring(1));
        if (el) observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (location.pathname !== '/') {
      // Allow default Link behavior to route back to home with hash
      return;
    }
    
    if (path.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(path.substring(1));
      if (element) {
        // Adjust scroll position for the fixed navbar height (approx 80px)
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
        window.history.pushState(null, '', `/${path}`);
        setActiveSection(path);
      } else if (path === '#home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
        setActiveSection(path);
      }
    }
    setIsOpen(false);
  }

  // Active state based on local state spy
  const isActive = (path: string) => {
    if (location.pathname !== '/') return false;
    return activeSection === path;
  }

  return (
    <div className="sticky top-0 z-50">
      <nav className={`w-full bg-[#eef5ee] rounded-b-3xl transition-all duration-500 ease-in-out ${
        scrolled 
          ? 'shadow-md border-b border-x border-[#1B4332]/10' 
          : 'shadow-none border-b border-x border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-300 flex items-center justify-between ${scrolled ? 'h-16' : 'h-20'}`}>
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo.jpg" alt="OviJatrik Logo" className="h-10 w-10 rounded-full border-2 border-adventure-orange transition-transform group-hover:scale-105 object-cover" />
              <span className="text-[#1B4332] font-garamond font-bold text-2xl tracking-tight group-hover:text-adventure-orange transition-colors">
                Ovijatrik
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={`/${link.path}`}
                  onClick={(e) => handleNavClick(e, link.path)}
                  className={`${
                    isActive(link.path)
                      ? 'text-adventure-orange border-b-2 border-adventure-orange'
                      : 'text-slate-600 hover:text-[#1B4332] hover:border-b-2 hover:border-[#1B4332]/30'
                  } px-1 py-2 text-sm font-medium transition-all duration-200`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/auth"
                className="ml-4 px-5 py-2 rounded-full bg-adventure-orange text-white font-semibold text-sm hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-adventure-orange/40 transition-all duration-300 shadow-md shadow-adventure-orange/20"
              >
                Member Login
              </Link>
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none transition-colors text-slate-600 hover:text-[#1B4332] hover:bg-black/5"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden shadow-lg bg-[#eef5ee] border-t border-[#1B4332]/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={`/${link.path}`}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`${
                  isActive(link.path)
                    ? 'bg-adventure-orange/10 text-adventure-orange'
                    : 'text-slate-600 hover:bg-black/5 hover:text-[#1B4332]'
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setIsOpen(false)}
              className="mt-4 block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-adventure-orange hover:bg-orange-600"
            >
              Member Login
            </Link>
          </div>
        </div>
      )}
      </nav>
    </div>
  )
}
