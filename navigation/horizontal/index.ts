import dashboard from './dashboard'
import modules from './modules'
import type { HorizontalNavItems } from '@layouts/types'

export default [...dashboard, ...modules] as HorizontalNavItems
