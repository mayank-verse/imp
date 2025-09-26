"use client";

import { useState, useEffect } from "react";
import { Menu, Waves, X } from "lucide-react";
import { ThemeToggleButton } from "../components/ThemeToggleButton";

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
            className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md shadow-md" : "bg-transparent"
                }`}
        >
            <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                {/* Logo */}
                <div className="text-2xl font-bold text-foreground hover:opacity-80 cursor-pointer">
                    <a href="/" title="Home"><Waves className="inline-block mr-2" /></a>
                </div>

                {/* Desktop Menu */}
                <ul className="hidden md:flex items-center gap-8 text-foreground font-medium">
                    {["Home", "Our Team", "Projects", "Buy Credits", "Contact"].map((item) => (
                        <li key={item} className="relative group cursor-pointer">
                            <span>{item}</span>
                            <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
                        </li>
                    ))}
                </ul>
                
                <div className="hidden md:flex items-center gap-4">
                    <ThemeToggleButton />
                </div>


                {/* Mobile Hamburger */}
                <div className="md:hidden flex items-center gap-4">
                    <ThemeToggleButton />
                    <button
                        className="text-foreground"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-background/90 backdrop-blur-md shadow-lg">
                    <ul className="flex flex-col items-center gap-6 py-6 text-foreground font-medium">
                        {["Home", "About", "Projects", "Buy Credits", "Contact"].map(
                            (item) => (
                                <li key={item} className="hover:text-primary cursor-pointer">
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

