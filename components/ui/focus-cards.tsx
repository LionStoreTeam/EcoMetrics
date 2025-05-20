"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const Card = React.memo(
    ({
        card,
        index,
        hovered,
        setHovered,
    }: {
        card: any;
        index: number;
        hovered: number | null;
        setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    }) => (
        <div className="p-2">
            <p>Título: {card.title}</p>
            <div
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                    "relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-[22rem] w-full transition-all duration-300 ease-out",
                    hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
                )}
            >
                <img
                    src={card.src}
                    alt={card.title}
                    className="object-cover absolute h-full w-full"
                />
                <div
                    className={cn(
                        "absolute inset-0 bg-black/50 flex items-end p-3 transition-opacity duration-300",
                        hovered === index ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div className=" w-full flex justify-center items-center">
                        <p className="text-xl md:text-2xl text-center font-medium bg-white rounded-sm text-green-200">
                            Mostar más información
                        </p>
                    </div>

                </div>
            </div>
        </div>

    )
);

Card.displayName = "Card";

type Card = {
    id: string
    title: string;
    description: string;
    src: string;
};

export function FocusCards({ cards }: { cards: Card[] }) {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {cards.map((card, index) => (
                <Card
                    key={card.id}
                    card={card}
                    index={index}
                    hovered={hovered}
                    setHovered={setHovered}
                />
            ))}
        </div>
    );
}


