import { MessageSquareDashed } from "lucide-react";

interface TypingIndicatorProps {
  typingNames: string[];
}

export function TypingIndicator({ typingNames }: TypingIndicatorProps) {
  if (!typingNames || typingNames.length === 0) return null;

  let displayText = "";
  if (typingNames.length === 1) {
    displayText = `${typingNames[0]} đang nhập`;
  } else if (typingNames.length === 2) {
    displayText = `${typingNames[0]} và ${typingNames[1]} đang nhập`;
  } else {
    displayText = `${typingNames[0]}, ${typingNames[1]} và ${typingNames.length - 2} người khác đang nhập`;
  }

  return (
    <div className="flex h-6 items-center gap-2 px-2 text-xs text-subtle animate-in fade-in slide-in-from-bottom-2 duration-200">
      <MessageSquareDashed className="h-3.5 w-3.5 animate-pulse" />

      <div className="flex items-baseline">
        <span className="font-medium italic">{displayText}</span>

        <span className="ml-0.5 flex w-4 justify-between">
          <span className="animate-[bounce_1s_infinite_0ms]">.</span>
          <span className="animate-[bounce_1s_infinite_150ms]">.</span>
          <span className="animate-[bounce_1s_infinite_300ms]">.</span>
        </span>
      </div>
    </div>
  );
}
