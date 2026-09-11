"use client";

import * as React from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DriftWall from "@/components/DriftWall";
import {
  ParallaxCarousel,
  type CarouselImageItem,
} from "@/components/ui/parallax-carousel";
import { TextScatter } from "@/components/ui/text-scatter";

const carouselImages: CarouselImageItem[] = [
  {
    url: "https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=900&q=80&auto=format&fit=crop",
    title: "Minimalist Studio Form",
    tag: "Studio",
    size: "3.2 MB",
    author: "Studio Alpha",
  },
  {
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80&auto=format&fit=crop",
    title: "High-Frequency Circuitry",
    tag: "Tech",
    size: "4.8 MB",
    author: "Hardware Lab",
  },
  {
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80&auto=format&fit=crop",
    title: "Nordic Mist Valley",
    tag: "Landscape",
    size: "5.1 MB",
    author: "Field Expedition",
  },
  {
    url: "https://images.unsplash.com/photo-1490604001847-b712b0c2f967?w=900&q=80&auto=format&fit=crop",
    title: "Alpine Ridge Twilight",
    tag: "Editorial",
    size: "2.9 MB",
    author: "Summit Bureau",
  },
  {
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80&auto=format&fit=crop",
    title: "Glacial Iceform Monolith",
    tag: "Nature",
    size: "6.4 MB",
    author: "Arctic Reserve",
  },
  {
    url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900&q=80&auto=format&fit=crop",
    title: "Reflective Basin Vista",
    tag: "Branding",
    size: "3.7 MB",
    author: "Horizon Media",
  },
  {
    url: "https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=900&q=80&auto=format&fit=crop",
    title: "Monochrome Curve",
    tag: "Arch",
    size: "4.2 MB",
    author: "Atelier Forma",
  },
  {
    url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=900&q=80&auto=format&fit=crop",
    title: "Constellation Drift",
    tag: "Space",
    size: "7.1 MB",
    author: "Deep Sky Co.",
  },
  {
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80&auto=format&fit=crop",
    title: "Corporate Glass Monolith",
    tag: "Urban",
    size: "3.5 MB",
    author: "Metropolis",
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80&auto=format&fit=crop",
    title: "Azure Coastal Shore",
    tag: "Ocean",
    size: "4.4 MB",
    author: "Coastline",
  },
  {
    url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&q=80&auto=format&fit=crop",
    title: "Lens Spectrum Flare",
    tag: "Photo",
    size: "5.8 MB",
    author: "Prism Lab",
  },
  {
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&q=80&auto=format&fit=crop",
    title: "Studio Product Editorial",
    tag: "Product",
    size: "3.9 MB",
    author: "Aesthetic Core",
  },
];

const items = [
  { image: "https://picsum.photos/id/10/600/400", title: "Forest Vista" },
  { image: "https://picsum.photos/id/11/600/400", title: "Mountain Stream" },
  { image: "https://picsum.photos/id/12/600/400", title: "Beach Horizon" },
  { image: "https://picsum.photos/id/13/600/400", title: "Coastal Path" },
  { image: "https://picsum.photos/id/14/600/400", title: "Ocean Cliff" },
  { image: "https://picsum.photos/id/15/600/400", title: "Pine Grove" },
  { image: "https://picsum.photos/id/16/600/400", title: "Lakeside" },
  { image: "https://picsum.photos/id/17/600/400", title: "Trail Woods" },
  { image: "https://picsum.photos/id/18/600/400", title: "Meadow Grass" },
  { image: "https://picsum.photos/id/19/600/400", title: "River Crossing" },
  { image: "https://picsum.photos/id/20/600/400", title: "Nordic Cabin" },
  { image: "https://picsum.photos/id/25/600/400", title: "Morning Light" },
  { image: "https://picsum.photos/id/28/600/400", title: "Timber Trees" },
  { image: "https://picsum.photos/id/29/600/400", title: "Mountain Ridge" },
  { image: "https://picsum.photos/id/36/600/400", title: "Highland Peak" },
  { image: "https://picsum.photos/id/42/600/400", title: "Espresso Brew" },
  { image: "https://picsum.photos/id/48/600/400", title: "Sunset Coast" },
  { image: "https://picsum.photos/id/54/600/400", title: "Urban Skyline" },
  { image: "https://picsum.photos/id/60/600/400", title: "Desk Workspace" },
  { image: "https://picsum.photos/id/106/600/400", title: "Flower Petals" },
  { image: "https://picsum.photos/id/110/600/400", title: "Forest Pathway" },
  { image: "https://picsum.photos/id/119/600/400", title: "Macbook Studio" },
  {
    image: "https://picsum.photos/id/133/600/400",
    title: "Vintage Automobile",
  },
  { image: "https://picsum.photos/id/164/600/400", title: "Boat Pier" },
  { image: "https://picsum.photos/id/175/600/400", title: "Desert Dunes" },
  { image: "https://picsum.photos/id/180/600/400", title: "Workspace Laptop" },
  { image: "https://picsum.photos/id/192/600/400", title: "Valley Vista" },
  { image: "https://picsum.photos/id/200/600/400", title: "Cow in Pasture" },
  { image: "https://picsum.photos/id/211/600/400", title: "Ship Rigging" },
  { image: "https://picsum.photos/id/219/600/400", title: "Red Brick Facade" },
  { image: "https://picsum.photos/id/237/600/400", title: "Black Puppy" },
  { image: "https://picsum.photos/id/244/600/400", title: "Pelican on Water" },
  { image: "https://picsum.photos/id/250/600/400", title: "Camera Lens" },
  { image: "https://picsum.photos/id/1015/600/400", title: "Mountain Peaks" },
  { image: "https://picsum.photos/id/1025/600/400", title: "Wild Pup" },
  { image: "https://picsum.photos/id/1039/600/400", title: "Cascading Falls" },
  { image: "https://picsum.photos/id/1043/600/400", title: "Coastal Waves" },
  { image: "https://picsum.photos/id/1050/600/400", title: "Lush Forest" },
  { image: "https://picsum.photos/id/1062/600/400", title: "Foggy Ridge" },
  { image: "https://picsum.photos/id/1069/600/400", title: "Alpine Lake" },
  { image: "https://picsum.photos/id/1074/600/400", title: "Pine Canopy" },
  {
    image: "https://picsum.photos/id/1080/600/400",
    title: "Strawberry Blossom",
  },
  { image: "https://picsum.photos/id/1084/600/400", title: "Walrus on Rocks" },
];

