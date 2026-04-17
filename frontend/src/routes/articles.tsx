import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/articles')({
  beforeLoad: () => {
    throw redirect({ to: '/content', search: { tab: 'article', wordPage: 1 } })
  },
  component: () => null,
})
