import React, { useEffect, useState } from "react";

interface TypewriterCreditProps {
  text: string;
  typingSpeedMs?: number;
  pauseMs?: number;
}

export const TypewriterCredit: React.FC<TypewriterCreditProps> = ({
  text,
  typingSpeedMs = 60,
  pauseMs = 2000,
}) => {
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < text.length) {
      // Typing forward
      timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, typingSpeedMs);
    } else if (!isDeleting && displayed.length === text.length) {
      // Pause at full text before deleting
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && displayed.length > 0) {
      // Deleting backward
      timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length - 1));
      }, typingSpeedMs / 2);
    } else if (isDeleting && displayed.length === 0) {
      // Restart the loop
      timeout = setTimeout(() => setIsDeleting(false), 500);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, text, typingSpeedMs, pauseMs]);

  return (
    <div className="w-full flex justify-center py-3">
      <p className="text-sm sm:text-base font-mono text-cyan-300 tracking-wide">
        {displayed}
        <span className="inline-block w-[2px] h-[1em] bg-cyan-400 ml-1 align-middle animate-pulse" />
      </p>
    </div>
  );
};