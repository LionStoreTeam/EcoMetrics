// lib/constants.ts

export const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Coahuila",
  "Colima",
  "Ciudad de México",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const; // 'as const' para que TypeScript infiera los tipos literales

export type MexicanState = (typeof MEXICAN_STATES)[number];

export const MATERIAL_CATEGORIES_ES = {
  PLASTIC: "Plástico",
  PAPER: "Papel y Cartón",
  GLASS: "Vidrio",
  METAL: "Metal",
  ORGANIC: "Orgánico",
  ELECTRONIC: "Electrónico",
  HAZARDOUS: "Peligroso",
  OTHER: "Otro",
} as const;

// Card Lens
