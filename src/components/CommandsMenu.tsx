import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import type { Command } from "@/lib/commandHandler";
import { getCommandDescription } from "@/lib/commandHandler";
import { Zap, ChevronDown } from "lucide-react";

const commands: { key: Command; label: string; icon: string; color: string }[] =
  [
    { key: "start", label: "Старт", icon: "🚀", color: "text-blue-500" },
    { key: "profile", label: "Профиль", icon: "👤", color: "text-purple-500" },
    {
      key: "update",
      label: "Добавить запись",
      icon: "➕",
      color: "text-green-500",
    },
    { key: "today", label: "Сегодня", icon: "📅", color: "text-amber-500" },
    { key: "stats", label: "Статистика", icon: "📊", color: "text-orange-500" },
    { key: "goal", label: "Цели", icon: "🎯", color: "text-red-500" },
    { key: "activity", label: "История", icon: "🗂️", color: "text-slate-500" },
    { key: "export", label: "Экспорт", icon: "⬇️", color: "text-emerald-500" },
    { key: "help", label: "Помощь", icon: "❓", color: "text-cyan-500" },
    { key: "reset", label: "Сброс", icon: "🔄", color: "text-gray-500" },
  ];

export function CommandsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { sendMessage } = useChat();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCommand = (command: Command) => {
    sendMessage(`/${command}`);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5 h-10 text-xs px-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm border-border/50 hover:border-primary/50"
      >
        <Zap className="h-3.5 w-3.5" />
        <span>Команды</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 z-[9999] w-80 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl p-2 max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-1 flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Быстрые команды
            </div>
            <div className="space-y-0.5">
              {commands.map((cmd, index) => (
                <button
                  key={cmd.key}
                  onClick={() => handleCommand(cmd.key)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-accent/80 hover:text-accent-foreground transition-all duration-150 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] group animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-150">
                    {cmd.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-foreground">
                      {cmd.label}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {getCommandDescription(cmd.key)}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
