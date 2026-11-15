import { PackArt as ThemePackArt } from '../themes/PackArt'
import { useTheme } from '../themes/ThemeContext'

interface PackArtProps {
  onClick: () => void
}

export function PackArt({ onClick }: PackArtProps) {
  const { theme } = useTheme()
  return <ThemePackArt theme={theme} onClick={onClick} />
}
