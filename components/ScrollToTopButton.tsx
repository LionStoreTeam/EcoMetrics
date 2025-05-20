// components/ScrollToTopButton.tsx
"use client"; // Marca el componente como de cliente

import { useEffect, useState } from 'react';

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`z-50 fixed bottom-8 right-8 bg-green-600 text-white p-2 rounded-full shadow-md transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            style={{ display: isVisible ? 'block' : 'none' }}
        >
            {/* Puedes usar un icono de flecha aquí */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                />
            </svg>
        </button>
    );
};

export default ScrollToTopButton;