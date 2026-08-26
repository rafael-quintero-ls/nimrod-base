import dashboard from './dashboard'
import modules from './modules'
import type { VerticalNavItems } from '@layouts/types'

export default [...dashboard, ...modules] as VerticalNavItems