export function HeroSection() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Responsive configuration for DriftWall
  const [columns, setColumns] = React.useState(5);
  const [tileWidth, setTileWidth] = React.useState(200);
  const [tileHeight, setTileHeight] = React.useState(132);
  const [gap, setGap] = React.useState(18);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(3);
        setTileWidth(120);
        setTileHeight(80);
        setGap(10);
      } else if (width < 1024) {
        setColumns(4);
        setTileWidth(160);
        setTileHeight(106);
        setGap(14);
      } else {
        setColumns(5);
        setTileWidth(200);
        setTileHeight(132);
        setGap(18);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", {
        opacity: 0,
        y: -15,
        duration: 0.6,
      })
        .from(
          ".hero-title",
          {
            opacity: 0,
            y: 25,
            duration: 0.8,
          },
          "-=0.3",
        )
        .from(
          ".hero-desc",
          {
            opacity: 0,
            y: 20,
            duration: 0.7,
          },
          "-=0.5",
        )
        .from(
          ".hero-cta",
          {
            opacity: 0,
            scale: 0.95,
            duration: 0.5,
          },
          "-=0.4",
        )
        .from(
          ".hero-carousel",
          {
            opacity: 0,
            y: 40,
            duration: 1,
          },
          "-=0.3",
        );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="w-full">
      {/* Hero Section with Full-Width DriftWall Background */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-40 text-center flex flex-col justify-center items-center min-h-[590px] md:min-h-[670px]">
        {/* Layer 1: DriftWall Full-Width Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <DriftWall
            items={items}
            columns={columns}
            tileWidth={tileWidth}
            tileHeight={tileHeight}
            gap={gap}
            tilt={16}
            turn={-14}
            perspective={1200}
            depth={120}
            speed={42}
            direction="up"
            variance={0.45}
            fade={0.2}
            dim={0.9}
            overlayOpacity={0.1}
            overlayColor="#060010"
            radius={14}
            roll={0}
            grayscale={false}
          />
        </div>

        {/* Layer 2: Soft Overlay for Text Readability without Obscuring Background */}
        <div
          className="hero-dark-overlay absolute inset-0 bg-white/20 dark:bg-[#060010]/45 backdrop-blur-[0.2px] pointer-events-none z-10"
          aria-hidden="true"
        />

        {/* Background Ambient Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/20 to-purple-600/15 dark:from-blue-500/20 dark:via-purple-600/20 dark:to-emerald-500/10 blur-[120px] z-10 pointer-events-none rounded-full" />

        {/* Layer 3: Center Hero Content */}
        <div className="hero-center-content relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Animated Badge */}
          {/* <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 px-4 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-8 backdrop-blur-md shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
            <span>ImageSpace Engine · 500 MB Storage · 2 Workspaces</span>
          </div> */}

          {/* Headline with Interactive Text Scatter */}
          <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.08] flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4">
            <TextScatter
              text="Organize."
              velocity={50}
              rotation={28}
              scale={1.16}
              duration={0.45}
              returnAfter={600}
            />
            <TextScatter
              text="Collaborate."
              velocity={50}
              rotation={28}
              scale={1.16}
              duration={0.45}
              returnAfter={600}
            />
          </h1>

          {/* Subtitle */}
          <p className="hero-desc mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Private workspaces, simple organization, seamless collaboration.
          </p>

          {/* Action CTAs */}
          <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto shadow-md hover:shadow-lg"
              >
                Start Free Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 backdrop-blur-md shadow-xs"
              >
                Sign In to Workspaces
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtle Bottom Transition Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
      </section>

      {/* Interactive Parallax Carousel Showcase */}
      <section className="hero-carousel relative py-14 sm:py-20 bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
          {/* <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Interactive Visual Showcase
          </h2> */}
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1.5">
            Explore your image workspace.
          </p>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-xl mx-auto">
            Browse, organize, and discover team images with smooth interactions. Inspect team assets with silky-smooth parallax depth.
          </p>
        </div>

        {/* Parallax Carousel Track */}
        <div className="w-full">
          <ParallaxCarousel
            images={carouselImages}
            imageWidth={250}
            imageHeight={330}
            gap={14}
            borderRadius={16}
            parallaxIntensity={0.0}
            uvScale={0.71}
            lerp={0.05}
            wheelSensitivity={0.8}
            dragSensitivity={0.8}
            loop={true}
            autoplaySpeed={155}
            pauseOnHover={true}
            showProgress={false}
          />
        </div>

        {/* <div className="text-center mt-6">
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400 bg-zinc-100/80 dark:bg-zinc-900/80 px-3.5 py-1.5 rounded-full border border-zinc-200/60 dark:border-zinc-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Drag or swipe horizontally · Autoplay pauses on hover
          </span>
        </div> */}
      </section>
    </div>
  );
}
