import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { CampgroundSummary } from '@/types'

export function CampgroundCard({ campground }: { campground: CampgroundSummary }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <img
        src={campground.image}
        alt={campground.name}
        className="h-48 w-full object-cover"
        loading="lazy"
      />
      <CardContent className="p-4">
        <h3 className="mb-1 text-lg font-semibold">{campground.name}</h3>
        {campground.location && (
          <p className="mb-2 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3 w-3" />
            {campground.location}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium text-primary">${campground.price}/night</span>
          <Button variant="outline" size="sm" asChild>
            <Link to="/campgrounds/$id" params={{ id: String(campground.id) }}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
