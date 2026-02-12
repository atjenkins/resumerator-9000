import { useEffect, useState, useRef } from "react";
import { Progress, Text, Stack, Box } from "@mantine/core";
import { useThemeStore } from "../../theme/useThemeStore";
import { getTheme } from "../../theme/themes";

interface AIProgressBarProps {
  isRunning: boolean;
  operationType: "analyze" | "generate" | "enrich";
  onComplete?: () => void;
}

export function AIProgressBar({
  isRunning,
  operationType,
  onComplete,
}: AIProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const messageIndexRef = useRef(0);
  const elapsedSecondsRef = useRef(0);
  const shuffledMessagesRef = useRef<string[]>([]);

  const themeId = useThemeStore((s) => s.themeId);
  const appTheme = getTheme(themeId);
  const messages = appTheme.sillyMessages[operationType];

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (!isRunning) {
      if (progress > 0 && progress < 100) {
        // Operation completed, jump to 100%
        setProgress(100);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }
      return;
    }

    // Reset when starting
    setProgress(0);
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    messageIndexRef.current = 0;
    
    // Shuffle messages for random order
    shuffledMessagesRef.current = shuffleArray(messages);
    setCurrentMessage(shuffledMessagesRef.current[0]);

    // Progress curve:
    // 0-5s: 0-30%
    // 5-20s: 30-60%
    // 20-40s: 60-80%
    // 40-55s: 80-92%
    // 55+s: 92-95%

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (!isRunning) return prev;

        const elapsed = elapsedSecondsRef.current;

        if (elapsed < 5) {
          // 0-30% quickly
          return Math.min(30, prev + 6);
        } else if (elapsed < 20) {
          // 30-60% moderate
          return Math.min(60, prev + 2);
        } else if (elapsed < 40) {
          // 60-80% slower
          return Math.min(80, prev + 1);
        } else if (elapsed < 55) {
          // 80-92% crawl
          return Math.min(92, prev + 0.8);
        } else {
          // 92-95% very slow
          return Math.min(95, prev + 0.2);
        }
      });
    }, 1000);

    const elapsedInterval = setInterval(() => {
      elapsedSecondsRef.current += 1;
      setElapsedSeconds(elapsedSecondsRef.current);
    }, 1000);

    // Rotate messages every 3-4 seconds
    const messageInterval = setInterval(() => {
      messageIndexRef.current = (messageIndexRef.current + 1) % shuffledMessagesRef.current.length;
      setCurrentMessage(shuffledMessagesRef.current[messageIndexRef.current]);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(elapsedInterval);
      clearInterval(messageInterval);
    };
  }, [isRunning, messages, onComplete]);

  if (!isRunning && progress === 0) {
    return null;
  }

  return (
    <Box>
      <Stack gap="sm">
        <Progress
          value={progress}
          size="lg"
          animated={isRunning}
          color={progress === 100 ? "green" : "blue"}
        />
        <Text size="sm" c="dimmed" ta="center">
          {currentMessage}
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          {elapsedSeconds}s elapsed
        </Text>
      </Stack>
    </Box>
  );
}
