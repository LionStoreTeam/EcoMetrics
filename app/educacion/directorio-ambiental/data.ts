import {
  Building,
  Landmark,
  MapPin,
  Users,
  HeartHandshake,
  Film,
  BookOpen,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Interfaces para los datos
export interface ContactInfo {
  phone?: string;
  email?: string;
  alternativeLink?: string;
  relevantAddresses?: string[];
  subDirectorates?: { name: string; contact?: string }[];
}

export interface BaseResource {
  id: string;
  name: string;
  description: string;
  link?: string;
  icon?: LucideIcon;
  contact?: ContactInfo;
}

export interface MediaResource extends BaseResource {
  whereToWatch?: string;
  sourceLink?: string; // Para enlaces directos a la fuente del documental/libro si no es una plataforma
}

export interface WebsiteResource {
  id: string;
  name: string;
  description: string;
  link: string;
  icon?: LucideIcon;
}

export interface DirectorySection {
  id: string;
  title: string;
  icon?: LucideIcon;
  resources: BaseResource[] | MediaResource[] | WebsiteResource[];
}

export interface AccordionMediaItem {
  id: string;
  title: string;
  icon?: LucideIcon;
  items: MediaResource[] | WebsiteResource[];
}

// Datos del Directorio
export const directoryData: {
  sections: DirectorySection[];
  mediaSection: {
    id: string;
    title: string;
    accordionItems: AccordionMediaItem[];
  };
} = {
  sections: [
    {
      id: "gov-orgs-mx",
      title: "Organizaciones Gubernamentales (México)",
      icon: Building,
      resources: [
        {
          id: "semarnat",
          name: "Secretaría de Medio Ambiente y Recursos Naturales (SEMARNAT)",
          description:
            "Dependencia del gobierno federal encargada de la protección, restauración y conservación de los ecosistemas y recursos naturales de México.",
          link: "https://www.gob.mx/semarnat",
        },
        {
          id: "conagua",
          name: "Comisión Nacional del Agua (CONAGUA)",
          description:
            "Organismo que administra y preserva las aguas nacionales.",
          link: "https://www.gob.mx/conagua",
        },
        {
          id: "profepa",
          name: "Procuraduría Federal de Protección al Ambiente (PROFEPA)",
          description:
            "Encargada de vigilar el cumplimiento de la normatividad ambiental.",
          link: "https://www.gob.mx/profepa",
        },
        {
          id: "conabio",
          name: "Comisión Nacional para el Conocimiento y Uso de la Biodiversidad (CONABIO)",
          description:
            "Institución que genera inteligencia sobre el capital natural de México y promueve la conservación basada en la participación local.",
          link: "https://www.gob.mx/conabio",
        },
        {
          id: "conafor",
          name: "Comisión Nacional Forestal (CONAFOR)",
          description:
            "Organismo público descentralizado que busca desarrollar, favorecer e impulsar las actividades productivas, de conservación y restauración en materia forestal.",
          link: "https://www.gob.mx/conafor",
        },
        {
          id: "conanp",
          name: "Comisión Nacional de Áreas Naturales Protegidas (CONANP)",
          description: "Administra las Áreas Naturales Protegidas de México.",
          link: "https://www.gob.mx/conanp",
        },
        {
          id: "inecc",
          name: "Instituto Nacional de Ecología y Cambio Climático (INECC)",
          description:
            "Genera e integra conocimiento técnico y científico para la formulación de políticas ambientales y de protección contra el cambio climático.",
          link: "https://www.gob.mx/inecc",
        },
        {
          id: "asea",
          name: "Agencia de Seguridad, Energía y Ambiente (ASEA)",
          description:
            "Órgano desconcentrado de SEMARNAT, regula y supervisa la seguridad industrial y protección ambiental en el sector hidrocarburos.",
          link: "https://www.gob.mx/asea",
        },
      ],
    },
    {
      id: "env-secretariats-mor",
      title: "Secretarías de Medio Ambiente (Morelos)",
      icon: Landmark,
      resources: [
        {
          id: "sds-morelos",
          name: "Secretaría de Desarrollo Sustentable del Gobierno del Estado de Morelos (SDS)",
          description:
            "Entidad encargada de coordinar y promover las políticas ambientales y de desarrollo sustentable en el estado de Morelos. Su misión es proteger el medio ambiente, promover el uso racional de los recursos naturales y fomentar el desarrollo sostenible.",
          link: "https://www.morelos.gob.mx/sustentable",
          contact: {
            alternativeLink: "http://sustentable.morelos.gob.mx/",
            phone: "(777) 3 17 56 00 ext. 105, (777) 3 12 63 23",
            email: "desarrollo.sustentable@morelos.gob.mx",
            subDirectorates: [
              { name: "Dirección de Ordenamiento Ambiental" },
              { name: "Dirección de Impacto Ambiental" },
              { name: "Dirección de Educación Ambiental" },
              {
                name: "Dirección de Calidad del Aire",
                contact: "Arturo Perez Bahena - arturo.perez@morelos.gob.mx",
              },
            ],
          },
        },
        {
          id: "congreso-morelos-env",
          name: "Comisión de Medio Ambiente, Recursos Naturales y Agua del Congreso del Estado de Morelos",
          description: "Comisión legislativa enfocada en temas ambientales.",
          link: "https://congresomorelos.gob.mx/", // Usuario debe buscar noticias/boletines
          contact: {
            relevantAddresses: [
              "Búsqueda en https://congresomorelos.gob.mx/ (el enlace directo a la comisión puede variar).",
            ],
          },
        },
        {
          id: "semarnat-delegacion-mor",
          name: "Delegación Federal de SEMARNAT en Morelos",
          description: "Representación de la SEMARNAT a nivel estatal.",
          // No hay enlace directo, se podría buscar o usar el general
          contact: {
            email:
              "atencion.ciudadana@semarnat.gob.mx (Puede ser un punto de partida para contactar la delegación).",
          },
        },
      ],
    },
    {
      id: "ngos-mexico",
      title: "ONGs y Grupos Civiles de Sostenibilidad (México)",
      icon: Users,
      resources: [
        {
          id: "cemda",
          name: "Centro Mexicano de Derecho Ambiental (CEMDA)",
          description:
            "Organización de abogados que investigan y documentan temas ambientales, buscando mejorar y aplicar correctamente las normas ambientales.",
          link: "https://www.cemda.org.mx/",
        },
        {
          id: "greenpeace-mx",
          name: "Greenpeace México",
          description:
            "Organización internacional con presencia en México, realiza acciones no violentas para denunciar amenazas al medio ambiente y presionar por soluciones.",
          link: "https://www.greenpeace.org/mexico/",
        },
        {
          id: "pronatura-mx",
          name: "Pronatura México, A.C.",
          description:
            "Organización con más de 30 años promoviendo cambios en legislaciones y acciones para proteger el medio ambiente y conservar la biodiversidad.",
          link: "https://pronatura.org.mx/",
        },
        {
          id: "reforestamos-mx",
          name: "Reforestamos México",
          description:
            "Plataforma que promueve el desarrollo de sistemas de gobernanza para la restauración y conectividad de los bosques.",
          link: "https://www.reforestamosmexico.org/",
        },
        {
          id: "naturalia-ac",
          name: "Naturalia, A.C. (Comité para la Conservación de Especies Silvestres)",
          description:
            "Enfocada en la conservación de especies como el lobo mexicano y el jaguar, además de promover la reforestación y el desarrollo sustentable.",
          link: "https://naturalia.org.mx/",
        },
        {
          id: "endesu",
          name: "Espacios Naturales y Desarrollo Sustentable (ENDESU)",
          description:
            "Centrada en restaurar ecosistemas dañados y tiene proyectos de desarrollo sustentable en comunidades.",
          link: "https://www.endesu.org.mx/",
        },
        // {
        //   id: "fee-mexico",
        //   name: "Fundación para la Educación Ambiental (FEE) México",
        //   description:
        //     "Busca generar agentes de cambio positivo a través de programas educativos y de turismo sostenible. Opera programas como Blue Flag, Eco-Schools, Green Key.",
        //   link: "http://www.feemexico.org/",
        // },
      ],
    },
  ],
  mediaSection: {
    id: "recommended-media",
    title: "Documentales, Libros y Sitios Web Recomendados",
    accordionItems: [
      {
        id: "documentaries",
        title: "Documentales",
        icon: Film,
        items: [
          {
            id: "before-the-flood",
            name: "Antes que sea tarde (Before the Flood, 2016)",
            description:
              "Protagonizado por Leonardo DiCaprio, explora los efectos del cambio climático y la necesidad de acción urgente.",
            whereToWatch:
              "National Geographic, plataformas de streaming (disponibilidad puede variar).",
          },
          {
            id: "our-planet",
            name: "Nuestro Planeta (Our Planet, 2019)",
            description:
              "Miniserie de Netflix que retrata la biodiversidad del planeta y el impacto del calentamiento global.",
            whereToWatch: "Netflix.",
          },
          {
            id: "chasing-coral",
            name: "En busca del coral (Chasing Coral, 2017)",
            description:
              "Documental sobre la alarmante situación de los arrecifes de coral debido al aumento de las temperaturas.",
            whereToWatch: "Netflix.",
          },
          {
            id: "cowspiracy",
            name: "Cowspiracy: El Secreto de la Sostenibilidad (2014)",
            description:
              "Explora el impacto de la ganadería en el medio ambiente.",
            whereToWatch: "Netflix y otras plataformas.",
          },
          {
            id: "the-true-cost",
            name: "The True Cost (2015)",
            description:
              "Investiga el impacto de la industria de la moda rápida en el medio ambiente y los derechos humanos.",
            whereToWatch: "Plataformas de streaming.",
          },
          {
            id: "plastic-planet",
            name: "Plastic Planet (2009)",
            description:
              "Muestra los intereses y peligros detrás del plástico omnipresente en nuestro día a día.",
            whereToWatch: "Filmin, otras plataformas de alquiler/compra.",
          },
          {
            id: "une-fois-que-tu-sais",
            name: "Una vez que sabes (Une fois que tu sais, 2020)",
            description:
              "Aborda las consecuencias irreversibles del cambio climático y llama a la acción colectiva.",
            whereToWatch: "Filmin.",
          },
          {
            id: "seeding-change",
            name: "Seeding Change (2021)",
            description:
              "Sigue a empresas que buscan soluciones a través de un nuevo modelo económico y empoderan a los consumidores.",
            sourceLink: "https://www.seedingchangefilm.com/",
          },
        ],
      },
      {
        id: "books",
        title: "Libros",
        icon: BookOpen,
        items: [
          {
            id: "silent-spring",
            name: "Primavera Silenciosa (Silent Spring) de Rachel Carson (1962)",
            description:
              "Considerado un precursor del ecologismo moderno, trata sobre el impacto ambiental de los pesticidas.",
          },
          {
            id: "an-inconvenient-truth",
            name: "Una Verdad Incómoda (An Inconvenient Truth) de Al Gore (2007)",
            description:
              "Reúne el material utilizado en su documental sobre el cambio climático.",
          },
          {
            id: "the-revenge-of-gaia",
            name: "La Venganza de la Tierra (The Revenge of Gaia) de James Lovelock (2007)",
            description:
              "Análisis del modelo de consumo actual y sus consecuencias, basado en la hipótesis Gaia.",
          },
          {
            id: "planeta-azul-verde",
            name: "Planeta Azul, Planeta Verde de Ramon Margalef",
            description:
              "Introduce conceptos básicos de la ecología, ideal para iniciarse en el tema.",
          },
          {
            id: "biomimicry",
            name: "Biomimética: Innovación Inspirada por la Naturaleza (Biomimicry: Innovation Inspired by Nature) de Janine Benyus",
            description:
              "Explora cómo la naturaleza puede inspirar soluciones sostenibles en diseño y tecnología.",
          },
          {
            id: "365-soluciones",
            name: "365 Soluciones para Reducir tu Huella de Carbono de Joanna Yarrow (2008)",
            description:
              "Manual con soluciones prácticas para reducir el consumo de energía, dividido por temáticas.",
          },
        ],
      },
      {
        id: "websites",
        title: "Sitios Web Recomendados",
        icon: Globe,
        items: [
          {
            id: "ecoosfera",
            name: "Ecoosfera",
            description:
              "Noticias y artículos sobre medio ambiente, sostenibilidad y ecología.",
            link: "https://ecoosfera.com/",
          },
          // { id: "natgeo-env", name: "National Geographic en Español (Medio Ambiente)", description: "Sección de medio ambiente con reportajes, noticias y fotografías.", link: "https://www.nationalgeographic.com.es/medio-ambiente" }, // Omitido por ser "sospechoso"
          {
            id: "unep",
            name: "ONU Medio Ambiente",
            description:
              "Programa de las Naciones Unidas para el Medio Ambiente, con información global y regional.",
            link: "https://www.unep.org/es",
          },
          {
            id: "wwf-mexico",
            name: "WWF (Fondo Mundial para la Naturaleza) México",
            description:
              "Información sobre conservación, especies y proyectos.",
            link: "https://www.wwf.org.mx/",
          },
          {
            id: "idealist",
            name: "Idealist (Español)",
            description:
              "Plataforma para encontrar oportunidades de voluntariado y acción en organizaciones, incluyendo ambientales.",
            link: "https://www.idealist.org/es/",
          },
          {
            id: "comunicarse",
            name: "ComunicarSe",
            description:
              "Portal de noticias y recursos sobre RSE y Sostenibilidad en Iberoamérica.",
            link: "https://www.comunicarseweb.com/",
          },
        ],
      },
    ],
  },
};
