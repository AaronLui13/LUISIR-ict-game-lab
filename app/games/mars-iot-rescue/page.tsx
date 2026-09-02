import type { Metadata } from "next";
import { MarsMission } from "./MarsMission";
import "./game.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Mars IoT Rescue | Lui Sir’s ICT Game Lab",
  description: "A five-mission classroom game about sensors, networks, processing and actuators.",
  openGraph: {
    title: "Mars IoT Rescue",
    description: "Save a Mars base by building reliable IoT automation rules.",
    images: ["https://aaronlui13.github.io/LUISIR-ict-game-lab/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mars IoT Rescue",
    description: "Save a Mars base by building reliable IoT automation rules.",
    images: ["https://aaronlui13.github.io/LUISIR-ict-game-lab/og.png"],
  },
};

export default function MarsIoTRescuePage() {
  return <MarsMission />;
}
