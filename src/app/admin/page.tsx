'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navigation } from '@/components/Navigation'
import { 
  Users, 
  Computer,
  Calendar,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Clock,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react'
import { 
  calculateRealTimeStatus, 
  getStatusDisplay, 
  formatTimeRange,
  getTimeRemaining,
  type BookingStatus 
} from '@/lib/booking-utils'

interface Stats {
  totalUsers: number
  totalLabs: number
  totalBookings: number
  activeBookings: number
}

interface User {
  id: string
  name: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  createdAt: string
}

interface Lab {
  id: string
  name: string
  location: string
  capacity: number
  _count: {
    computers: number
  }
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string | null
  status: BookingStatus
  user: {
    name: string
    email: string
  }
  lab: {
    name: string
  }
  computer: {
    name: string
  } | null
}

export default function AdminPage() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddLabModal, setShowAddLabModal] = useState(false)
  const [showEditLabModal, setShowEditLabModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT'
  })
  const [editingLab, setEditingLab] = useState<Lab | null>(null)
  const [newLab, setNewLab] = useState({
    name: '',
    location: '',
    capacity: '',
    description: ''
  })
  const [editLab, setEditLab] = useState({
    name: '',
    location: '',
    capacity: '',
    description: ''
  })
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT'
  })

  const fetchData = useCallback(async () => {
    try {
      // Fetch stats, users, labs, and bookings in parallel
      const [statsRes, usersRes, labsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/labs', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (labsRes.ok) {
        const labsData = await labsRes.json()
        setLabs(labsData)
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }
    } catch (fetchError) {
      console.error('Failed to fetch admin data:', fetchError)
      setError('Failed to load admin data')
    }
  }, [token])

  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
      return
    }
    
    // Set default tab based on role
    if (user?.role === 'TEACHER') {
      setActiveTab('bookings')
    }
    
    fetchData()
  }, [user, token, fetchData])

  // Real-time updates for booking statuses every second for precise timers
  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
      return
    }

    const interval = setInterval(() => {
      setBookings(currentBookings => 
        currentBookings.map(booking => ({
          ...booking,
          // Force re-render to update real-time status and precise timers
        }))
      )
    }, 1000) // Update every second for precise countdown timers

    return () => clearInterval(interval)
  }, [user])

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: action === 'approve' ? 'APPROVED' : 'REJECTED' 
        }),
      })

      if (response.ok) {
        setSuccess(`Booking ${action}d successfully`)
        fetchData() // Refresh data
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${action} booking`)
        setTimeout(() => setError(''), 5000)
      }
    } catch (updateError) {
      console.error(`Failed to ${action} booking:`, updateError)
      setError(`Failed to ${action} booking`)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleViewLab = (labId: string) => {
    // Navigate to lab details page
    window.open(`/labs/${labId}`, '_blank')
  }

  const handleEditLab = (lab: Lab) => {
    setEditingLab(lab)
    setEditLab({
      name: lab.name,
      location: lab.location,
      capacity: lab.capacity.toString(),
      description: '' // We don't have description in the Lab interface, but the API supports it
    })
    setShowEditLabModal(true)
  }

  const handleUpdateLab = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingLab || !editLab.name || !editLab.location || !editLab.capacity) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(''), 5000)
      return
    }

    try {
      const response = await fetch(`/api/labs/${editingLab.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editLab.name,
          location: editLab.location,
          capacity: parseInt(editLab.capacity),
          description: editLab.description || null,
        }),
      })

      if (response.ok) {
        setSuccess('Lab updated successfully')
        setShowEditLabModal(false)
        setEditingLab(null)
        setEditLab({ name: '', location: '', capacity: '', description: '' })
        fetchData() // Refresh data
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update lab')
        setTimeout(() => setError(''), 5000)
      }
    } catch (updateError) {
      console.error('Failed to update lab:', updateError)
      setError('Failed to update lab')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleDeleteLab = async (labId: string, labName: string) => {
    if (!confirm(`Are you sure you want to delete the lab "${labName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSuccess('Lab deleted successfully')
        fetchData() // Refresh data
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete lab')
        setTimeout(() => setError(''), 5000)
      }
    } catch (deleteError) {
      console.error('Failed to delete lab:', deleteError)
      setError('Failed to delete lab')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleAddLab = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newLab.name || !newLab.location || !newLab.capacity) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(''), 5000)
      return
    }

    try {
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newLab.name,
          location: newLab.location,
          capacity: parseInt(newLab.capacity),
          description: newLab.description || null,
        }),
      })

      if (response.ok) {
        setSuccess('Lab created successfully')
        setShowAddLabModal(false)
        setNewLab({ name: '', location: '', capacity: '', description: '' })
        fetchData() // Refresh data
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create lab')
        setTimeout(() => setError(''), 5000)
      }
    } catch (createError) {
      console.error('Failed to create lab:', createError)
      setError('Failed to create lab')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(''), 5000)
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        }),
      })

      if (response.ok) {
        setSuccess('User created successfully')
        setShowAddUserModal(false)
        setNewUser({ name: '', email: '', password: '', role: 'STUDENT' })
        fetchData() // Refresh data
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create user')
        setTimeout(() => setError(''), 5000)
      }
    } catch (createError) {
      console.error('Failed to create user:', createError)
      setError('Failed to create user')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditUser({
      name: user.name,
      email: user.email,
      password: '', // Leave password empty for optional update
      role: user.role
    })
    setShowEditUserModal(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editUser.name || !editUser.email || !editUser.role) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(''), 5000)
      return
    }

    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      })

      if (response.ok) {
        setSuccess('User updated successfully')
        setShowEditUserModal(false)
        setEditingUser(null)
        setEditUser({ name: '', email: '', password: '', role: 'STUDENT' })
        fetchData() // Refresh data
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update user')
        setTimeout(() => setError(''), 5000)
      }
    } catch (updateError) {
      console.error('Failed to update user:', updateError)
      setError('Failed to update user')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSuccess('User deleted successfully')
        fetchData() // Refresh data
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete user')
        setTimeout(() => setError(''), 5000)
      }
    } catch (deleteError) {
      console.error('Failed to delete user:', deleteError)
      setError('Failed to delete user')
      setTimeout(() => setError(''), 5000)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Teacher Dashboard'}
            </h1>
            <p className="mt-2 text-gray-600">
              {user?.role === 'ADMIN' 
                ? 'Manage users, labs, and bookings' 
                : 'Manage lab booking requests'}
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

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                ...(user?.role === 'ADMIN' ? [{ id: 'overview', label: 'Overview', icon: BarChart3 }] : []),
                { id: 'bookings', label: 'Bookings', icon: Calendar },
                ...(user?.role === 'ADMIN' ? [
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'labs', label: 'Labs', icon: Computer },
                ] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab - Admin Only */}
          {activeTab === 'overview' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <Computer className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Labs</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalLabs}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-orange-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {bookings.map((booking) => {
                  const realTimeStatus = calculateRealTimeStatus(booking)
                  const statusDisplay = getStatusDisplay(realTimeStatus)
                  const timeRemaining = realTimeStatus === 'APPROVED' 
                    ? getTimeRemaining(booking.startTime)
                    : realTimeStatus === 'IN_PROGRESS'
                    ? getTimeRemaining(booking.endTime)
                    : null
                  
                  // Debug logging
                  if (timeRemaining) {
                    console.log(`Booking ${booking.id}: Status=${realTimeStatus}, TimeRemaining=`, timeRemaining)
                  }
                  
                  return (
                    <div key={booking.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {booking.user.name}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                              {statusDisplay.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{booking.user.email}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.lab.name}
                            </div>
                            {booking.computer && (
                              <div className="flex items-center">
                                <Computer className="h-4 w-4 mr-1" />
                                {booking.computer.name}
                              </div>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTimeRange(booking.startTime, booking.endTime)}
                            </div>
                            {timeRemaining && (
                              <div className="flex items-center mt-1 px-2 py-1 bg-blue-50 rounded">
                                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                                <span className={`font-medium text-sm ${timeRemaining.isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                                  {realTimeStatus === 'IN_PROGRESS' ? ' Ends in ' : ' Starts in '}{timeRemaining.text}
                                </span>
                              </div>
                            )}
                          </div>
                          {booking.purpose && (
                            <p className="mt-1 text-sm text-gray-600">
                              <strong>Purpose:</strong> {booking.purpose}
                            </p>
                          )}
                        </div>
                        {booking.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleBookingAction(booking.id, 'approve')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.id, 'reject')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Users Tab - Admin Only */}
          {activeTab === 'users' && user?.role === 'ADMIN' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">System Users</h3>
                <button 
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Labs Tab - Admin Only */}
          {activeTab === 'labs' && user?.role === 'ADMIN' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Computer Labs</h3>
                <button 
                  onClick={() => setShowAddLabModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lab
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {labs.map((lab) => (
                  <div key={lab.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{lab.name}</h4>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleViewLab(lab.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Lab Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditLab(lab)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Lab"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLab(lab.id, lab.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Lab"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {lab.location}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Capacity: {lab.capacity}</span>
                      <span>Computers: {lab._count.computers}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Lab Modal */}
      {showAddLabModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Lab</h3>
                <button
                  onClick={() => setShowAddLabModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddLab}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lab Name *
                    </label>
                    <input
                      type="text"
                      value={newLab.name}
                      onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter lab name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={newLab.location}
                      onChange={(e) => setNewLab({ ...newLab, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter location"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      value={newLab.capacity}
                      onChange={(e) => setNewLab({ ...newLab, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter capacity"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newLab.description}
                      onChange={(e) => setNewLab({ ...newLab, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter description (optional)"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddLabModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Lab
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lab Modal */}
      {showEditLabModal && editingLab && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Lab</h3>
                <button
                  onClick={() => {
                    setShowEditLabModal(false)
                    setEditingLab(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateLab}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lab Name *
                    </label>
                    <input
                      type="text"
                      value={editLab.name}
                      onChange={(e) => setEditLab({ ...editLab, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter lab name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={editLab.location}
                      onChange={(e) => setEditLab({ ...editLab, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter location"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      value={editLab.capacity}
                      onChange={(e) => setEditLab({ ...editLab, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter capacity"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editLab.description}
                      onChange={(e) => setEditLab({ ...editLab, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter description (optional)"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditLabModal(false)
                      setEditingLab(null)
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Lab
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter password"
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      required
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditUserModal(false)
                  setEditingUser(null)
                  setEditUser({ name: '', email: '', password: '', role: 'STUDENT' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editUser.name}
                      onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter email"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password (leave empty to keep current)
                    </label>
                    <input
                      type="password"
                      value={editUser.password}
                      onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Enter new password (optional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={editUser.role}
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      required
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUserModal(false)
                      setEditingUser(null)
                      setEditUser({ name: '', email: '', password: '', role: 'STUDENT' })
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
