export default [
  {
    title: 'Dashboard',
    icon: { icon: 'tabler-smart-home' },
    to: 'dashboards-analytics',
    action: 'read',
    subject: 'Dashboard',
  },
  {
    title: 'Users',
    icon: { icon: 'tabler-user' },
    to: 'apps-user-list',
    action: 'read',
    subject: 'User',
  },
  {
    title: 'Roles & Permissions',
    icon: { icon: 'tabler-lock' },
    children: [
      { title: 'Roles', to: 'apps-roles', action: 'read', subject: 'Role' },
      { title: 'Permissions', to: 'apps-permissions', action: 'read', subject: 'Role' },
    ],
  },
]
