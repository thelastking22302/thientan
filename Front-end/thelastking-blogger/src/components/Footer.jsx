import {
  Typography,
} from "@material-tailwind/react";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaLinkedin,
} from "react-icons/fa";
import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";

export function Footer() {
  return (
    <footer className="bg-black text-white px-6 pt-12 pb-8">
      {/* Top section */}
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <Typography
          variant="h6"
          className="text-4xl md:text-4xl font-bold text-white hover:text-red-500 transition-colors"
        >
          ThiênTânBlog
        </Typography>

        <div className="text-base text-gray-300 leading-6 space-y-2 text-left md:text-center">
          <p className="flex items-center justify-center gap-2 hover:text-blue-500 transition-colors">
            <MapPinIcon className="w-5 h-5 text-gray-400" />
            172 Phạm Văn Đồng, P.Nghĩa Chánh, TP Quảng Ngãi, tỉnh Quảng Ngãi
          </p>
          <p className="flex items-center justify-center gap-2 hover:text-blue-500 transition-colors">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            02553.830 237 - Fax: 02553.829 477
          </p>
          <p className="flex items-center justify-center gap-2 hover:text-blue-500 transition-colors">
            <GlobeAltIcon className="w-5 h-5 text-gray-400" />
            Website:
            <a
              href="https://thientangroup.vn"
              className="text-white hover:text-red-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              thientangroup.vn
            </a>
          </p>
          <p className="flex items-center justify-center gap-2 hover:text-blue-500 transition-colors">
            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
            Email:
            <a
              href="mailto:thientan@thientangroup.vn"
              className="text-white hover:text-red-500"
            >
              thientan@thientangroup.vn
            </a>
          </p>
          <p className="hover:text-blue-500 transition-colors">Giấy phép số: 02/GP-TTĐT ngày 15/03/2016.</p>
          <p className="hover:text-blue-500 transition-colors">Thiên Tân Group - Niềm tin không dừng lại</p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
            <FaLinkedin className="w-8 h-8" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
            <FaFacebook className="w-8 h-8" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
            <FaInstagram className="w-8 h-8" />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            <FaTiktok className="w-8 h-8" />
          </a>
        </div>

        <div className="mb-2">©2025-Thelastking</div>

        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Cookies</a>
          <a href="#" className="hover:text-white transition-colors">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;