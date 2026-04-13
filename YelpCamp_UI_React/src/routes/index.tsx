import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-4 text-5xl font-bold text-gray-900">Welcome to YelpCamp!</h1>
      <p className="mb-8 text-xl text-gray-600">
        Discover amazing campgrounds shared by our community
      </p>
      <Button asChild size="lg" className="text-lg px-8 py-6">
        <Link to="/campgrounds">View All Campgrounds</Link>
      </Button>
    </div>
  )
}
