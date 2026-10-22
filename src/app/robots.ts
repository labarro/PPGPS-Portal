import type { MetadataRoute } from 'next'

import { buildRobots } from '@/lib/content/robots'
import { resolveAppEnv } from '@/lib/env/app-env'
import { resolveServerUrl } from '@/lib/env/server-url'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  return buildRobots(resolveAppEnv(process.env.APP_ENV), resolveServerUrl())
}
