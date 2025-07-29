$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/seat-occupancy?labId=cmdo87bmr0008vrhcrtax63ui' -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Output "Engineering Lab Summary:"
Write-Output ("Total Seats: " + $data.totalSeats)
Write-Output ("Reserved Seats: " + $data.reservedSeats)

$eng01 = $data.computers | Where-Object { $_.name -eq 'ENG-01' }
Write-Output "ENG-01 Status:"
Write-Output ("Occupancy Status: " + $eng01.occupancyStatus)
Write-Output ("Is Available: " + $eng01.isAvailable)
Write-Output ("Has Booking: " + ($eng01.currentBooking -ne $null))

if ($eng01.currentBooking) {
    Write-Output ("Booking Start: " + $eng01.currentBooking.startTime)
    Write-Output ("Booking End: " + $eng01.currentBooking.endTime) 
    Write-Output ("Booking Status: " + $eng01.currentBooking.status)
    Write-Output ("Booking User: " + $eng01.currentBooking.userName)
}
