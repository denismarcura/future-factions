import { useEffect, useState } from "react";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Encerrada";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function CountdownTimer({ closesAt }: { closesAt: string }) {
  const [text, setText] = useState("Carregando...");

  useEffect(() => {
    const target = new Date(closesAt).getTime();
    const tick = () => {
      setText(formatCountdown(target - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  return <span>{text}</span>;
}
