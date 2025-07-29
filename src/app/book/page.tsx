'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navigation } from '@/components/Navigation'
import { Calendar, Clock, MapPin, Computer, AlertCircle, CheckCircle } from 'lucide-react'

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

export default function BookPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedLabId = searchParams.get('labId')

  const [labs, setLabs] = useState<Lab[]>([])
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null)
  const [selectedComputer, setSelectedComputer] = useState<string>('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
          
          // Preselect lab if specified
          if (preselectedLabId) {
            const preselectedLab = data.find((lab: Lab) => lab.id === preselectedLabId)
            if (preselectedLab) {
              setSelectedLab(preselectedLab)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch labs:', error)
        setError('Failed to load labs')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchLabs()
    }
  }, [token, preselectedLabId])

  // Set default times (next hour to 2 hours from now)
  useEffect(() => {
    const now = new Date()
    const nextHour = new Date(now)
    nextHour.setHours(now.getHours() + 1, 0, 0, 0)
    
    const endHour = new Date(nextHour)
    endHour.setHours(nextHour.getHours() + 1)

    setStartTime(nextHour.toISOString().slice(0, 16))
    setEndTime(endHour.toISOString().slice(0, 16))
  }, [])

  const handleLabSelect = async (labId: string) => {
    const lab = labs.find(l => l.id === labId)
    if (lab) {
      setSelectedLab(lab)
      setSelectedComputer('')
      
      // Fetch detailed lab info with computers
      try {
        const response = await fetch(`/api/labs/${labId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const detailedLab = await response.json()
          setSelectedLab(detailedLab)
        }
      } catch (error) {
        console.error('Failed to fetch lab details:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    if (!selectedLab) {
      setError('Please select a lab')
      setIsSubmitting(false)
      return
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setError('End time must be after start time')
      setIsSubmitting(false)
      return
    }

    if (new Date(startTime) < new Date()) {
      setError('Cannot book in the past')
      setIsSubmitting(false)
      return
    }

    try {
      const bookingData = {
        labId: selectedLab.id,
        computerId: selectedComputer || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        purpose: purpose || undefined,
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Booking created successfully!')
        setTimeout(() => {
          router.push('/bookings')
        }, 2000)
      } else {
        setError(data.error || 'Failed to create booking')
      }
    } catch (submitError) {
      console.error('Failed to create booking:', submitError)
      setError('Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Book a Computer Lab</h1>
            <p className="mt-2 text-gray-600">
              Reserve computer lab time for your class or project
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Lab Selection */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Computer Lab
              </h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex space-x-4">
                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {labs.map((lab) => (
                    <div
                      key={lab.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedLab?.id === lab.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleLabSelect(lab.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <Computer className="h-8 w-8 text-blue-500" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{lab.name}</h3>
                          {lab.description && (
                            <p className="text-gray-600 text-sm">{lab.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {lab.location}
                            </div>
                            <div className="flex items-center">
                              <Computer className="h-4 w-4 mr-1" />
                              {lab.computers?.length || 0} computers
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Computer Selection (Optional) */}
            {selectedLab && selectedLab.computers && selectedLab.computers.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Select Specific Computer (Optional)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedComputer === ''
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedComputer('')}
                  >
                    <div className="text-center">
                      <Computer className="h-6 w-6 mx-auto text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 mt-1">Any Available</p>
                    </div>
                  </div>
                  {selectedLab.computers
                    .filter(computer => computer.isWorking)
                    .map((computer) => (
                    <div
                      key={computer.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedComputer === computer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedComputer(computer.id)}
                    >
                      <div className="text-center">
                        <Computer className="h-6 w-6 mx-auto text-blue-500" />
                        <p className="text-sm font-medium text-gray-900 mt-1">{computer.name}</p>
                        {computer.specifications && (
                          <p className="text-xs text-gray-500 mt-1">{computer.specifications}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date and Time Selection */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Date and Time
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-2" />
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Purpose (Optional)
              </h2>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the purpose of your lab booking (e.g., Programming Assignment, Research Project, Class Activity)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 font-medium"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedLab}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
