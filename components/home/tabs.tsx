"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Tab = {
    title: string;
    value: string;
    content?: string | React.ReactNode | any;
    onTabChange: (index: number) => void;
    activeTabIndex?: number;
};

export const Tabs = ({
    tabs: propTabs,
    containerClassName,
    activeTabClassName,
    tabClassName,
    contentClassName,
    onTabChange,
    activeTabIndex, // ✅ Nuevo
}: {
    tabs: Tab[];
    containerClassName?: string;
    activeTabClassName?: string;
    tabClassName?: string;
    contentClassName?: string;
    onTabChange?: (index: number) => void;
    activeTabIndex?: number; // ✅ Nuevo
}) => {
    const [tabs, setTabs] = useState<Tab[]>(propTabs);
    const [hovering, setHovering] = useState(false);

    // 🔄 Actualizar tabs cuando cambia el índice externo
    useEffect(() => {
        if (typeof activeTabIndex === "number" && activeTabIndex >= 0 && activeTabIndex < propTabs.length) {
            const newTabs = [...propTabs];
            const selectedTab = newTabs.splice(activeTabIndex, 1);
            newTabs.unshift(selectedTab[0]);
            setTabs(newTabs);
        }
    }, [activeTabIndex, propTabs]);

    const handleTabClick = (index: number) => {
        const newTabs = [...propTabs];
        const selectedTab = newTabs.splice(index, 1);
        newTabs.unshift(selectedTab[0]);
        setTabs(newTabs);
        onTabChange?.(index);
    };

    return (
        <>
            <div
                className={cn(
                    "flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full",
                    containerClassName
                )}
            >
                <div className="bg-green-950 rounded-xl w-max flex p-1">

                    {propTabs.map((tab, idx) => (
                        <div
                            key={tab.title}
                            className="bg-green-950 p-2">
                            <button
                                onClick={() => handleTabClick(idx)}
                                onMouseEnter={() => setHovering(true)}
                                onMouseLeave={() => setHovering(false)}
                                className={cn("relative px-4 py-2 rounded-full", tabClassName)}
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                {tabs[0].value === tab.value && (
                                    <motion.div
                                        layoutId="clickedbutton"
                                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                                        className={cn("absolute inset-0 border-y-2 border-[#53c932]", activeTabClassName)}
                                    />
                                )}
                                <span className="relative block text-white">{tab.title}</span>
                            </button>
                        </div>
                    ))}
                </div>

            </div>
            <FadeInDiv
                tabs={tabs}
                active={tabs[0]}
                key={tabs[0].value}
                hovering={hovering}
                className={cn("mt-32", contentClassName)}
            />
        </>
    );
};


export const FadeInDiv = ({
    className,
    tabs,
    hovering,
}: {
    className?: string;
    key?: string;
    tabs: Tab[];
    active: Tab;
    hovering?: boolean;
}) => {
    const isActive = (tab: Tab) => {
        return tab.value === tabs[0].value;
    };
    return (
        <div className="relative w-full h-full">
            {tabs.map((tab, idx) => (
                <motion.div
                    key={tab.value}
                    layoutId={tab.value}
                    style={{
                        scale: 1 - idx * 0.1,
                        top: hovering ? idx * -50 : 0,
                        zIndex: -idx,
                        opacity: idx < 3 ? 1 - idx * 0.1 : 0,
                    }}
                    animate={{
                        y: isActive(tab) ? [0, 40, 0] : 0,
                    }}
                    className={cn("w-full h-full absolute top-0 left-0", className)}
                >
                    {tab.content}
                </motion.div>
            ))}
        </div>
    );
};
