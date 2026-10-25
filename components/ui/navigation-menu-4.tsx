import { BookOpenIcon, InfoIcon, LifeBuoyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
  { href: "#", label: "Home" },
  {
    label: "Features",
    submenu: true,
    type: "description",
    items: [
      {
        href: "#how-it-works",
        label: "Zero-Cloud Scrapers",
        description: "Scrape, resolve tokens, and unpack media 100% on-device.",
      },
      {
        href: "#simulator",
        label: "Multi-Stream Resolver",
        description: "Inspect raw stream manifests, bitrates, and clean audio.",
      },
      {
        href: "#architecture",
        label: "OTA Scraper Hot-Patching",
        description: "Background auto-updates for scrapers without full app reinstalls.",
      },
    ],
  },
  {
    label: "Platforms",
    submenu: true,
    type: "simple",
    items: [
      { href: "#downloads", label: "Android APK (v1.6.7)" },
      { href: "#downloads", label: "Windows Desktop (x64)" },
      { href: "#downloads", label: "Terminal CLI (@elskyx/skyc)" },
      { href: "#platforms", label: "16+ Supported Platforms" },
    ],
  },
  {
    label: "About",
    submenu: true,
    type: "icon",
    items: [
      { href: "#how-it-works", label: "Getting Started", icon: "BookOpenIcon" },
      { href: "#simulator", label: "Live Simulator", icon: "LifeBuoyIcon" },
      { href: "#creator", label: "About Creator", icon: "InfoIcon" },
    ],
  },
]

export default function NavigationMenu4() {
  return (
    <header className="border-b px-4 md:px-6 bg-background/90 backdrop-blur-md sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Mobile menu trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
                aria-label="Toggle Navigation"
              >
                <svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-transform duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-transform duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-transform duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index} className="w-full">
                      {link.submenu ? (
                        <>
                          <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium uppercase tracking-wider">
                            {link.label}
                          </div>
                          <ul>
                            {link.items.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <NavigationMenuLink
                                  href={item.href}
                                  className="py-1.5 px-2 block rounded text-sm hover:bg-accent"
                                >
                                  {item.label}
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <NavigationMenuLink href={link.href} className="py-1.5 px-2 block font-medium">
                          {link.label}
                        </NavigationMenuLink>
                      )}
                      {/* Add separator between different types of items */}
                      {index < navigationLinks.length - 1 &&
                        ((!link.submenu && navigationLinks[index + 1].submenu) ||
                          (link.submenu && !navigationLinks[index + 1].submenu) ||
                          (link.submenu &&
                            navigationLinks[index + 1].submenu &&
                            link.type !== navigationLinks[index + 1].type)) && (
                          <div
                            role="separator"
                            aria-orientation="horizontal"
                            className="bg-border -mx-1 my-1 h-px w-full"
                          />
                        )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>

          {/* Main nav */}
          <div className="flex items-center gap-6">
            <a href="/" aria-label="Skyc Homepage" className="flex items-center gap-2 text-primary font-bold tracking-tight text-lg hover:opacity-90 transition-opacity">
              <img src="/logo.svg" alt="Skyc Logo" className="w-7 h-7" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <span>Skyc</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full font-mono font-medium text-muted-foreground">v1.6.7</span>
            </a>

            {/* Navigation menu */}
            <div className="max-md:hidden">
              <NavigationMenu>
                <NavigationMenuList>
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index}>
                      {link.submenu ? (
                        <>
                          <NavigationMenuTrigger className="text-muted-foreground hover:text-primary bg-transparent px-3 py-1.5 font-medium text-sm">
                            {link.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className={cn(
                              "grid w-[400px] gap-2 p-3 md:w-[500px] md:grid-cols-2 lg:w-[580px]",
                              link.type === "description" && "md:grid-cols-1"
                            )}>
                              {link.items.map((item, itemIndex) => (
                                <li key={itemIndex}>
                                  <NavigationMenuLink asChild>
                                    <a
                                      href={item.href}
                                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-accent focus:text-accent-foreground"
                                    >
                                      {/* Display icon if present */}
                                      {link.type === "icon" && "icon" in item && (
                                        <div className="flex items-center gap-2">
                                          {item.icon === "BookOpenIcon" && (
                                            <BookOpenIcon
                                              size={16}
                                              className="text-foreground opacity-70"
                                              aria-hidden="true"
                                            />
                                          )}
                                          {item.icon === "LifeBuoyIcon" && (
                                            <LifeBuoyIcon
                                              size={16}
                                              className="text-foreground opacity-70"
                                              aria-hidden="true"
                                            />
                                          )}
                                          {item.icon === "InfoIcon" && (
                                            <InfoIcon
                                              size={16}
                                              className="text-foreground opacity-70"
                                              aria-hidden="true"
                                            />
                                          )}
                                          <div className="text-sm font-medium leading-none">
                                            {item.label}
                                          </div>
                                        </div>
                                      )}

                                      {/* Display label with description if present */}
                                      {link.type === "description" && "description" in item && (
                                        <>
                                          <div className="text-sm font-semibold leading-none text-foreground mb-1">
                                            {item.label}
                                          </div>
                                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                            {item.description}
                                          </p>
                                        </>
                                      )}

                                      {/* Display simple label if simple type */}
                                      {link.type === "simple" && (
                                        <div className="text-sm font-medium leading-none">
                                          {item.label}
                                        </div>
                                      )}
                                    </a>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <NavigationMenuLink asChild>
                          <a
                            href={link.href}
                            className="text-muted-foreground hover:text-primary py-1.5 px-3 font-medium text-sm transition-colors"
                          >
                            {link.label}
                          </a>
                        </NavigationMenuLink>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
                <NavigationMenuViewport />
              </NavigationMenu>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-sm">
            <a href="https://github.com/elskyx/Skyc-Downloader" target="_blank" rel="noopener">GitHub</a>
          </Button>
          <Button asChild size="sm" className="text-sm bg-primary text-primary-foreground">
            <a href="#downloads">Get Skyc</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
