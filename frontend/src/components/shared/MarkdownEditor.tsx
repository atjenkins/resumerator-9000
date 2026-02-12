import {
  Textarea,
  Button,
  Group,
  Stack,
  SegmentedControl,
  ActionIcon,
  Box,
  Divider,
  TypographyStylesProvider,
  useMantineTheme,
} from "@mantine/core";
import { useState, useRef } from "react";
import { marked } from "marked";
import {
  IconBold,
  IconItalic,
  IconList,
  IconListNumbers,
  IconH1,
  IconH2,
  IconH3,
  IconLine,
  IconLink,
  IconCode,
} from "@tabler/icons-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
  placeholder?: string;
  minRows?: number;
  defaultView?: "edit" | "preview" | "split";
  height?: number | string;
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  saving = false,
  placeholder = "Enter markdown content...",
  defaultView = "edit",
  height = 500,
}: MarkdownEditorProps) {
  const theme = useMantineTheme();
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState(defaultView);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  // Insert text at cursor position or wrap selection
  const insertText = (before: string, after: string = "", placeholder: string = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newValue =
      value.substring(0, start) +
      before +
      textToInsert +
      after +
      value.substring(end);

    handleChange(newValue);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Insert at line start
  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;

    const newValue =
      value.substring(0, lineStart) +
      prefix +
      value.substring(lineStart);

    handleChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  type ToolbarButton = 
    | { type: "button"; icon: React.ComponentType<any>; label: string; onClick: () => void }
    | { type: "divider" };

  const toolbarButtons: ToolbarButton[] = [
    {
      type: "button",
      icon: IconH1,
      label: "H1",
      onClick: () => insertAtLineStart("# "),
    },
    {
      type: "button",
      icon: IconH2,
      label: "H2",
      onClick: () => insertAtLineStart("## "),
    },
    {
      type: "button",
      icon: IconH3,
      label: "H3",
      onClick: () => insertAtLineStart("### "),
    },
    { type: "divider" },
    {
      type: "button",
      icon: IconBold,
      label: "Bold",
      onClick: () => insertText("**", "**"),
    },
    {
      type: "button",
      icon: IconItalic,
      label: "Italic",
      onClick: () => insertText("*", "*"),
    },
    { type: "divider" },
    {
      type: "button",
      icon: IconList,
      label: "Bullet List",
      onClick: () => insertAtLineStart("- "),
    },
    {
      type: "button",
      icon: IconListNumbers,
      label: "Numbered List",
      onClick: () => insertAtLineStart("1. "),
    },
    { type: "divider" },
    {
      type: "button",
      icon: IconLine,
      label: "Horizontal Rule",
      onClick: () => insertText("\n---\n"),
    },
    {
      type: "button",
      icon: IconLink,
      label: "Link",
      onClick: () => insertText("[", "](url)", "link text"),
    },
    {
      type: "button",
      icon: IconCode,
      label: "Code Block",
      onClick: () => insertText("\n```\n", "\n```\n", "code"),
    },
  ];

  // Render markdown to HTML
  const renderPreview = () => {
    try {
      const html = marked.parse(value) as string;
      return <TypographyStylesProvider><div dangerouslySetInnerHTML={{ __html: html }} /></TypographyStylesProvider>;
    } catch (error) {
      return <div style={{ color: "red" }}>Error rendering markdown</div>;
    }
  };

  return (
    <Stack gap="md">
      {/* View Mode Toggle */}
      <Group justify="space-between">
        <SegmentedControl
          value={viewMode}
          onChange={(value) => setViewMode(value as typeof viewMode)}
          data={[
            { label: "Edit", value: "edit" },
            { label: "Preview", value: "preview" },
            { label: "Split", value: "split" },
          ]}
        />
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges || saving}
        >
          Save Changes
        </Button>
      </Group>

      {/* Toolbar (show only in edit or split mode) */}
      {(viewMode === "edit" || viewMode === "split") && (
        <Group gap="xs">
          {toolbarButtons.map((button, index) => {
            if (button.type === "divider") {
              return <Divider key={`divider-${index}`} orientation="vertical" />;
            }
            const IconComponent = button.icon;
            return (
              <ActionIcon
                key={index}
                variant="light"
                size="lg"
                onClick={button.onClick}
                title={button.label}
              >
                <IconComponent size={18} />
              </ActionIcon>
            );
          })}
        </Group>
      )}

      {/* Editor/Preview Area */}
      <Box style={{ display: "flex", gap: "1rem", height }}>
        {/* Edit Mode */}
        {(viewMode === "edit" || viewMode === "split") && (
          <Box
            style={{
              flex: 1,
              border: `1px solid ${theme.colors.gray[3]}`,
              borderRadius: "4px",
              display: "flex",
            }}
          >
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              styles={{
                input: {
                  fontFamily: "monospace",
                  fontSize: "14px",
                  border: "none",
                  height: "100%",
                },
                root: { height: "100%", flex: 1 },
                wrapper: { height: "100%" },
              }}
            />
          </Box>
        )}

        {/* Preview Mode */}
        {(viewMode === "preview" || viewMode === "split") && (
          <Box
            style={{
              flex: 1,
              overflow: "auto",
              border: `1px solid ${theme.colors.gray[3]}`,
              borderRadius: "4px",
              padding: "1rem",
              backgroundColor: theme.white,
            }}
          >
            {value ? renderPreview() : <div style={{ color: theme.colors.gray[6] }}>Preview will appear here...</div>}
          </Box>
        )}
      </Box>
    </Stack>
  );
}
