import { Hero } from "@/components/sections/Hero";
import { CreatorsSection } from "@/components/sections/CreatorsSection";
import { TechPillarsSection } from "@/components/sections/TechPillarsSection";
import { RoadmapSection } from "@/components/sections/RoadmapSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <CreatorsSection />
      <TechPillarsSection />
      <RoadmapSection />
    </main>
  );
}
