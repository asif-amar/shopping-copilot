import { Moon, Sun, Monitor } from "lucide-react"

import { useTheme } from "./theme-provider"
import { useLanguage } from "@/hooks/useLanguage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { cn } from "../lib/utils"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const { isRTL, t } = useLanguage()

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun size={14} />
      case "dark":
        return <Moon size={14} />
      default:
        return <Monitor size={14} />
    }
  }

  const getThemeLabel = (themeOption: "light" | "dark" | "system") => {
    switch (themeOption) {
      case "light":
        return t("theme_light") || "Light"
      case "dark":
        return t("theme_dark") || "Dark"
      case "system":
        return t("theme_system") || "System"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg flex items-center justify-center transition-all duration-200 border border-border cursor-pointer">
          {getThemeIcon()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRTL ? "start" : "end"}
        side="bottom"
        className={cn(
          "w-32 bg-popover border border-border shadow-lg",
          isRTL ? "text-right" : "text-left"
        )}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "cursor-pointer flex items-center gap-2",
            theme === "light" ? "bg-accent" : "",
            isRTL ? "flex-row" : "flex-row"
          )}
        >
          {isRTL ? (
            <>
              <Sun size={16} />
              <span>{getThemeLabel("light")}</span>
              {theme === "light" && <span className="mr-auto">✓</span>}
            </>
          ) : (
            <>
              <Sun size={16} />
              <span>{getThemeLabel("light")}</span>
              {theme === "light" && <span className="ml-auto">✓</span>}
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "cursor-pointer flex items-center gap-2",
            theme === "dark" ? "bg-accent" : "",
            isRTL ? "flex-row" : "flex-row"
          )}
        >
          {isRTL ? (
            <>
              <Moon size={16} />
              <span>{getThemeLabel("dark")}</span>
              {theme === "dark" && <span className="mr-auto">✓</span>}
            </>
          ) : (
            <>
              <Moon size={16} />
              <span>{getThemeLabel("dark")}</span>
              {theme === "dark" && <span className="ml-auto">✓</span>}
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "cursor-pointer flex items-center gap-2",
            theme === "system" ? "bg-accent" : "",
            isRTL ? "flex-row" : "flex-row"
          )}
        >
          {isRTL ? (
            <>
              <Monitor size={16} />
              <span>{getThemeLabel("system")}</span>
              {theme === "system" && <span className="mr-auto">✓</span>}
            </>
          ) : (
            <>
              <Monitor size={16} />
              <span>{getThemeLabel("system")}</span>
              {theme === "system" && <span className="ml-auto">✓</span>}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}