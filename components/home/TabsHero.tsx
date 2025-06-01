"use client";

import Image from "next/image";
import { Tabs } from "./tabs"; // Asegúrate de que este componente acepte la prop `onTabChange`
import { useEffect, useState } from "react";

// DummyContent
interface DummyContentProps {
    tabIndex: number;
}

const DummyContent = ({ tabIndex }: DummyContentProps) => {
    const heroTabsImages = [
        { src: "/hero_tabs/act.png", alt: "Actividades" },
        { src: "/hero_tabs/estad.png", alt: "Estadísticas" },
        { src: "/hero_tabs/edu.png", alt: "Educación" },
        { src: "/hero_tabs/rew.png", alt: "Recompensas" },
        { src: "/hero_tabs/acopio.png", alt: "Acopio" },
    ];

    const image = heroTabsImages[tabIndex];

    return (
        <Image
            src={image.src}
            alt={image.alt}
            width={1000}
            height={1000}
            priority
            className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto"
        />
    );
};

// TabContent
interface TabContentProps {
    title: string;
    index: number;
}

const TabContent = ({ title, index }: TabContentProps) => (
    <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-green-950 to-slate-900">
        <p>{title}</p>
        <DummyContent tabIndex={index} />
    </div>
);

// TabsHero
export function TabsHero() {
    const [activeTabIndex, setActiveTabIndex] = useState(0);


    const tabs = [
        {
            title: "Actividades",
            value: "Actividades",
            content: <TabContent title="Registra tus Actividades" index={0} />,
        },
        {
            title: "Estadísticas",
            value: "Estadísticas",
            content: <TabContent title="Mira tus Estadísticas" index={1} />,
        },
        {
            title: "Educación",
            value: "Educación",
            content: <TabContent title="Explora el contenido Educativo" index={2} />,
        },
        {
            title: "Recompensas",
            value: "Recompensas",
            content: <TabContent title="Canjea increíbles recompensas" index={3} />,
        },
        {
            title: "Acopio",
            value: "Acopio",
            content: <TabContent title="Encuentra Centros de Acopio" index={4} />,
        },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTabIndex((prev) => (prev + 1) % tabs.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [tabs.length]);

    return (
        <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start mt-20 mb-40">
            <Tabs
                tabs={tabs as any}
                onTabChange={(index) => setActiveTabIndex(index)} // 🖱️ Manual
                activeTabIndex={activeTabIndex} // 🧠 Sincroniza
            />
        </div>
    );
}
