function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="17" cy="6" r="2.3" />
      <circle cx="17" cy="18" r="2.3" />
      <path d="M8.1 10.8L14.9 7.2M8.1 13.2L14.9 16.8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.31 3.13-6 7-6s7 2.69 7 6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <ellipse cx="12" cy="5.5" rx="7.3" ry="2.4" />
      <path d="M4.7 5.5v6c0 1.33 3.27 2.4 7.3 2.4s7.3-1.07 7.3-2.4v-6" />
      <path d="M4.7 11.5v6c0 1.33 3.27 2.4 7.3 2.4s7.3-1.07 7.3-2.4v-6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M9 15l6-6" strokeLinecap="round" />
      <path d="M7.5 16.5a3.5 3.5 0 010-4.95l2-2" strokeLinecap="round" />
      <path d="M16.5 7.5a3.5 3.5 0 010 4.95l-2 2" strokeLinecap="round" />
    </svg>
  );
}

const COMBOS = [
  { bg: "bg-info/15", text: "text-info", Icon: ShareIcon },
  { bg: "bg-[#8b5cf6]/15", text: "text-[#8b5cf6]", Icon: UserIcon },
  { bg: "bg-warning/15", text: "text-warning", Icon: MailIcon },
  { bg: "bg-success/15", text: "text-success", Icon: DatabaseIcon },
  { bg: "bg-[#ec4899]/15", text: "text-[#ec4899]", Icon: LinkIcon },
];

function paletteIndex(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % COMBOS.length;
}

interface WorkflowAvatarProps {
  workflowId: string;
  name: string;
}

export function WorkflowAvatar({ workflowId, name }: WorkflowAvatarProps) {
  const { bg, text, Icon } = COMBOS[paletteIndex(workflowId)];
  return (
    <span
      role="img"
      aria-label={name}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg} ${text}`}
    >
      <Icon />
    </span>
  );
}
