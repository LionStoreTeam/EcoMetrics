import { Inter, Playpen_Sans, Poppins } from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });

export const playpen = Playpen_Sans({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});
