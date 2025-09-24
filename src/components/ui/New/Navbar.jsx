import { Waves } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-black">
      {/* Left Logo */}
      <div className="flex items-center">
        <div className="bg-[#1A1A1A] p-2 rounded-md">
          {/* Replace with your logo image */}
          <Waves className="text-black" />
        </div>
      </div>

      
      <div className="flex items-center gap-6 text-sm font-medium text-gray-900">
        <a href="#" className="hover:text-gray-700">
          About Us
        </a>
        <a href="#" className="hover:text-gray-700">
          Resources
        </a>
        <a href="#" className="hover:text-gray-700">
          News
        </a>
      </div>
    </nav>
  );
}
