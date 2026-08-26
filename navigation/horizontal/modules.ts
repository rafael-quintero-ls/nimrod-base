export default [
  {
    title: 'Roadmap',
    icon: { icon: 'tabler-map' },
    children: [
      {
        title: 'Agents',
        to: 'agents',
        icon: { icon: 'tabler-robot' },
        action: 'read',
        subject: 'Agent',
      },
      {
        title: 'Workflows',
        to: 'workflows',
        icon: { icon: 'tabler-git-branch' },
        action: 'read',
        subject: 'Workflow',
      },
      {
        title: 'Tools',
        to: 'tools',
        icon: { icon: 'tabler-tool' },
        action: 'read',
        subject: 'Tool',
      },
      {
        title: 'Model Providers',
        to: 'model-providers',
        icon: { icon: 'tabler-brain' },
        action: 'read',
        subject: 'ModelProvider',
      },
      {
        title: 'Context & Memory',
        to: 'memory',
        icon: { icon: 'tabler-database' },
        action: 'read',
        subject: 'Memory',
      },
      {
        title: 'Observability',
        to: 'observability',
        icon: { icon: 'tabler-activity' },
        action: 'read',
        subject: 'Observability',
      },
    ],
  },
]
