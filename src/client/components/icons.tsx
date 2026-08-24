import type { ReactNode } from 'react'

/** Sun glyph, migrated from @deepseek-ai/dsh-client-ui-primitives IconLightOutline16. */
export const SUN_PATHS = '<path d="M11.3496 8C11.3496 6.14985 9.85015 4.65039 8 4.65039C6.14985 4.65039 4.65039 6.14985 4.65039 8C4.65039 9.85015 6.14985 11.3496 8 11.3496C9.85015 11.3496 11.3496 9.85015 11.3496 8ZM12.6504 8C12.6504 10.5681 10.5681 12.6504 8 12.6504C5.43188 12.6504 3.34961 10.5681 3.34961 8C3.34961 5.43188 5.43188 3.34961 8 3.34961C10.5681 3.34961 12.6504 5.43188 12.6504 8Z" fill="currentColor"/><path d="M8.65039 0.5V2.5H7.34961V0.5H8.65039Z" fill="currentColor"/><path d="M8.65039 13.5V15.5H7.34961V13.5H8.65039Z" fill="currentColor"/><path d="M3.15808 2.24035L4.57229 3.65456L3.6525 4.57435L2.23829 3.16014L3.15808 2.24035Z" fill="currentColor"/><path d="M12.3505 11.4327L13.7647 12.8469L12.8449 13.7667L11.4307 12.3525L12.3505 11.4327Z" fill="currentColor"/><path d="M2.24537 12.8469L3.65958 11.4327L4.57937 12.3525L3.16516 13.7667L2.24537 12.8469Z" fill="currentColor"/><path d="M11.4377 3.65455L12.852 2.24033L13.7718 3.16012L12.3575 4.57434L11.4377 3.65455Z" fill="currentColor"/><path d="M0.5 7.35461H2.5V8.6554H0.5L0.5 7.35461Z" fill="currentColor"/><path d="M13.5 7.35461H15.5V8.6554H13.5V8.6554Z" fill="currentColor"/>'

export function SunIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" dangerouslySetInnerHTML={{ __html: SUN_PATHS }} />
  )
}

function Glyph({ children, size = 16, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const DropletIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M8 1.9c2.4 2.8 4.3 5 4.3 7.1a4.3 4.3 0 1 1-8.6 0C3.7 6.9 5.6 4.7 8 1.9z" /></Glyph>
)

export const LayersIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M8 2.2 13.2 5 8 7.8 2.8 5 8 2.2z" /><path d="M2.8 8.2 8 11l5.2-2.8" /><path d="M2.8 11.2 8 14l5.2-2.8" /></Glyph>
)

export const PhotoIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><rect x="2" y="3.2" width="12" height="9.6" rx="2" /><circle cx="5.7" cy="6.3" r="0.9" /><path d="M14 10.4l-2.8-2.8-4.8 4.8" /></Glyph>
)

export const VideoIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><rect x="1.5" y="4.2" width="8.8" height="7.6" rx="2" /><path d="M10.3 6.9l4.2-2.4v7l-4.2-2.4" /></Glyph>
)

export const TextIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M3 4.2h10M3 8h10M3 11.8h6.5" /></Glyph>
)

export const TrajectoryIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M2.5 3.2h11M2.5 6.6h11M2.5 10h11" /><circle cx="4.4" cy="3.2" r="1.1" /><circle cx="8" cy="6.6" r="1.1" /><circle cx="11.4" cy="10" r="1.1" /></Glyph>
)

export const SlidersIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M2.5 4.5h4.9M11.6 4.5h1.9M2.5 11.5h1.9M8.6 11.5h4.9" /><circle cx="9.5" cy="4.5" r="1.7" /><circle cx="5.5" cy="11.5" r="1.7" /></Glyph>
)

export const SparkleIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M7.2 1.8l1.2 3.1 3.1 1.2-3.1 1.2-1.2 3.1-1.2-3.1L2.9 6.1 6 4.9l1.2-3.1z" /><path d="M12 10.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2z" /></Glyph>
)

export const RefreshIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M13.2 8A5.2 5.2 0 1 1 11.5 4.2" /><path d="M13.4 1.8v2.9h-2.9" /></Glyph>
)

export const DownloadIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M8 2.2v8" /><path d="M4.6 7l3.4 3.4L11.4 7" /><path d="M2.8 13.8h10.4" /></Glyph>
)

export const UploadIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M8 10.4V2.6" /><path d="M4.6 5.8L8 2.4l3.4 3.4" /><path d="M2.8 13.8h10.4" /></Glyph>
)

export const LockIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><rect x="3.6" y="7.2" width="8.8" height="6" rx="1.4" /><path d="M5.6 7.2V5.4a2.4 2.4 0 0 1 4.8 0v1.8" /></Glyph>
)

export const TrashIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M2.8 4.4h10.4" /><path d="M6.4 4.4V2.9h3.2v1.5" /><path d="M4.4 4.4l.5 8.6h6.2l.5-8.6" /></Glyph>
)

export const EditIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M9.5 4l2.5 2.5" /><path d="M3 13l.8-3L10 3.8 12.2 6 6 12.2 3 13z" /></Glyph>
)

export const PipetteIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><circle cx="8" cy="8" r="4.2" /><path d="M8 1.6v2.6M8 11.8v2.6M1.6 8h2.6M11.8 8h2.6" /></Glyph>
)

export const CheckIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M3.2 8.6l3 3L12.8 5" /></Glyph>
)

export const AlertIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M8 2.6l5.4 9.8H2.6L8 2.6z" /><path d="M8 6.8v2.4M8 11.4v.01" /></Glyph>
)

export const CanvasIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" /></Glyph>
)

export const SidebarIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" /><path d="M6.6 2.2v11.6" /></Glyph>
)

export const ChatIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><path d="M13.4 4.4v4.4a2 2 0 0 1-2 2H6.2l-3.6 3V4.4a2 2 0 0 1 2-2h6.8a2 2 0 0 1 2 2z" /></Glyph>
)

export const GearIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><circle cx="8" cy="8" r="2.1" /><path d="M8 1.7v1.8M8 12.5v1.8M1.7 8h1.8M12.5 8h1.8M3.6 3.6l1.3 1.3M11.1 11.1l1.3 1.3M12.4 3.6l-1.3 1.3M4.9 11.1l-1.3 1.3" /></Glyph>
)

export const InputIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Glyph size={size} className={className}><rect x="2.2" y="4" width="11.6" height="8" rx="2" /><path d="M8 6.6v2M7 8h2" /></Glyph>
)

