import { Badge } from '../common'
import { riskLabel, riskBadgeVariant } from '../../services/scoringService'

export default function RiskBadge({ likelihood, className = '' }) {
  return (
    <Badge variant={riskBadgeVariant(likelihood)} className={className}>
      {riskLabel(likelihood)}
    </Badge>
  )
}