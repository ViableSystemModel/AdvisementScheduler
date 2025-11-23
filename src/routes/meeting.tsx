import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/meeting')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="max-w-md mx-auto text-center mb-8">
      <p className="text-gray-600">A meeting ID was not provided.</p>
      <p className="text-gray-600">Please email your advisor for a meeting scheduler link.</p>
    </div>
  )
}
