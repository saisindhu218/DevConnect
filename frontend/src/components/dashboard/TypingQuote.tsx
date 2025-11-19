import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

const quotes = [
  "Connecting developers like APIs",
  "Code together, grow together",
  "Where developers meet innovation",
  "Building networks, one connection at a time",
  "Collaborate. Create. Connect.",
];

const TypingQuote = () => {
  const [displayText, setDisplayText] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentQuote = quotes[quoteIndex];

    const handleTyping = () => {
      if (!isDeleting) {
        if (displayText.length < currentQuote.length) {
          setDisplayText(currentQuote.substring(0, displayText.length + 1));
          setTypingSpeed(100);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(currentQuote.substring(0, displayText.length - 1));
          setTypingSpeed(50);
        } else {
          setIsDeleting(false);
          setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, quoteIndex, typingSpeed]);

  return (
    <Card className="bg-gradient-to-r from-slate-900 to-slate-800 p-12 text-center border-none">
      <h2 className="text-3xl font-bold text-cyan-400 min-h-[40px] font-mono">
        {displayText}
        <span className="animate-pulse">|</span>
      </h2>
    </Card>
  );
};

export default TypingQuote;
