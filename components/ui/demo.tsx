"use client"

import NavigationMenu4 from "@/components/ui/navigation-menu-4"
import SculptureHero from "@/components/ui/liquid-sculpture-hero"
import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer"

export default function Demo() {
  return (
    <div className="w-full flex flex-col min-h-screen bg-background text-foreground">
      <NavigationMenu4 />
      <SculptureHero
        brand="Zennx®"
        eyebrow="Zero-Cloud Media Engine — v1.8.67"
        headline={"Save anything,\nfrom anywhere."}
        headlineAccent="from anywhere."
        body="Universal, zero-cloud media downloader for Android, Windows Desktop & CLI. 16+ platforms, pristine multi-stream extraction, zero tracking."
        primaryCta={{ label: "Download Zennx", href: "#downloads" }}
        secondaryCta={{ label: "Try Simulator", href: "#simulator" }}
        hint="Move across the mascot"
        hintTouch="Touch the mascot"
        src="./favicon.png"
        darkSrc="./favicon.png"
      />
      <div className="w-full mt-auto">
        <HalftoneWordmarkFooter wordmark="zennx" />
      </div>
    </div>
  )
}
