import { MessageCircle, Plus } from "lucide-react";
import { initials } from "../lib/messages";
import type { Guild } from "../types";

interface Props {
  guilds: Guild[];
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function GuildRail({ guilds, activeId, onSelect, onCreate }: Props) {
  return (
    <nav
      aria-label="Guild của bạn"
      className="flex w-14 shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-line bg-surface-muted/50 py-5 sm:w-[72px]"
    >
      <MessageCircle className="mb-2 h-5 w-5 text-accent" aria-hidden />
      {guilds.map((guild) => (
        <button
          key={guild.id}
          title={guild.name}
          aria-label={`Mở guild ${guild.name}`}
          aria-pressed={guild.id === activeId}
          onClick={() => onSelect(guild.id)}
          className={`cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold transition sm:h-11 sm:w-11 ${guild.id === activeId ? "border-action bg-action text-action-foreground" : "border-line bg-surface text-muted hover:border-accent hover:text-foreground"}`}
        >
          {initials(guild.name)}
        </button>
      ))}
      <button
        onClick={onCreate}
        aria-label="Tạo guild"
        title="Tạo guild"
        className="cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-dashed border-line text-muted transition hover:border-accent hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
      </button>
      <span className="mt-auto hidden pt-6 text-[9px] tracking-[0.25em] text-subtle [writing-mode:vertical-rl] sm:block">
        ATELIER / SPACES
      </span>
    </nav>
  );
}
