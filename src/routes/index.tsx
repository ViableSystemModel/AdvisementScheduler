import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="max-w-md mx-auto text-center mb-8">
      <p className="text-gray-600">If you are a student seeing this page, please email your advisor for a meeting scheduler link</p>
    </div>
  )
}