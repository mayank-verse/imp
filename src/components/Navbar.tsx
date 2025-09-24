"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Optional: add a subtle background after scrolling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${scrolled ? "bg-white/20 backdrop-blur-md shadow-md" : "bg-transparent"
                }`}
        >
            <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                {/* Logo */}
                <div className="text-2xl font-bold text-white hover:opacity-80 cursor-pointer">
                    <a href="/">SamudraLedger</a>
                </div>

                {/* Desktop Menu */}
                <ul className="hidden md:flex items-center gap-8 text-white font-medium">
                    {["Home", "Our Team", "Projects", "Buy Credits", "Contact"].map((item) => (
                        <li key={item} className="relative group cursor-pointer">
                            <span>{item}</span>
                            <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-white transition-all group-hover:w-full" />
                        </li>
                    ))}
                </ul>

                {/* Mobile Hamburger */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-black/70 backdrop-blur-md shadow-lg">
                    <ul className="flex flex-col items-center gap-6 py-6 text-white font-medium">
                        {["Home", "About", "Projects", "Buy Credits", "Contact"].map(
                            (item) => (
                                <li key={item} className="hover:text-green-400 cursor-pointer">
                                    {item}
                                </li>
                            )
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}
