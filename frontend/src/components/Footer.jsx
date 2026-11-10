import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Flower2, Clock, CheckCircle } from 'lucide-react';

const Footer = () => {
  const location = useLocation();
  const hideFooterOnPages = [
    '/login',
    '/owner/login',
    '/manager/login',
    '/receptionist/login',
    '/owner/dashboard',
    '/manager/dashboard',
    '/owner/bookings',
    '/receptionist/dashboard'
  ];
  if (hideFooterOnPages.includes(location.pathname)) {
    return null;
  }

  return (
    <footer className="bg-white text-slate-600 py-10 px-4 sm:px-6 lg:px-8 mt-12 border-t border-slate-200/90 font-sans text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#7B1123] text-white rounded-full flex items-center justify-center font-bold">
              <Flower2 size={16} />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block leading-tight">Hotel Saravana Grand</span>
              <span className="text-[10px] text-[#7B1123] font-semibold">Madurai, Tamil Nadu</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Experience premier luxury chambers, traditional South Indian vegetarian hospitality, 24/7 dedicated room service, and complimentary valet parking in the heart of Madurai.
          </p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Navigation</h4>
          <ul className="space-y-2 text-[11px] text-slate-600">
            <li><Link to="/" className="hover:text-[#7B1123] transition-colors">Hotel Home</Link></li>
            <li><Link to="/book" className="hover:text-[#7B1123] transition-colors">Book Available Rooms</Link></li>
            <li><a href="#rooms" className="hover:text-[#7B1123] transition-colors">Chambers & Suites</a></li>
            <li><a href="#facilities" className="hover:text-[#7B1123] transition-colors">Amenities & Facilities</a></li>
            <li><a href="#contact" className="hover:text-[#7B1123] transition-colors">Location & Contact</a></li>
          </ul>
        </div>

        {/* Stay & Policies Column */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Stay Policies</h4>
          <ul className="space-y-2 text-[11px] text-slate-600">
            <li className="flex items-center gap-1.5">
              <Clock size={12} className="text-[#7B1123] shrink-0" />
              <span>Check-In: 12:00 PM • Check-Out: 11:00 AM</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle size={12} className="text-[#7B1123] shrink-0" />
              <span>Day Stay Package: 10:00 AM to 8:00 PM</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle size={12} className="text-[#7B1123] shrink-0" />
              <span>Free cancellation up to 24 hours prior</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle size={12} className="text-[#7B1123] shrink-0" />
              <span>Complimentary high-speed Wi-Fi & parking</span>
            </li>
          </ul>
        </div>

        {/* Location & Contact Column */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Contact Reservations</h4>
          <div className="text-[11px] text-slate-600 leading-relaxed space-y-2">
            <div className="flex items-start gap-1.5">
              <MapPin size={13} className="text-[#7B1123] shrink-0 mt-0.5" />
              <span>Mattuthavani Bus Stand Road, Near Periyar Bus Stand, Madurai, Tamil Nadu 625020</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-[#7B1123] shrink-0" />
              <span className="font-semibold text-slate-800">+91 452 234 5678</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail size={13} className="text-[#7B1123] shrink-0" />
              <span className="font-semibold text-slate-800">reservations@hotelsaravanagrand.com</span>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
        <div>© 2026 Hotel Saravana Grand. All rights reserved.</div>
        <div className="mt-2 sm:mt-0 font-semibold text-slate-700">Luxury Living & Vegetarian Hospitality</div>
      </div>
    </footer>
  );
};

export default Footer;
