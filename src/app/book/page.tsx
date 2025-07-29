'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navigation } from '@/components/Navigation'
import { MapPin, Computer, Monitor, ChevronRight } from 'lucide-react'

interface Lab {
  id: string
  name: string
  description: string | null
  capacity: number
  location: string
  computers: Computer[]
}

interface Computer {
  id: string
  name: string
  specifications: string | null
  isWorking: boolean
}

function BookPageContent() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [labs, setLabs] = useState<Lab[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await fetch('/api/labs', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setLabs(data)
        } else {
          throw new Error('Failed to fetch labs')
        }
      } catch (err) {
        setError('Failed to load labs')
        console.error('Error fetching labs:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchLabs()
    }
  }, [token])

  const handleLabSelect = (labId: string) => {
    // Navigate directly to the lab's seat selection interface
    router.push(`/labs/${labId}?view=book-seat`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Please log in to book a computer lab session.</p>
          </div>
        </div>
      </div>
    )
  }

  if (user.role !== 'STUDENT') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only students can book computer lab sessions.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book a Computer Lab</h1>
          <p className="mt-2 text-lg text-gray-600">
            Select a computer lab to view available seats and make a reservation
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <div
                key={lab.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleLabSelect(lab.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {lab.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {lab.description}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {lab.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Computer className="h-4 w-4 mr-1" />
                        {lab.computers.length} computers
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Monitor className="h-4 w-4 mr-1" />
                        Capacity: {lab.capacity}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                </div>
                <div className="mt-4">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Select Lab
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && labs.length === 0 && !error && (
          <div className="text-center py-12">
            <Computer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No labs available</h3>
            <p className="text-gray-600">There are currently no computer labs available for booking.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BookPageContent />
    </Suspense>
  )
}
