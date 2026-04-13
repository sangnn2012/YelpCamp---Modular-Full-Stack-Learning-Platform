import { Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

export function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
      <p className="mb-4 text-lg text-gray-600">{message}</p>
      <Link to="/campgrounds" className="text-primary hover:underline">
        Back to campgrounds
      </Link>
    </div>
  )
}
